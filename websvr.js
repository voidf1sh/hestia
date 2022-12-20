/* Pellet Stove Control Panel
 * Web Configuration Server
 * v0.0.0 by Skylar Grant
 * 
 * TODOs: 
    * Implement Express to make it easier
    * Add actual data into the responses
    * Launching point: https://stackoverflow.com/questions/18831783/how-to-call-a-server-side-function-from-client-side-e-g-html-button-onclick-i
 */

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const config = require('./config.json');

app.use(express.bodyParser());
app.post('/', (req, res) => {
    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${req.body}`);
    res.send(200);    
});

server.listen(config.web.port, config.web.ip);