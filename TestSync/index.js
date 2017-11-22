// Cosmos DB
/*
var documentDbOptions = {
    host: process.env['CosmosDB_HOST'],
    masterKey: process.env['CosmosDB_MASTER_KEY'],
    database: process.env['CosmosDB_DATABASE'],
    collection: process.env['CosmosDB_COLLECTION']
};
var docDbClient = new botbuilder_azure.DocumentDbClient(documentDbOptions);
var cosmosStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, docDbClient);
//bot.set('storage', cosmosStorage); // Why doesnt this work???
*/

var documentClient = require("documentdb").DocumentClient;
//var config = require("./config");
var url = require('url');
var client = new documentClient(process.env['CosmosDB_HOST'],{ "masterkey": process.env['CosmosDB_MASTER_KEY']});
var Andersen = { "Andersen": {
    "id": "Anderson.1",
    "lastName": "Andersen",
    "parents": [{
        "firstName": "Thomas"
    }, {
            "firstName": "Mary Kay"
        }],
    "children": [{
        "firstName": "Henriette Thaulow",
        "gender": "female",
        "grade": 5,
        "pets": [{
            "givenName": "Fluffy"
        }]
    }],
    "address": {
        "state": "WA",
        "county": "King",
        "city": "Seattle"
    }
}}

module.exports = function(context, req) {

    var HttpStatusCodes = { NOTFOUND: 404 };
    var databaseUrl = 'dbs/' + process.env['CosmosDB_DATABASE'];
    var collectionUrl = '${databaseUrl}/colls/' + process.env['CosmosDB_COLLECTION'];
    
    context.log('JavaScript HTTP trigger function processed a request.');

    if (req.query.name || (req.body && req.body.name))
    {
        context.res = {
        // status: 200, /* Defaults to 200 */
        body: "Hello " + (req.query.name || req.body.name) + " " + process.env['CosmosDB_HOST']
        };

        client.createDocument(collectionUrl, Andersen, (err, created) => {
            //if (err) reject(err)
            //else resolve(created);
        });
    }
    else
    {
        context.res = {
        status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }
    context.done();
};