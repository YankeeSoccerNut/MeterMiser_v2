//  This progam could be wrapped in a cron job a la meter maid
//  Its primary function will be to process the Activities data //  and send out the notifications via the correct channel.
//  It will also update activity status and create new activities //  that log the actions taken.

// program structure....
// 1.  Get all PENDING activities from ActivityLog
// 2.  For each Activity determine how what action to take based on Trigger Type and User Preferences.
// NOTE:  for v2 we are assuming SMS only!!
// TODO:  add flexibility to use preferences
// 3.  Update the Activity with action taken.  Mark it OPEN and record notification channel (SMS).


// GLOBAL VARIABLES...assignment without var
config = require('../config/config');
twilio = require('twilio');
mysql = require('mysql');

dbConnection = mysql.createConnection(config.db);
twilioClient = new twilio(config.twilio.accountSid, config.twilio.authToken);
activityCount = 0;

getPendingActivities()
.then((activities) => {
  if(activities.length == 0){
    console.log("Nothing to process...")
    dbConnection.end();
    return(false);
  }
  processActivities(activities)
  .then(() => {
    console.log(`Traffic Cop processed ${activityCount}`);
    console.log("dbConnection CLOSING!")
    dbConnection.end();
  }); //processActivites.then
}); //getPendingActivities.then

function getPendingActivities(){

  var dbPromise = new Promise (function(resolve, reject) {
    var selectSQL = 'SELECT * FROM ActivityLog WHERE status = 0;';

    dbConnection.query(selectSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      } else {
        console.log(`PENDING ActivityLog Count: ${results.length}`);
        resolve(results);
      };
    });  // dbConnection.query
  }) // dbPromise
  .catch((err) => {
    console.log(err);
  }); // dbPromise

  return(dbPromise);
}; // getPendingActivities

function processActivities(activities){
  // simplified version for demo...
  // Always assumes SMS (Twilio) and single user!
  // There is a dependency between Twilo and Update because we want to store the response/sessionID from twilio

  var smsActivityPromises = [];

  var activitiesFinishedPromise = new Promise (function(resolve, reject) {

    activities.map((activity, index) =>{
      activityCount += 1;
      console.log(activity);
      twilioClient.messages.create({
          body: activity.message,
          to: '4045935834',  // TODO: replace with users SMS phone number
          from: `${config.twilio.twPhone}` // From a valid Twilio number
      })
      .then((message) => {
        console.log(message.sid);
        smsActivityPromises.push(updateSMSActivity(activity.id, message.sid));
        Promise.all(smsActivityPromises).then(() => {
          resolve();
        })
        .catch((err) => {
          console.log(err);
          reject();
        });
      }); //twilio.then
    });  // map
  }); // activitiesFinishedPromise


  return(activitiesFinishedPromise);
}; // processActivities

function updateSMSActivity(activityId, smsSID){

  var dbPromise = new Promise (function(resolve, reject) {
    var updateSQL = `UPDATE ActivityLog SET status = 1, smsSID = '${smsSID}' WHERE id = ${activityId};`;

    dbConnection.query(updateSQL, function(err, results){
      if(err){
        console.log(err);
        reject(err);
      } else {
        console.log(`UPDATED ActivityLog.id: ${activityId}`);
          resolve(true);
      };
    });  // dbConnection.query
  }) // dbPromise
  .catch((err) => {
    console.log(err);
  }); // dbPromise

  return(dbPromise);
}; // updateSMSActivity

// console.log("!!!!!Next Lines of Main Code Are Running!!!!!");
