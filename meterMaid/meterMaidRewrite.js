// meterMaid is designed to poll Honeywell wifi thermostats for current settings and readings.  It utilizes an older API to access the thermostats and their settings and readings in a database for later use.

// program structure....
// 1.  get the userid and password for logging into the Honeywell platform.  TODO:  implement mulit-user via the users credentials that we capture on the front-end.
// 2.  use the API to request all locations and current reading for each location.  The current Honeywell API returns XML so it gets transformed to JSON.
// 3.  Use the transformed JSON to process the poll results

// these will be GLOBAL......
config = require('../config');
mysql = require('mysql');
dbConnection = mysql.createConnection(config.db);

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
      dbConnection.end();
    });
  });
}); //getHoneywellSessionId.then

console.log("!!!!!Next Lines of Main Code Are Running!!!!!")
// console.log (pollResults);

function processHoneywellPoll(poll){
  // Poll contains Location information for each site the user has registered with Honeywell.  There is also Thermostat and Reading data with each Poll.
  // Iterate through Locations, Thermostat, and Readings...
  // With each iteration:
  // 1.  Check to see if there are LocationHours in our DB.  These are used to determine if the Reading occurred during business hours or not.  This is a critical boolean value for the overall system.
  // 2.  If there are no LocationHours, create an Activity to remind the user that they need to define them in order to get value from the system.
  // 3.  Format a complete Reading record and INSERT it into our DB.

  // We'll open and close the DB from this function...
  // assignment without declaration makes these GLOBAL!
  // dbConnection.connect();

  var pollFinishedPromise = new Promise (function(resolve, reject) {

    var readyToFormatPromise = null;

    var mapPromise = poll.map((site) => {
      // console.log(site);
      checkLocationHours(site)
      .then((hasLocationHours) => {
        isOpenDuringPoll = false;
        if(hasLocationHours){
          readyToFormatPromise = checkIsOpenDuringPoll(site);
        } else {
          readyToFormatPromise = createLocationHoursActivity(site);
        };
        readyToFormatPromise
        .then((site) => {
          saveReadingsProcess(site);
          resolve(true);
        });
      });
    }); // poll.map
  })
  .catch((err) => {
    console.log(err);
  });
  
  return(pollFinishedPromise);
}; // processHoneywellPoll

function saveReadingsProcess(site){
  console.log("saveReadingsProcess");
  console.log(site);
};
function createLocationHoursActivity(site){
  console.log("createLocationHoursActivity");

  var dbPromise = new Promise (function(resolve, reject) {
    resolve(true);
  })
  .catch((err) => {
    console.log(err);
  });
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

    dbConnection.query(checkOpenSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      }
      else {
        if (results.length > 0){  // Found match..open!
          console.log(`${site.LocationData.LocationID} is OPEN`);
          isOpenDuringPoll = true;  // kludge with GLOBAL
          resolve(true);
        } else {
          console.log(`${site.LocationData.LocationID} is CLOSED`);
          isOpenDuringPoll = false; // kludge with GLOBAL
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
  // Check the DB to see if the user has established LocationHours.
  console.log("checkLocationHours");

  var dbPromise = new Promise (function(resolve, reject) {
    var checkLocationHoursSQL = `SELECT * from LocationHours WHERE locationId = ${site.LocationData.LocationID};`;

    dbConnection.query(checkLocationHoursSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      }
      else {
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

// Use synchronous read as we really can't do anything else until we have the userId and password....
idPassRecord = fsIdPass.readFileSync('../myThermostats.txt', 'utf8');

var userIdPass = idPassRecord.split("|");
var trimmedUserPass = userIdPass[1].trim();

// Now format then make the request for a sessionId....using curl
// alternate version had to format this way to avoid having OS interpret the & as 'run in background'
var curlRequest = `curl -s -k -X 'POST' -H 'Content-Type: application/x-www-form-urlencoded' -H 'User-Agent: Apache-HttpClient/UNAVAILABLE (java 1.4)' \
'https://tccna.honeywell.com/ws/MobileV2.asmx/AuthenticateUserLogin' \
-d applicationID=a0c7a795-ff44-4bcd-9a99-420fac57ff04 \
-d ApplicationVersion=2 \
-d Username=${userIdPass[0]} \
-d UiLanguage=English \
-d Password=${trimmedUserPass}
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
  // Transform the xml to JSON
  // For each Location...
  // A.  Next release?  check to see if user exists or needs to be initialized
  // 1.  Check to see if we have Operating Hours set up
  // 2.  If we do, then check to see if the reading took place during Operating LocationHours
  // 3.  If we don't have Operating Hours set up, set an activity that will be used to remind the user to set them up.
  // 4.  Format reading record.
  // 5.  Insert the reading record.
  // Close the db after all poll results have been processed.
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
