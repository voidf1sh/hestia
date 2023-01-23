/* Pellet Stove Control Panel
 * Web Configuration Server
 * v0.0.0 by Skylar Grant
 * 
 * TODOs: 
    * Implement Express to make it easier
    * Add actual data into the responses
 */

const express = require('express');
const http = require('http');
const fn = require('./functions.js').functions;
var config;
fn.commands.refreshConfig().then(newConfig => {
    config = newConfig.config;
});
const { dbfn } = require('./functions.js');

const app = express();
const server = http.createServer(app);
app.use(express.urlencoded());
// Our root directory for the public web files
app.use(express.static(__dirname + '/../www/public'));
// Our directory for views used to render the pages
app.set('views', __dirname + '/../www/views');
// Set .html as the file extension for views
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// A normal load of the root page
app.get('/', (req, res) => {
    if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${JSON.stringify(config)}`);
    res.render('index', { config: JSON.stringify(config) });
});

// A POST form submission to the root page
app.post('/', (req, res) => {
    res.render('index', { config: JSON.stringify(config) });
    if (req.body.start != undefined) {
        fn.commands.startup();
    }
    if (req.body.shutdown != undefined) {
        fn.commands.shutdown();
    }
    if (req.body.reload != undefined) {
        const updateAugerOffIntervalQuery = `UPDATE intervals SET value = '${2000 - req.body.feedRate}' WHERE key = 'auger_off'`;
        const updateAugerOnIntervalQuery = `UPDATE intervals SET value = '${req.body.feedRate}' WHERE key = 'auger_on'`;
        dbfn.run(updateAugerOffIntervalQuery).then(res => {
            if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Auger off interval updated: ${res.data.changes}`);
        }).catch(err => console.log(`E: ${err}`));

        dbfn.run(updateAugerOnIntervalQuery).then(res => {
            if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Auger on interval updated: ${res.data.changes}`);
        }).catch(err => console.log(`E: ${err}`));
    }
    if (req.body.quit != undefined) {
        fn.commands.quit();
    }
});

module.exports = {
    start: () => {
        server.listen(8080, "0.0.0.0");
    }
};