// meterMaid is designed to poll Honeywell wifi thermostats for current settings and readings.  It utilizes an older API to access the thermostats and their settings and readings in a database for later use.

// program structure....
// 1.  get the userid and password for logging into the Honeywell platform.  TODO:  implement mulit-user via the users credentials that we capture on the front-end.
// 2.  use the API to request all locations and current reading for each location.  The current Honeywell API returns XML so it gets transformed to JSON.
// 3.  Use the transformed JSON to process the poll results

// these will be GLOBAL......
config = require('../config/config');
mysql = require('mysql');
dbConnection = mysql.createConnection(config.db);

// these are LOCAL.......
var createActivity = require('../utility/createActivity');

var sessionID = '';
var pollResults = [];

console.log("Start of processing....");
getHoneywellSessionId()
.then((sessionID) => {
  pollHoneywellUserData()
  .then((pollResults) => {
    logoffHoneywell();
    dbConnection.connect();
    processHoneywellPoll(pollResults)
    .then(() => {
      console.log("dbConnection CLOSING!")
      dbConnection.end();
    });
  });
}); //getHoneywellSessionId.then

console.log("!!!!!Next Lines of Main Code Are Running!!!!!")
// console.log (pollResults);

function processHoneywellPoll(poll){
  // Poll data contains Location information for each site the user has registered with Honeywell.  There is also Thermostat and Reading data with each Poll.
  // Iterate through Locations, Thermostat, and Readings...
  // With each iteration:
  // 1.  Check to see if there are LocationHours in our DB.  These are used to determine if the Reading occurred during business hours or not.  This is a critical boolean value for the overall system.
  // 2.  If there are no LocationHours, create an Activity to remind the user that they need to define them in order to get value from the system.
  // 3.  Format a complete Reading record and INSERT it into our DB.

  var saveReadingsPromisesArray = [];

  var pollFinishedPromise = new Promise (function(resolve, reject) {

    var readyToFormatPromise = null;

    poll.map((site) => {
      // console.log(site);
      checkLocationHours(site)
      .then((hasLocationHours) => {
        isOpenDuringPoll = false;
        if(hasLocationHours){
          readyToFormatPromise = checkIsOpenDuringPoll(site);
        } else {
          readyToFormatPromise = createLocationHoursActivity(site);
        };
        readyToFormatPromise.then(() => {
          saveReadingsPromisesArray.push(saveReadingsProcess(site));
          Promise.all(saveReadingsPromisesArray).then(() => {
            resolve(true);
          });
          console.log("***********PROMISES PROMISES***************")
          console.log(saveReadingsPromisesArray);
        });  // readyToFormatPromise.then
      }); //  checkLocationHours.then
    }); // poll.Map
    // Promise.all(saveReadingsPromisesArray).then(() => {
    //   resolve(true); // pollFinishedPromise
    // });
  })
  .catch((err) => {
    console.log(err);
  });

  // Promise.all(saveReadingsPromisesArray).then(() => {
  //   resolve(true); // pollFinishedPromise
  // });

  return(pollFinishedPromise);
}; // processHoneywellPoll

function saveReadingsProcess(site){
  console.log("saveReadingsProcess");

  translateHoneywellValues(site);

  var dbPromise = new Promise (function(resolve, reject) {

    confirmFreshReading(site).then(()=>{



    // some shortcut vars.....
    var sL = site.LocationData;
    var sT = site.ThermostatData;
    var sR = site.ThermostatReadingData;

    var insertReadingsSQL = `INSERT INTO Readings (thermostatId,thermCreated,thermLocked,dispTemp,heatSetPoint,coolSetPoint,displayUnits,statusHeat,statusCool,heatLowerSetPt,heatUpperSetPt,coolLowerSetPt,coolUpperSetPt,schedHeatSp,schedCoolSp,systemSwitchPos,equipmentStatus,fanPosition,fanRunning,weatherIsDefined,weatherIsValid,weatherTemp,weatherTempUnit,weatherCondition,operatingHoursFlag,thermCreatedDay, thermCreatedHour, thermCreatedMin)  VALUES (${sT.ThermostatID}, "${sR.Created}", ${sR.thermLocked}, ${sR.DispTemperature}, ${sR.HeatSetpoint}, ${sR.CoolSetpoint},"${sR.DisplayedUnits}", ${sR.StatusHeat}, ${sR.StatusCool}, ${sR.HeatLowerSetptLimit}, ${sR.HeatUpperSetptLimit}, ${sR.CoolLowerSetptLimit}, ${sR.CoolUpperSetptLimit}, ${sR.SchedHeatSp},${sR.SchedCoolSp},
    ${sR.SystemSwitchPosition}, "${sT.EquipmentStatus}", "${sT.Fan[0].Position}", ${sR.fanRunning}, ${sR.weatherIsDefined}, ${sR.weatherIsValid}, ${sL.CurrentWeather[0].Temperature}, "${sL.CurrentWeather[0].TempUnit}", "${sL.CurrentWeather[0].Condition}", ${sR.isOpenDuringPoll}, ${sR.thermCreatedDay}, ${sR.thermCreatedHour}, ${sR.thermCreatedMin});`;

    dbConnection.query(insertReadingsSQL, function (err, result) {
      if (err){
        reject(err);
      } else {
        console.log("Reading record inserted");
        resolve(result);
      };
    }); //query
  })
  .catch((err) => {
    console.log(err);
  });
})
.catch((err) => {
  console.log(err);
});

  return(dbPromise);

};  // saveReadingsProcess

function confirmFreshReading(site){
  // Find readings for this thermostat with the same datatimestamp...
  // Apply the 3 strikes rule....
  // Create an Activity for a "LostConnection" if 3 or more found...
  // TODO:  Can optimize this code by using an array of promises on the outside...will allow parallel units of work.  Right now we are serializing.

  // some shortcut vars.....
  var sL = site.LocationData;
  var sT = site.ThermostatData;
  var sR = site.ThermostatReadingData;

  var dbPromise = new Promise (function(resolve, reject) {
    var freshReadingSQL = `SELECT thermostatId, COUNT(*) as readingsCount FROM Readings WHERE thermostatId = ${sT.ThermostatID} AND thermCreated = '${sR.Created}';`;

    dbConnection.query(freshReadingSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      } else {
        console.log(results);
        console.log(`results[0].readingsCount: ${results[0].readingsCount}`);
        if (results[0].readingsCount >= 3){  // 3 strikes rule!
          createLostConnectionActivity(site, results[0].readingsCount).then(() => {
            resolve(false);
          });
        } else {
          resolve(true);
        };
      };
    });  // dbConnection.query

  }) // dbPromise
  .catch((err) => {
    console.log(err);
  }); // dbPromise


  return(dbPromise);
}; // confirmFreshReading

function createLostConnectionActivity(site, count){
  console.log("createLostConnectionActivity");
  // Use a utility function here to insert into the ActivityLog table....
  activityObj.locationId = site.LocationData.LocationID;
  activityObj.triggerId = 2; // LostConnection
  activityObj.message = `From meterMaid:  Lost connection? No change in  ${count} polls`;

  var dbPromise = createActivity(dbConnection, activityObj);  // createActivity returns a promise

  return(dbPromise);
}; // createLostConnectionActivity

function translateHoneywellValues(site){
  console.log("translateHoneywellValues");
  // Some values need to be evaluated and translated...do that here
  // some shortcut vars.....
  var sL = site.LocationData;
  var sT = site.ThermostatData;
  var sR = site.ThermostatReadingData;

  var moment = require ('moment');
  // parsing out and storing the datetime into different components provides a lot of flexibility later on...
  var mDate = moment(sR.Created, moment.ISO_8601);
  sR.thermCreatedDay = mDate.day();
  sR.thermCreatedHour = mDate.hour();
  sR.thermCreatedMin = mDate.minute();

  if (sT.UI[0].ThermostatLocked == 'true'){
    sR.thermLocked = true;
  }
  else{
    sR.thermLocked = false;
  }

  if (theThermostatsData.Fan[0].IsFanRunning == 'true'){
    sR.fanRunning = true;
  }
  else{
    sR.fanRunning = false;
  }

  if (theThermostatsData.Fan[0].CanSetOn == 'true'){
    sR.fanCanSetOn = true;
  }
  else{
    sR.fanCanSetOn = false;
  }

  if (theLocationsData.CurrentWeather[0].IsDefined == 'true'){
    sR.weatherIsDefined = true;
  }
  else{
    sR.weatherIsDefined = false;
  }

  if (theLocationsData.CurrentWeather[0].IsValid == 'true'){
    sR.weatherIsValid= true;
  }
  else{
    sR.weatherIsValid = false;
  }
};  //translateHoneywellValues

function createLocationHoursActivity(site){
  console.log("createLocationHoursActivity");
  // Use a utility function here to insert into the ActivityLog table....
  activityObj.locationId = site.LocationData.LocationID;
  activityObj.triggerId = 1; // NoLocationHours
  activityObj.message = 'From meterMaid:  No locationHours';

  var dbPromise = createActivity(dbConnection, activityObj);  // createActivity returns a promise

  return(dbPromise);
}; // createLocationHoursActivity

function checkIsOpenDuringPoll(site){

  console.log("checkIsOpenDuringPoll");

  var moment = require ('moment');

  var mDate = moment(site.ThermostatReadingData.Created, moment.ISO_8601);
  var dayOfWeek = mDate.day();
  var hour = mDate.hour();
  var minute = mDate.minute();

  var militaryTime = (hour * 100) + minute;
  console.log(`militaryTime: ${militaryTime}`);

  var dbPromise = new Promise (function(resolve, reject) {
    var checkOpenSQL = `SELECT * FROM LocationHours WHERE locationId = ${site.LocationData.LocationID} AND dayOfWeek = ${dayOfWeek} AND ((${militaryTime} >= openHour) AND (${militaryTime} <= closeHour));`;

    // console.log(checkOpenSQL);

    dbConnection.query(checkOpenSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      }
      else {
        if (results.length > 0){  // Found match..open!
          console.log(`${site.LocationData.LocationID} is OPEN`);
          site.ThermostatReadingData.isOpenDuringPoll = true;
          resolve(true);
        } else {
          console.log(`${site.LocationData.LocationID} is CLOSED`);
          site.ThermostatReadingData.isOpenDuringPoll = false;
          resolve(false);  // No match....closed!
        };
      };
    });
  })
  .catch((err) => {
    console.log(err);
  });
  return(dbPromise);
}; // checkIsOpenDuringPoll

function checkLocationHours(site){
  // Check the DB to see if the user has established LocationHours.  Default the isOpenDuringPoll the Reading to false, it may be overwritten later.

  console.log("checkLocationHours");

  var dbPromise = new Promise (function(resolve, reject) {
    var checkLocationHoursSQL = `SELECT * from LocationHours WHERE locationId = ${site.LocationData.LocationID};`;

    dbConnection.query(checkLocationHoursSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      }
      else {
        site.ThermostatReadingData.isOpenDuringPoll = false;
        if (results.length > 0){  // locationHours exist!
          site.LocationData.hasLocationHours = true;
          resolve(true);
        } else {
          site.LocationData.hasLocationHours = false;
          resolve(false);  // no locationHours found
        };
      };
    });
  })
  .catch((err) => {
    console.log(err);
  });
  return(dbPromise);
}; // checkLocationHours

function getHoneywellSessionId(){
// Get user id and password.....// TODO: encrypt/decrypt for security
var fsIdPass = require('fs');
var idPassRecord = '';

// Use synchronous read as we really can't do anything else until we have the userId and password....TODO:  this needs to come from the DB eventually
// idPassRecord = fsIdPass.readFileSync('../myThermostats.txt', 'utf8');
//
// var userIdPass = idPassRecord.split("|");
// var trimmedUserPass = userIdPass[1].trim();

// Now format then make the request for a sessionId....using curl
// alternate version had to format this way to avoid having OS interpret the & as 'run in background'
var curlRequest = `curl -s -k -X 'POST' -H 'Content-Type: application/x-www-form-urlencoded' -H 'User-Agent: Apache-HttpClient/UNAVAILABLE (java 1.4)' \
'https://tccna.honeywell.com/ws/MobileV2.asmx/AuthenticateUserLogin' \
-d applicationID=a0c7a795-ff44-4bcd-9a99-420fac57ff04 \
-d ApplicationVersion=2 \
-d Username=${config.honeywellUID} \
-d UiLanguage=English \
-d Password=${config.honeywellPass}
`;

// need to ask the OS to exec the curl command for us...
var util = require('util');
var exec = require('child_process').exec;
var parseString = require('xml2js').parseString;

var command = curlRequest;
var xmlResponse = "";

//stdout is the response from the OS.  In this case it will be XML.
  sessionPromise = new Promise (function(resolve, reject) {
    child = exec(command, function(error, xmlResponse, stderr){
      // console.log("AuthenticateUserLogin...")
      // console.log('stdout: ' + xmlResponse);
      // console.log('stderr: ' + stderr);

      if(error !== null) {
        console.log('exec error: ' + error);
        reject();
      };

      parseString(xmlResponse, function (error, result) {
          // console.log("parsing");
          // console.log(result);
          // console.log(error);
          sessionID = result.AuthenticateLoginResult.SessionID;
          resolve(sessionID);
      });
      // console.log(`sessionID: ${sessionID}`);
    });  // curl command
  })
  .catch((err) => {
    return(err);
  }); // new Promise

  return(sessionPromise);
};  // getHoneywellSessionId

function pollHoneywellUserData() {

  // need to ask the OS to exec the curl command for us...
  var util = require('util');
  var exec = require('child_process').exec;
  var parseString = require('xml2js').parseString;
  var xmlResponse = '';

// Now use the sessionID to poll this user's account and get readings for all thermostats....
  curlRequest = `curl -H "Accept: application/xml" -H "Content-Type: application/xml" -X GET 'https://tccna.honeywell.com//ws/MobileV2.asmx/GetLocations?sessionID=${sessionID}'`;

  command = curlRequest;
  pollUserPromise = new Promise (function(resolve, reject) {
    child = exec(command, function(error, xmlResponse, stderr){
      // console.log("GetLocations...")
      // console.log('stdout: ' + xmlResponse);
      // console.log('stderr: ' + stderr);

      if(error !== null) {
        console.log('exec error: ' + error);
        reject();
      };
      pollResults = transformPollResults(xmlResponse);
      resolve(pollResults);
    });  // curl for GetLocations
  })
  .catch((err) => {
    return(err);
  }); // new Promise
  return(pollUserPromise);
};  // pollHoneywellUserData

function logoffHoneywell() {

  // need to ask the OS to exec the curl command for us...
  var util = require('util');
  var exec = require('child_process').exec;
  var parseString = require('xml2js').parseString;
  var xmlResponse = '';

  // logoff the session with Honeywell
  curlRequest = `curl -H "Accept: application/xml" -H "Content-Type: application/xml" -X GET 'https://tccna.honeywell.com//ws/MobileV2.asmx/LogOff?sessionID=${sessionID}'`;

  command = curlRequest;
  child = exec(command, function(error, xmlResponse, stderr){
    console.log ("LogOff Honeywell...")
    // console.log('stdout: ' + xmlResponse);
    // console.log('stderr: ' + stderr);

    if(error !== null) {
      console.log('exec error: ' + error);
    };

  });  // curl for Logoff
}; // logoffHoneywell

function transformPollResults(xmlResponse){
  // Transform the xml response to JSON
  var parseString = require('xml2js').parseString;
  var locationsPoll = [];
  parseString(xmlResponse, function (error, results) {
    if (error !== null) {    // TODO: beef up error checking...
      console.log(error);
    };
    for (let i = 0; i < results.GetLocationsResult.Locations[0].LocationInfo.length; i++){
      theLocationsData = results.GetLocationsResult.Locations[0].LocationInfo[i];
      theThermostatsData = results.GetLocationsResult.Locations[0].LocationInfo[i].Thermostats[0].ThermostatInfo[0];
      theThermostatReadingsData = results.GetLocationsResult.Locations[0].LocationInfo[i].Thermostats[0].ThermostatInfo[0].UI[0];
      locationsPoll.push({LocationData: theLocationsData,
                          ThermostatData:  theThermostatsData,
                          ThermostatReadingData: theThermostatReadingsData });
    };
  });
  return(locationsPoll);
}; // transformPollResults
