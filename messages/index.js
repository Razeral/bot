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
//

// Cognitive Services - Computer Vision 
var needle = require('needle'),
    restify = require('restify'),
    url = require('url'),
    validUrl = require('valid-url'),
    captionService = require('./caption-service');

// Cosmos DB
var documentDbOptions = {
    host: process.env['CosmosDB_HOST'],
    masterKey: process.env['CosmosDB_MASTER_KEY'],
    database: process.env['CosmosDB_DATABASE'],
    collection: process.env['CosmosDB_COLLECTION']
};
var docDbClient = new botbuilder_azure.DocumentDbClient(documentDbOptions);
var cosmosStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, docDbClient);

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);
//bot.set('storage', cosmosStorage); // Why doesnt this work???
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
    console.log(session.message.text);

    if (session.message.attachments && session.message.attachments.length > 0) {
        session.send("Hmm...");
        session.beginDialog('/GetCaption');
        //while (session.userData.processingImage); //Wait until image returns
    }
    else
    {
        //session.send("No attachment");
        //session.send("Please send an image");
        session.send("Hello. If you would like to report an issue, please send me an image. This is currently my only feature :(");
    }
    //session.send(LuisModelUrl);
    //session.send("Hi");
    var name = session.message.text;
    session.userData.custom = true;
    /*if (session.userData.custom)
        session.send("true");
    else
        session.send("false");*/
    //if (!session.userData.custom) {
        //session.userData.result = testFn(session, name);
        //testFn(session, name);
    //}
    //session.send(name);
    //session.send(result);
    session.endDialog();
}); 

bot.dialog('/SendPhoto', function (session, args) {
    session.send("In SendPhoto");
    session.endDialog();
}).triggerAction({
    matches: 'Test.Command'
    });

bot.dialog('/GetCaption', function (session) {
    session.userData.processingImage = true; 
    if (hasImageAttachment(session)) {
        session.userData.picture = session.message.attachments[0];
        var stream = getImageStreamFromMessage(session.message);
        captionService
            .getCaptionFromStream(stream)
            .then(function (caption) { handleSuccessResponse(session, caption); })
            .catch(function (error) { handleErrorResponse(session, error); });
    } else {
        var imageUrl = parseAnchorTag(session.message.text) || (validUrl.isUri(session.message.text) ? session.message.text : null);
        if (imageUrl) {
            captionService
                .getCaptionFromUrl(imageUrl)
                .then(function (caption) { handleSuccessResponse(session, caption); })
                .catch(function (error) { handleErrorResponse(session, error); });
        } else {
            session.send('Did you upload an image? I\'m more of a visual person. Try sending me an image or an image URL');
        }
    }
    session.endDialog();
});

var locations = [
    "Summit",
    "CBP",
    "F1",
    "F2",
    "Pixel"
];

bot.dialog('/GetDetails', [
    function (session) {
        builder.Prompts.choice(session, "Where is this place closest to?", locations, { listStyle: builder.ListStyle.button });
    },
    function (session, results, next) {
        session.userData.locationx = locations[results.response];
        session.send(results.response);
        builder.Prompts.text(session, "Please tell me more about the problem? e.g. illegal parking");
    },
    function (session, results, next) {
        session.userData.desc = results.response;
        //session.send(results.response);
        session.send("So what I've gathered so far...");
        var attachment = session.userData.picture;
        session.send({
            text: "",
            attachments: [
                {
                    contentType: attachment.contentType,
                    contentUrl: attachment.contentUrl,
                    name: attachment.name
                }
            ]
        });
        session.send("Spotted at: " + session.userData.locationx);
        session.send("Issue: " + session.userData.desc);

        builder.Prompts.choice(session, "Submit?", "Yes | No ", { listStyle: builder.ListStyle.button });
    },
    function (session, results, next) {
        session.send("Thank you " + session.message.user.name);
        session.userData = {};
        session.endDialog();
    }
]);

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

//=========================================================
// Utilities
//=========================================================
function hasImageAttachment(session) {
    return session.message.attachments.length > 0 &&
        session.message.attachments[0].contentType.indexOf('image') !== -1;
}

function getImageStreamFromMessage(message) {
    var headers = {};
    var attachment = message.attachments[0];
    if (checkRequiresToken(message)) {
        // The Skype attachment URLs are secured by JwtToken,
        // you should set the JwtToken of your bot as the authorization header for the GET request your bot initiates to fetch the image.
        // https://github.com/Microsoft/BotBuilder/issues/662
        connector.getAccessToken(function (error, token) {
            var tok = token;
            headers['Authorization'] = 'Bearer ' + token;
            headers['Content-Type'] = 'application/octet-stream';

            return needle.get(attachment.contentUrl, { headers: headers });
        });
    }
    headers['Content-Type'] = attachment.contentType;
    return needle.get(attachment.contentUrl, { headers: headers });
}

function checkRequiresToken(message) {
    return message.source === 'skype' || message.source === 'msteams';
}

/**
 * Gets the href value in an anchor element.
 * Skype transforms raw urls to html. Here we extract the href value from the url
 * @param {string} input Anchor Tag
 * @return {string} Url matched or null
 */
function parseAnchorTag(input) {
    var match = input.match('^<a href=\"([^\"]*)\">[^<]*</a>$');
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

//=========================================================
// Response Handling
//=========================================================
function handleSuccessResponse(session, caption) {
    if (caption) {
        //session.send('I think it\'s ' + caption);
        session.send('Looks like it\'s ' + caption);
        session.beginDialog('/GetDetails');
    }
    else {
        session.send('Couldn\'t find a caption for this one');
    }
    session.userData.processingImage = false;

}

function handleErrorResponse(session, error) {
    var clientErrorMessage = 'Oops! Something went wrong. Try again later.';
    if (error.message && error.message.indexOf('Access denied') > -1) {
        clientErrorMessage += "\n" + error.message;
    }

    console.error(error);
    session.send(clientErrorMessage);
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

