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
const config = require('./config.json');
const fs = require('fs');
// const bodyParser = require('body-parser');
const fn = require('./functions.js').functions;

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
                augerOff: req.body.augerOff,
                augerOn: req.body.augerOn,
                pause: req.body.pause
            });
        }
        // res.send(200);
    });
    // console.log(req.body);
});

server.listen(config.web.port, config.web.ip);