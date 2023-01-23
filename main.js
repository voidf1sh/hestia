const fn = require('./modules/functions.js').functions;
// Import the config file
var config = require('./templates/config.json');
// Database Functions
const dbfn = require('./modules/database.js');
// Web Portal
const portal = require('./modules/_server.js');
portal.start();

dbfn.run(`UPDATE timestamps SET value = ${Date.now()} WHERE key = 'process_start'`).catch(err => console.error(`Error setting process start time: ${err}`));

fn.commands.refreshConfig().then(res => {
    if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res.status}`);
    config = res.config;
    // Setup for use with the Pi's GPIO pins
    switch (process.env.ONPI) {
        case 'true':
            console.log(`== Running on a Raspberry Pi.`);
            var gpio = require('rpi-gpio');
            fn.init(gpio).then((res) => {
                console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                main(gpio);
            }).catch(rej => {
                console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Error during initialization: ${rej}`);
                process.exit(1);
            });
            break;
        case 'false':
            console.log(`I: Not running on a Raspberry Pi.`);
            var gpio = 'gpio';
            fn.init(gpio).then(res => {
                console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                main(gpio);
            }).catch(rej => {
                console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Error during initialization: ${rej}`);
                process.exit(1);
            });
            break;
        default:
            console.log(`[${Date.now() - config.timestamps.procStart}] E: Problem with ENV file.`);
            process.exit(1);
            break;
    }
}).catch(rej => {
    console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Problem refreshing the config: ${rej}`);
    process.exit(1);
});

function main(gpio) {
    // If the auger is enabled
    if (config.status.auger == 1) {
        // Run a cycle of the auger
        fn.auger.cycle(gpio).then(res => {
            if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
            fn.checkForQuit().then(n => {
                fn.commands.refreshConfig().then(res => {
                    if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res.status}`);
                    config = res.config;
                    // Recursion ecursion cursion ursion rsion sion ion on n
                    main(gpio);
                }).catch(rej => {
                    console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Problem refreshing the config: ${rej}`);
                    // Recursion ecursion cursion ursion rsion sion ion on n
                    main(gpio);
                });
            });
        }).catch(err => {
            if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${err}`);
        });
    } else {
    // If the auger is disabled
        fn.commands.pause().then(res => {
            fn.checkForQuit().then(n => {
                fn.commands.refreshConfig().then(res => {
                    if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res.status}`);
                    config = res.config;
                    // Recursion ecursion cursion ursion rsion sion ion on n
                    main(gpio);
                }).catch(rej => {
                    console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Problem refreshing the config: ${rej}`);
                    // Recursion ecursion cursion ursion rsion sion ion on n
                    main(gpio);
                });
            });
        }).catch(err => {
            if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${err}`);
            // Recursion ecursion cursion ursion rsion sion ion on n
            main(gpio);
        });
    }
}