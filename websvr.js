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
const core = require('./main.js');
const fn = require('./functions.js');
const gpio = require('rpi-gpio');

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
    console.log(req);
});

app.post('/', (req, res) => {
    fs.readFile(__dirname + '/config.json', (err, data) => {
        // console.log(JSON.parse(data));
        res.render('index', JSON.parse(data));
        if (req.body.start != undefined) {
            core.main(fn, gpio);
        }
        // res.send(200);
    });
    console.log(req.body);
});

server.listen(config.web.port, config.web.ip);