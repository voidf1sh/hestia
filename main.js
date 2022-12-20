/* Pellet Stove Control Panel
 * Written by Skylar Grant
 * v0.2
 * 
 * TODO:
 * Add logic for other sensors
 * More documentation?
 */ 

// Custom functions module to keep main script clean
const fn = require('./functions.js').functions;

// Config File
const config = require('./config.json');
config.timestamps.procStart = Date.now();

// Environment Variables Importing
const dotenv = require('dotenv').config();

// Setup for use with the Pi's GPIO pins
if (process.env.ONPI == 'true') {
    console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] == Running on a Raspberry Pi.`);
    const gpio = require('rpi-gpio');
    fn.init(gpio).then((res) => {
        console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
        main(fn, gpio);
    }).catch(rej => {
        console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${rej}`);
    });
} else if (process.env.ONPI == 'false') {
    console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Not running on a Raspberry Pi.`);
    const gpio = 'gpio';
    fn.init(gpio).then(res => {
        console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
        main(fn, gpio);
    }).catch(rej => {
        console.error(rej);
    });
} else {
    console.error(`[${Date.now() - config.timestamps.procStart}] E: Problem with ENV file.`);
}

// TODO Add logic for other sensors



// Main function, turns the auger on, sleeps for the time given in environment variables, then turns the auger off, sleeps, repeats.
async function main(fn, gpio) {
    // Check for the existence of certain files
    fn.files.check().then((res,rej) => {
        // Log the result of the check if in debug mode
        // if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: File Check: ${res}`);
        // Choose what to do depending on the result of the check
        switch (res) {
            case "pause":
                // Pause the script
                fn.commands.pause().then(() => {
                    // Rerun this function once the pause has finished
                    main(fn, gpio);
                });
                break;
            case "reload":
                // Reload the environment variables
                fn.commands.reload().then(() => {
                    // Rerun this function once the reload has finished
                    main(fn, gpio);
                }).catch(rej => {
                    console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${rej}`);
                });
                break;
            case "quit":
                // Quit the script
                console.log(fn.commands.shutdown(gpio));
                statusCheck(fn, gpio);
                break;
            case "ignite":
                // Start the ignite sequence
                fn.commands.ignite(gpio).then(res => {
                    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                    
                    statusCheck(fn, gpio);
                }).catch(rej => {
                    console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${rej}`);
                    fn.commands.shutdown(gpio);
                });
                break;
            case "start":
                // Start the stove
                fn.commands.startup(gpio).then(res => {
                    statusCheck(fn, gpio);
                }).catch(rej => {
                    // TODO
                });
                break;
            case "none":
                // If no special files are found, cycle the auger normally
                if (config.status.auger == 1) {
                    fn.auger.cycle(gpio).then((res) => {
                        // Log the auger cycle results if in debug mode.
                        if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                        // Run the status check function
                        statusCheck(fn, gpio);
                        // Rerun this function once the cycle is complete
                        // main(fn, gpio);
                    });
                } else {
                    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Auger Status: ${config.status.auger}`);
                    
                    fn.commands.pause().then(res => {
                        statusCheck(fn, gpio);
                    });
                }
                break;
        
            default:
                // If we don't get a result from the file check, or for some reason it's an unexpected response, log it and quit the script.
                console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: No result was received, something is wrong.\nres: ${res}`);
                fn.commands.quit();
                break;
        }
    });
}

function statusCheck(fn, gpio) {
    if (config.status.shutdown == 1) {
        console.log(fn.commands.shutdown(gpio) || 'Shutting down...');
        main(fn, gpio);
        return;
    }
    if (config.status.igniter == 1) {
        fn.tests.igniter(gpio).then((res) => {
            if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
        });
    }

    // Check the vacuum switch, if the test returns true, the vacuum is sensed
    // if it returns false, we will initiate a shutdown
    // TODO this is messed up
    fn.tests.vacuum(gpio).then(vacStatus => {
        if (!vacStatus) {
            console.error('No vacuum detected, beginning shutdown procedure.');
            console.log(fn.commands.shutdown(gpio));
            main(fn, gpio);
        } else {
            // Check the Proof of Fire Switch
            fn.tests.pof(gpio).then(pofStatus => {
                // If the igniter has finished running and no proof of fire is seen, shutdown the stove
                if (config.status.igniterFinished && (!pofStatus)) {
                    console.error('No Proof of Fire after the igniter shut off, beginning shutdown procedure.');
                    console.log(fn.commands.shutdown(gpio));
                    main(fn, gpio);
                } else {
                    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Vacuum and Proof of Fire OK.`);
                    main(fn, gpio);                    
                }
            });
        }
    });
}