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
        if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: File Check: ${res}`);
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
                fn.commands.shutdown(gpio);
                break;
            case "ignite":
                // Start the igniter and timer
                fn.commands.ignite(gpio).then(res => {
                    if (config.debugMode) console.log(res);
                    statusCheck(fn, gpio);
                }).catch(rej => {
                    console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${rej}`);
                    fn.commands.shutdown(gpio).then(res => {
                        fn.commands.quit();
                    }).catch(rej => {
                        console.error(rej);
                        fn.commands.quit();
                    });
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
    fn.tests.igniter(gpio).then((res) => {
        if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
        main(fn, gpio);
    });

    // Check the vacuum switch, if the test returns true, the vacuum is sensed
    // if it returns false, we will initiate a shutdown
    fn.tests.vacuum(gpio).then(status => {
        if (!status) {
            fn.commands.shutdown(gpio);
        }
    });

    // Check the Proof of Fire Switch
    fn.tests.pof(gpio).then(status => {
        // If the igniter has finished running and no proof of fire is seen, shutdown the stove
        if (config.status.igniterFinished && (!status)) fn.commands.shutdown(gpio);
    });

    // blower.canShutdown() returns true only if the blower shutdown has
    // been initiated AND the specified cooldown time has passed
    if(fn.blower.canShutdown()) {
        fn.power.blower.off(gpio).then(res => {
            // Since the blower shutting off is the last step in the shutdown, we can quit.
            // TODO eventually we don't want to ever quit the program, so it can be restarted remotely
            fn.commands.quit();
        });
    }
}