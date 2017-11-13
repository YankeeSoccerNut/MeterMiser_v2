var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
var secure_pass = require('../utility/securepass');
var getHoneywellSessionId = require('../utility/getHoneywellSessionId');

function hasQueryString(req) {

  if (Object.keys(req.query).length == 0) {
    return false;
  }
  return true;
};

// // From stackoverflow response on securing routes...
// function secure_pass(req, res, next) {
//     console.log ("in secure_pass...");
//     req.session.loggedIn = true;
//     console.log(req.session.loggedIn);
//     if (req.session.loggedIn){
//         next();
//     } else {
//        res.send("Unauthorized");
//     };
// };


// This route is only for API requests...
router.get('/', function(req, res, next) {
  res.send("Invalid Request");
});

//Handle inbound SMS response from user via Twilio....
router.post('/twilioInbound', function(req, res, next) {
  const MessagingResponse = require('twilio').twiml.MessagingResponse;

  const response = new MessagingResponse();
  const message = response.message();
  message.body('meterMiser Received and Acknowledged');
  response.redirect('https://demo.twilio.com/sms/welcome');

  console.log(response.toString());
  res.send(response.toString());
});

router.get('/Users', secure_pass, function(req, res, next) {

  var mysql = require('mysql');

  // open up the database connection...
  var dbConnection = mysql.createConnection(config.db);
  dbConnection.connect();

  var selectUsersSQL = '';

  if (hasQueryString(req)) {
    selectUsersSQL = `SELECT * FROM Users WHERE email = ${(req.query.email)}`;
  } else {
    selectUsersSQL = `SELECT * FROM Users`;
  };


  dbConnection.query(selectUsersSQL, function (err, result) {
    if (err){
      console.log(err);
    } else {
    console.log("Locations record selected");
    }
    res.send(result);

    // Close the database connection...
    dbConnection.end();

  });
});

router.get('/Locations', secure_pass, function(req, res, next) {
  // See if any parameters passed in with a query..../?parm1=val&parm2
  // Only valid one here is a locationId

  var selectLocationsSQL = '';

  if (hasQueryString(req)) {
    selectLocationsSQL = `SELECT * FROM Locations, Thermostats WHERE Locations.locationId = ${parseInt(req.query.locationId)} && Locations.locationId = Thermostats.locationId`;
  } else {
    selectLocationsSQL = `SELECT * FROM Locations, Thermostats WHERE Locations.locationId = Thermostats.locationId`;
  };

  var mysql = require('mysql');

  // open up the database connection...
  var dbConnection = mysql.createConnection(config.db);
  dbConnection.connect();

  dbConnection.query(selectLocationsSQL, function (err, result) {
    if (err){
      console.log(err);
    } else {
    console.log("Locations record selected");
    }
    res.send(result);

    // Close the database connection...
    dbConnection.end();
  });
});

router.get('/Thermostats', secure_pass, function(req, res, next) {
  // Supports all thermostats for user,  all thermostats for user for a location, or a specific thermostat for the user

  if (hasQueryString(req)) {
    var thermostatId = parseInt(req.query.thermostatId);
    var locationId = parseInt(req.query.locationId);
    if ((thermostatId > 0) && (locationId > 0)){
      console.log("WAT? One or the other, not both")
    } else if (thermostatId > 0) {
      selectThermostatsSQL = `SELECT * FROM Thermostats WHERE thermostatId = ${parseInt(req.query.thermostatId)}`;
    } else if (locationId > 0) {
      selectThermostatsSQL = `SELECT * FROM Thermostats WHERE locationId = ${parseInt(req.query.locationId)}`;
    } else {
      console.log("WAT? Query string doesn't make sense")
    };
  } else {
    var selectThermostatsSQL = `SELECT * FROM Thermostats`;
  };

  var mysql = require('mysql');

  // open up the database connection...
  var dbConnection = mysql.createConnection(config.db);
  dbConnection.connect();

  // Send the SQL...
  dbConnection.query(selectThermostatsSQL, function (err, result) {
    if (err){
      console.log(err);
    } else {
    console.log("Thermostat record selected");
    }
    res.send(result);

    // Close the database connection...
    dbConnection.end();

  });
});


router.get('/Readings', secure_pass, function(req, res, next) {
  // Supports All Readings, Readings for a Thermostat across ALL time
  // Also supports All Readings, Readings for a Thermostat BETWEEN Start and End Dates (Inclusive).  Dates come in Gregorian Format - 'CCYY-MM-DD'
  var thermostatId = 0;
  var startDate = '';
  var endDate = '';

  if (hasQueryString(req)) {
    var thermostatId = parseInt(req.query.thermostatId);
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;

    if ((thermostatId > 0) && (startDate > '') && (endDate > '')){
      console.log("Specific query with all query string properties...")
      selectReadingsSQL = `SELECT * FROM Readings WHERE thermostatId = ${thermostatId} AND thermCreated >= ${startDate} AND thermCreated <= ${endDate}`;
    } else if ((startDate > '') && (endDate > '')) {
      selectReadingsSQL = `SELECT * FROM Readings WHERE thermCreated >= ${startDate} AND thermCreated <= ${endDate}`;
    } else if ((startDate > '') || (endDate > '')) {  // query string incorrect
      console.log("Unsupported query string combination for Readings table");
    } else if (thermostatId > 0) {
      selectReadingsSQL = `SELECT * FROM Readings WHERE thermostatId = ${thermostatId}`;
    } else {
      console.log("WAT? Unsupported query string");
    };
  } else {
    var selectReadingsSQL = `SELECT * FROM Readings`;
  };

  var mysql = require('mysql');

  // open up the database connection...
  var dbConnection = mysql.createConnection(config.db);
  dbConnection.connect();

  dbConnection.query(selectReadingsSQL, function (err, result) {
    if (err){
      console.log(err);
    } else {
    console.log("Locations record selected");
    }
    res.send(result);

    // Close the database connection...
    dbConnection.end();

  });
});

router.get('/Now', secure_pass, function(req, res, next) {

  // This route is a bit different in that it needs to make a realtime call to the Honeywell API

  // Steps:
  // 1.  Confirm we have the locationId
  // 2.  Read in the userId/pwd for the API call
  // 3.  Make a curl request to get a session id
  // 4.  Use the session for subsequent API call
  // 5.  Format and return the JSON response.


  if (!hasQueryString(req)) {
    res.send("Missing thermostatId");
  }

  var thermostatId = parseInt(req.query.thermostatId);

  // Get user id and password.....// TODO: encrypt/decrypt for security
  var fsIdPass = require('fs');
  var idPassRecord = '';

  // Use synchronous read as we really can't do anything else until we have the userId and password....
  idPassRecord = fsIdPass.readFileSync('./myThermostats.txt', 'utf8');

  var userIdPass = idPassRecord.split("|");
  var trimmedUserPass = userIdPass[1].trim();

  // Now format then make the request for a sessionId....using curl

  // alternate version had to format this way to avoid having OS interpret the & as 'run in background'
  var curlRequest = `curl -s -k -X 'POST' -H 'Content-Type: application/x-www-form-urlencoded' -H 'User-Agent: Apache-HttpClient/UNAVAILABLE (java 1.4)' \
  'https://tccna.honeywell.com/ws/MobileV2.asmx/AuthenticateUserLogin' \
  -d applicationID=$a0c7a795-ff44-4bcd-9a99-420fac57ff04 \
  -d ApplicationVersion=2 \
  -d Username=${userIdPass[0]} \
  -d UiLanguage=English \
  -d Password=${trimmedUserPass}
  `;

  // console.log(curlRequest);


  // need to ask the OS to exec the curl command for us...
  var exec = require('child_process').exec;
  var parseString = require('xml2js').parseString;

  var command = curlRequest;
  var xmlResponse = "";

  //stdout is the response from the OS.  In this case it will be XML.
  child = exec(command, function(error, xmlResponse, stderr){
    console.log("AuthenticateUserLogin...")
    console.log('stdout: ' + xmlResponse);
    console.log('stderr: ' + stderr);

    if(error !== null) {
      console.log('exec error: ' + error);
    };

    var sessionID = '';

    parseString(xmlResponse, function (error, result) {
        console.log("parsing");
        // console.log(result);
        console.log(error);
        sessionID = result.AuthenticateLoginResult.SessionID;
    });
  // res.send(sessionID);

  // console.log(sessionID);
  //Now use the sessionID to poll this user's account and get readings for all thermostats....

    curlRequest = `curl -H "Accept: application/xml" -H "Content-Type: application/xml" -X GET -G \
     'https://tccna.honeywell.com/ws/MobileV2.asmx/GetThermostat' \
     -d sessionID=${sessionID} \
     -d thermostatId=${thermostatId}`;

    console.log(curlRequest);

    command = curlRequest;
    child = exec(command, function(error, xmlResponse, stderr){
      console.log("GetThermostat...")
      // console.log('stdout: ' + xmlResponse);
      console.log('stderr: ' + stderr);

      if(error !== null) {
        console.log('exec error: ' + error);
      };

      var thermostats = null;

      parseString(xmlResponse, function (error, result) {
          console.log("parsing");
          // console.log(result);
          console.log(error);
          thermostats = result;
      });

      res.send(thermostats);

    });  // curl GetThermostat
  }); // curl sessionID
}); // Now route

router.post('/validateHoneywell', secure_pass, function(req, res, next) {
  // Use the email and password we received in req.body to ask honeywell
  // for a sessionId....
  // If we get one, great!  We have valid user and pass.
  // ??  Do we want to store them now or later in our 3rd Party Sites table ??
  res.send("You hit the /validateHoneywell route!")
});  // /validateHoneywell

module.exports = router;
