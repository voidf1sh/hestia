/* Pellet Stove Control Panel
 * Web Configuration Server
 * v0.0.0 by Skylar Grant
 */

const http = require('http');
const host = 'localhost';
const port = 8080;
const config = require('./config.json');

const requestListener = (req, res) => {
    res.writeHead(200);
    res.end('PSControlPanel Web Server')
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Started web config portal.`);
})