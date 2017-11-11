var moment = require ('moment');
var mysql = require('mysql');
var config = require('../config');

var dbConnection = mysql.createConnection(config.db);
dbConnection.connect();

var selectReadingsSQL = 'SELECT id, thermCreated from Readings;';


dbConnection.query(selectReadingsSQL, function (err, results) {
  if (err){
    console.log(err);
  } else {
    results.map((result,i)=>{
      console.log(result.id, result.thermCreated);
      var mDate = moment(result.thermCreated, moment.ISO_8601);
      var dayOfWeek = mDate.day();
      var hour = mDate.hour();
      var minute = mDate.minute();
      console.log(`${dayOfWeek} ${hour} ${minute}`);
      var updateSQL = `UPDATE readings SET thermCreatedDay = ${dayOfWeek}, thermCreatedHour = ${hour}, thermCreatedMin = ${minute} WHERE id = ${result.id};`
      dbConnection.query(updateSQL, function (err, results) {
        if(err) {
          console.log(err);
        };
      });
    });
  }
  // Close the database connection...
  dbConnection.end();
});

// var dayOfWeek = moment('2017-10-18','e');

// console.log(moment('2017-11-10 20:57:50',moment.ISO_8601).day());
// console.log(moment('2017-11-10 20:57:50',moment.ISO_8601).hour());
// console.log(moment('2017-11-10 20:57:50',moment.ISO_8601).minute());
