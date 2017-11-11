activityObj = require('./activityObj');

function createActivity(dbConnection, activityObj){
  console.log("In createActivity...");
  
  var insertSQL = `INSERT INTO ActivityLog (status, triggerId, message) VALUES (0, ${activityObj.triggerId}, '${activityObj.message}');`;

  return(new Promise(function(resolve, reject) {
    dbConnection.query(insertSQL, function (err, result) {
      if (err){
        reject(err);
      } else {
      console.log("ActivityLog record inserted");
      resolve(result);
      };
    });
  }));
};

module.exports = createActivity;
