// meterMaid is designed to poll Honeywell wifi thermostats for current settings and readings.  It utilizes an older API to access the thermostats and their settings and readings in a database for later use.

// program structure....
// 1.  get the userid and password for logging into the Honeywell platform.
// 2.  use the API to request all locations and current reading for each location.  The current Honeywell API returns XML.
// 3.  parse through the XML and construct valid database records for insertion into the target database tables.
// 4.  insert the validated rows into the target tables.
// 5.  insert an entry in the activity log to record the polling activity.

var mysql = require('mysql');

// Get user id and password.....// TODO: encrypt/decrypt for security
var fsIdPass = require('fs');
var idPassRecord = '';

// Use synchronous read as we really can't do anything else until we have the userId and password....
idPassRecord = fsIdPass.readFileSync('~/myThermostats.txt', 'utf8');

var userIdPass = idPassRecord.split("|");
var trimmedUserPass = userIdPass[1].trim();

// Now format then make the request for a sessionId....using curl
// var curlRequest = `curl -s -k -X 'POST' -H 'Content-Type: application/x-www-form-urlencoded' -H 'User-Agent: Apache-HttpClient/UNAVAILABLE (java 1.4)' --data-binary $'applicationID=a0c7a795-ff44-4bcd-9a99-420fac57ff04&ApplicationVersion=2&Username=${userIdPass[0]}&UiLanguage=English&Password=${trimmedUserPass}' 'https://tccna.honeywell.com/ws/MobileV2.asmx/AuthenticateUserLogin'`;

// alternate version had to format this way to avoid having OS interpret the & as 'run in background'
var curlRequest = `curl -s -k -X 'POST' -H 'Content-Type: application/x-www-form-urlencoded' -H 'User-Agent: Apache-HttpClient/UNAVAILABLE (java 1.4)' \
'https://tccna.honeywell.com/ws/MobileV2.asmx/AuthenticateUserLogin' \
-d applicationID=a0c7a795-ff44-4bcd-9a99-420fac57ff04 \
-d ApplicationVersion=2 \
-d Username=${userIdPass[0]} \
-d UiLanguage=English \
-d Password=${trimmedUserPass}
`;

console.log(curlRequest);


// need to ask the OS to exec the curl command for us...
var util = require('util');
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

console.log(sessionID);
// Now use the sessionID to poll this user's account and get readings for all thermostats....
  curlRequest = `curl -H "Accept: application/xml" -H "Content-Type: application/xml" -X GET 'https://tccna.honeywell.com//ws/MobileV2.asmx/GetLocations?sessionID=${sessionID}'`;

  command = curlRequest;
  child = exec(command, function(error, xmlResponse, stderr){
    console.log("GetLocations...")
    // console.log('stdout: ' + xmlResponse);
    console.log('stderr: ' + stderr);

    if(error !== null) {
      console.log('exec error: ' + error);
    };

    saveReadings(xmlResponse);

  });  // curl for GetLocations

  // logoff the session with Honeywell
  curlRequest = `curl -H "Accept: application/xml" -H "Content-Type: application/xml" -X GET 'https://tccna.honeywell.com//ws/MobileV2.asmx/LogOff?sessionID=${sessionID}'`;

  command = curlRequest;
  child = exec(command, function(error, xmlResponse, stderr){
    console.log ("LogOff...")
    // console.log('stdout: ' + xmlResponse);
    console.log('stderr: ' + stderr);

    if(error !== null) {
      console.log('exec error: ' + error);
    };

  });  // curl for Logoff
}); // curl for sessionID

function saveReadings(userLocationData) {
  var theLocationsData;
  var theThermostatsData;
  var theThermostatReadingsData;

  //Honeywell returns a deeply nested XML response...transform it to JSON.  Create some shortcuts to the data we really want later.
  parseString(userLocationData, function (error, result) {
      if (error !== null) {    // TODO: beef up error checking...
        console.log(error);
      }

      // Loop through the Locations
      // Get info for location, thermostats, and current readings and put them in our databas
      // TODO: assumes 1 meter per location for now.

      // for Locations table...
      var locationId = 0;
      var name = '';
      var addr1 = '';
      var addr2 = '';
      var city = '';
      var state = '';
      var zip5 = 0;
      var zip4 = 0;

      // for Thermostats table...
      var thermostatId = 0;
      var deviceName = '';
      var userDefinedName = '';
      var macId = '';
      var DomainId = 0;
      var canControlSchedule = null;
      var willSupportSchedule = null;
      var fanCanControl = null;
      var fanCanSetAuto = null;
      var fanCanSetOn = null;

      // for Readings table...
      var thermCreated = '';
      var thermLocked = null;
      var dispTemp = 0;
      var heatSetPoint = 0;
      var coolSetPoint = 0;
      var displayUnits = '';
      var statusHeat = 0;
      var statusCool = 0;
      var heatLowerSetPt = 0;
      var heatUpperSetPt = 0;
      var coolLowerSetPt = 0;
      var coolUpperSetPt = 0;
      var schedHeatSp = 0;
      var schedCoolSp = 0;
      var systemSwitchPos = 0;
      var equipmentStatus = '';
      var fanPosition = '';
      var fanRunning = null;
      var weatherIsDefined = null;
      var weatherIsValid = null;
      var weatherTemp = 0;
      var weatherTempUnit = '';
      var weatherCondition = '';

      // open up the database connection...
      var dbConnection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : 'meterMiser'
      });
      dbConnection.connect();

      // Loop through locations...use shortcuts to JSON object we parsed earlier.

      for (let i = 0; i < result.GetLocationsResult.Locations[0].LocationInfo.length; i++){
        theLocationsData = result.GetLocationsResult.Locations[0].LocationInfo[i];
        theThermostatsData = result.GetLocationsResult.Locations[0].LocationInfo[i].Thermostats[0].ThermostatInfo[0]
        theThermostatReadingsData = result.GetLocationsResult.Locations[0].LocationInfo[i].Thermostats[0].ThermostatInfo[0].UI[0]

        // for Locations table...
        locationId = theLocationsData.LocationID;
        name = theLocationsData.Name;
        addr1 = null;
        addr2 = null;
        city = null;
        state = null;
        zip5 = theLocationsData.ZipCode;
        zip4 = 0;

        // for Thermostats table...
        thermostatId = theThermostatsData.ThermostatID;
        deviceName = theThermostatsData.DeviceName;
        userDefinedName = theThermostatsData.UserDefinedDeviceName;
        macId = theThermostatsData.MacID;
        DomainId = theThermostatsData.DomainID;

        if (theThermostatsData.CanControlSchedule == 'true'){
          canControlSchedule = true;
        }
        else {
          canControlSchedule = false;
        }

        if (theThermostatsData.WillSupportSchedule == 'true'){
          willSupportSchedule = true;
        }
        else {
          willSupportSchedule = false;
        }


        if (theThermostatsData.Fan[0].CanControl == 'true'){
          fanCanControl = true;
        }
        else{
          fanCanControl = false;
        }

        if (theThermostatsData.Fan[0].CanSetAuto == 'true'){
          fanCanSetAuto = true;
        }
        else{
          fanCanSetAuto = false;
        }

        if (theThermostatsData.Fan[0].CanSetOn == 'true'){
          fanCanSetOn = true;
        }
        else{
          fanCanSetOn = false;
        }

        // for Readings table...
        thermCreated = theThermostatReadingsData.Created;

        if (theThermostatReadingsData.ThermostatLocked == 'true'){
          thermLocked = true;
        }
        else{
          thermLocked = false;
        }

        dispTemp = theThermostatReadingsData.DispTemperature;
        heatSetPoint = theThermostatReadingsData.HeatSetpoint;
        coolSetPoint = theThermostatReadingsData.CoolSetpoint;
        displayUnits = theThermostatReadingsData.DisplayedUnits;
        statusHeat = theThermostatReadingsData.StatusHeat;
        statusCool = theThermostatReadingsData.StatusCool;
        heatLowerSetPt = theThermostatReadingsData.HeatLowerSetptLimit;
        heatUpperSetPt = theThermostatReadingsData.HeatUpperSetptLimit;
        coolLowerSetPt = theThermostatReadingsData.CoolLowerSetptLimit;
        coolUpperSetPt = theThermostatReadingsData.CoolUpperSetptLimit;
        schedHeatSp = theThermostatReadingsData.SchedHeatSp;
        schedCoolSp = theThermostatReadingsData.SchedCoolSp;
        systemSwitchPos = theThermostatReadingsData.SystemSwitchPosition;
        equipmentStatus = theThermostatsData.EquipmentStatus;
        fanPosition = theThermostatsData.Fan[0].Position;

        if (theThermostatsData.Fan[0].IsFanRunning == 'true'){
          fanRunning = true;
        }
        else{
          fanRunning = false;
        }

        if (theThermostatsData.Fan[0].CanSetOn == 'true'){
          fanCanSetOn = true;
        }
        else{
          fanCanSetOn = false;
        }

        if (theLocationsData.CurrentWeather[0].IsDefined == 'true'){
          weatherIsDefined = true;
        }
        else{
          weatherIsDefined = false;
        }

        if (theLocationsData.CurrentWeather[0].IsValid == 'true'){
          weatherIsValid= true;
        }
        else{
          weatherIsValid = false;
        }

        weatherTemp = theLocationsData.CurrentWeather[0].Temperature;
        weatherTempUnit = theLocationsData.CurrentWeather[0].TempUnit;
        weatherCondition = theLocationsData.CurrentWeather[0].Condition;


        // console.log(theLocationsData.CurrentWeather[0]);
        // console.log(theThermostatsData.Fan[0]);
        // console.log(theThermostatsData);
        // console.log(theThermostatReadingsData)

        // Now we can INSERT into the corresponding tables!
        // Going to ignore dupe inserts for now
        // TODO: add error handling
        // TODO: can break out into functions for formatting, inserting

        var insertLocationSQL = `INSERT INTO Locations (locationId ,name,addr1,addr2,city,state,zip5,zip4) VALUES ( ${locationId}, "${name}", ${addr1}, ${addr2}, ${city}, ${state}, ${zip5}, ${zip4})`;

        var insertThermostatSQL = `INSERT INTO Thermostats (thermostatId,locationId,deviceName,userDefinedName,macId,DomainId,canControlSchedule,willSupportSchedule,fanCanControl,fanCanSetAuto,fanCanSetOn) VALUES (${thermostatId}, ${locationId}, "${deviceName}", "${userDefinedName}", "${macId}", ${DomainId}, ${canControlSchedule}, ${willSupportSchedule}, ${fanCanControl},${fanCanSetAuto}, ${fanCanSetOn})`;

        var insertReadingsSQL = `INSERT INTO Readings (thermostatId,thermCreated,thermLocked,dispTemp,heatSetPoint,coolSetPoint,displayUnits,statusHeat,statusCool,heatLowerSetPt,heatUpperSetPt,coolLowerSetPt,coolUpperSetPt,schedHeatSp,schedCoolSp,systemSwitchPos,equipmentStatus,fanPosition,fanRunning,weatherIsDefined,weatherIsValid,weatherTemp,weatherTempUnit,weatherCondition)  VALUES (${thermostatId}, "${thermCreated}", ${thermLocked}, ${dispTemp}, ${heatSetPoint}, ${coolSetPoint},"${displayUnits}", ${statusHeat}, ${statusCool}, ${heatLowerSetPt}, ${heatUpperSetPt}, ${coolLowerSetPt}, ${coolUpperSetPt}, ${schedHeatSp},${schedCoolSp},${systemSwitchPos}, "${equipmentStatus}", "${fanPosition}", ${fanRunning}, ${weatherIsDefined}, ${weatherIsValid}, ${weatherTemp}, "${weatherTempUnit}", "${weatherCondition}")`;

        console.log(insertLocationSQL);
        console.log(insertThermostatSQL);
        console.log(insertReadingsSQL);

        dbConnection.query(insertLocationSQL, function (err, result) {
          if (err){
            console.log(err);
          } else {
          console.log("Location record inserted");
          }
        });

        dbConnection.query(insertThermostatSQL, function (err, result) {
          if (err){
            console.log(err);
          } else {
            console.log("Thermostat record inserted");
          }
        });

        dbConnection.query(insertReadingsSQL, function (err, result) {
          if (err){
            console.log(err);
          } else {
            console.log("Reading record inserted");
          }
        });


      }  // for loop through Locations
      // Commit the updated/inserted records...

      // Close the database connection...
      dbConnection.end();


  });  // end parseString


}  // end saveReadings

//
// connection.connect();
//
// connection.query('SELECT * from Users', function (err, rows, fields) {
//   if (err) throw err
//
//   console.log(rows[0]);
// });
//
// connection.end();
