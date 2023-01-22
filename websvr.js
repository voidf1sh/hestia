/* Pellet Stove Control Panel
 * Web Configuration Server
 * v0.0.0 by Skylar Grant
 * 
 * TODOs: 
    * Implement Express to make it easier
    * Add actual data into the responses
 */

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('fs');
// const bodyParser = require('body-parser');
var config = require('./templates/config.json');
var fn;
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./data/config.db', (err) => {
    if (err) throw `E: DB Connection: ${err.message}`;
    console.log(`I: Connected to the database.`);
});

// First thing is to copy the template config to main config file
fs.readFile('./templates/config.json', (err, data) => {
    fs.writeFile('./config.json', data, (err) => {
        if (err) throw err;
        console.log(`I: Config Template copied.`);
        config = require('./config.json');
        fn = require('./modules/functions.js').functions;
        server.listen(config.web.port, config.web.ip);
    });
});

app.use(express.urlencoded());

app.use(express.static(__dirname + '/www/public'));
app.set('views', __dirname + '/www/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {
    fs.readFile(__dirname + '/config.json', (err, data) => {
        // console.log(JSON.parse(data));
        res.render('index', JSON.parse(data));
        // res.send(200);
    });
});

app.post('/', (req, res) => {
    fs.readFile(__dirname + '/config.json', (err, data) => {
        // console.log(JSON.parse(data));
        res.render('index', JSON.parse(data));
        if (req.body.start != undefined) {
            fn.commands.startup();
        }
        if (req.body.shutdown != undefined) {
            fn.commands.shutdown();
        }
        if (req.body.reload != undefined) {
            fn.commands.refreshConfig({
                augerOff: 2000 - req.body.feedRate,
                augerOn: req.body.feedRate
            });
        }
        if (req.body.quit != undefined) {
            fn.commands.quit();
        }
    });
});