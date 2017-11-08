/*-----------------------------------------------------------------------------
This template demonstrates how to use an IntentDialog with a LuisRecognizer to add 
natural language support to a bot. 
For a complete walkthrough of creating this type of bot see the article at
https://aka.ms/abs-node-luis
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var request = require('request');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey + '&verbose=true&timezoneOffset=8.0&q=';

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
/*
.matches('<yourIntent>')... See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
*/
bot.recognizer(recognizer);

intents.onDefault((session) => {
    console.log(intents);
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

//bot.dialog('/', intents); 
bot.dialog('/', function (session, args) {
    console.log(intents);
    if (session.attachments)
        bot.beginDialog(session.message.address, '/Echo');
    session.send(LuisModelUrl);
    session.send("Hi");
    console.log(session.message.text);
    var name = session.message.text;
    session.userData.custom = true;
    if (session.userData.custom)
        session.send("true");
    else
        session.send("false");
    //if (!session.userData.custom) {
        //session.userData.result = testFn(session, name);
        testFn(session, name);
    //}
    session.send(name);
    //session.send(result);
    session.endDialog();
}); 

bot.dialog('/SendPhoto', function (session, args) {
    session.send("In SendPhoto");
    session.endDialog();
}).triggerAction({
    matches: 'Test.Command'
    });

bot.dialog('/Echo', function (session) {
    var msg = session.message;
    if (msg.attachments && msg.attachments.length > 0) {
        // Echo back attachment
        var attachment = msg.attachments[0];
        session.send({
            text: "You sent:",
            attachments: [
                {
                    contentType: attachment.contentType,
                    contentUrl: attachment.contentUrl,
                    name: attachment.name
                }
            ]
        });
    } else {
        // Echo back users text
        session.send("You said: %s", session.message.text);
    }
    session.endDialog();
}).triggerAction({
    matches: 'Test.Echo'
});

function testFn(session, q) {
    session.send("sending");
    //var msg = http.get("https://srtest11.azurewebsites.net/api/HttpTriggerCSharp1?code=Zozuw6nJ07DBu5oHrOU3qwIxJvu82/NhGta8F3NLzNrpZqW7Z4CH2A==&name=" + q);
    var error = "";
    var response = "";
    var body = "";
    request('https://srtest11.azurewebsites.net/api/HttpTriggerCSharp1?code=Zozuw6nJ07DBu5oHrOU3qwIxJvu82/NhGta8F3NLzNrpZqW7Z4CH2A==&name=' + q, function (error, response, body) {
        //session.send(error);
        //session.send(response && response.statusCode);
        //session.send(body);
        console.log('error:', error); // Print the error if one occurred
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        console.log('body:', body); // Print the HTML for the Google homepage.
    });
    session.send("returned");
    //session.send(msg);
    //return msg;
}

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() };
}

