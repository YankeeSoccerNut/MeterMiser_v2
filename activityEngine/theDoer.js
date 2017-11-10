//  Place holder file.
//  This progam could be wrapped in a cron job a la meter maid
//  Its primary function will be to process the Activities data //  and send out the notifications via the correct channel.
//  It will also update activity status and create new activities //  that log the actions taken.

var config = require('../config');
var twilio = require('twilio');

var twilioClient = new twilio(config.twilio.accountSid, config.twilio.authToken);

twilioClient.messages.create({
    body: 'Test Message from theDoer in meterMiser',
    to: '4045935834',  // Text this number
    from: `${config.twilio.twPhone}` // From a valid Twilio number
})
.then((message) => console.log(message.sid));

console.log(twilioClient);
