// meterMaid is designed to poll Honeywell wifi thermostats for current settings and readings.  It utilizes an older API to access the thermostats and their settings and readings in a database for later use.

// program structure....
// 1.  get the userid and password for logging into the Honeywell platform.  TODO:  implement mulit-user via the users credentials that we capture on the front-end.
// 2.  use the API to request all locations and current reading for each location.  The current Honeywell API returns XML so it gets transformed to JSON.
// 3.  Use the transformed JSON to process the poll results

var moment = require ('moment');
var config = require('../config');
var createActivity = require('../utility/createActivity');

var sessionID = '';
var pollResults = [];

console.log("Start of processing....");
getHoneywellSessionId()
.then((sessionID) => {
  pollHoneywellUserData()
  .then((pollResults) => {
    logoffHoneywell();
    processHoneywellPoll(pollResults);
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
  var mysql = require('mysql');
  var dbInsertPromises = [];  //TODO: PROMISES


  poll.map((site) => {
    checkLocationHours(site.LocationData.LocationID)
    .then((hasLocationHours) => {
      console.log(hasLocationHours);
    });
  }); // poll.map

}; // processHoneywellPoll
function checkLocationHours(locationID){
  // Check the DB to see if the user has established LocationHours.
  console.log(`locationID: ${locationID}`);

  return( new Promise (function(resolve, reject) {
    resolve(true);
  }));
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
