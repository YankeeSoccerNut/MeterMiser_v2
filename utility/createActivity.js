activityObj = require('./activityObj');

function createActivity(dbConnection, activityObj){
  console.log("In createActivity...");

  var insertSQL = `INSERT INTO ActivityLog (status, triggerId, message) VALUES (0, ${activityObj.triggerId}, '${activityObj.message}');`;

  dbConnection.query(insertSQL, function (err, result) {
    if (err){
      throw(err);
    } else {
    console.log("ActivityLog record inserted");
    };
  });
};

module.exports = createActivity;
