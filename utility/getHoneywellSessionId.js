function getHoneywellSessionId(email, password){
// Get user id and password.....// TODO: encrypt/decrypt for security

// Now format then make the request for a sessionId....using curl
// alternate version had to format this way to avoid having OS interpret the & as 'run in background'
var curlRequest = `curl -s -k -X 'POST' -H 'Content-Type: application/x-www-form-urlencoded' -H 'User-Agent: Apache-HttpClient/UNAVAILABLE (java 1.4)' \
'https://tccna.honeywell.com/ws/MobileV2.asmx/AuthenticateUserLogin' \
-d applicationID=a0c7a795-ff44-4bcd-9a99-420fac57ff04 \
-d ApplicationVersion=2 \
-d Username=${email} \
-d UiLanguage=English \
-d Password=${password}
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

module.exports = getHoneywellSessionId;
