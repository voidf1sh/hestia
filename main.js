// Custom functions module to keep main script clean
const fn = require('./functions.js').functions;

// Environment Variables Importing
const dotenv = require('dotenv').config();

// Setup for use with the Pi's GPIO pins
if (process.env.ONPI == 'true') {
    console.log('Running on a Raspberry Pi.');
    const gpio = require('rpi-gpio');
    fn.init(gpio).then((res, rej) => {
        if (res != undefined) {
            console.log(res);
            main(fn, gpio);
        } else {
            console.error(rej);
        }
    });
} else if (process.env.ONPI == 'false') {
    console.log('Not running on a Raspberry Pi.');
    const gpio = 'gpio';
    fn.init(gpio).then((res, rej) => {
        if (res != undefined) {
            console.log(res);
            main(fn, gpio);
        } else {
            console.error(rej);
        }
    });
} else {
    console.log('Problem with ENV file.');
}

// TODO Add logic for other sensors



// Main function, turns the auger on, sleeps for the time given in environment variables, then turns the auger off, sleeps, repeats.
async function main(fn, gpio) {
    // Check for the existence of certain files
    fn.files.check().then((res,rej) => {
        // Log the result of the check if in debug mode
        if (process.env.DEBUG == 'true') console.log('File Check: ' + res);
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
                });
                break;
            case "quit":
                // Quit the script
                fn.commands.quit();
                break;
            case "none":
                // If no special files are found, cycle the auger normally
                fn.auger.cycle(gpio).then((res) => {
                    // Log the auger cycle results if in debug mode.
                    if (process.env.DEBUG == 'true') console.log(res);
                    // Rerun this function once the cycle is complete
                    main(fn, gpio);
                });
                break;
        
            default:
                // If we don't get a result from the file check, or for some reason it's an unexpected response, log it and quit the script.
                console.error(`No result was received, something is wrong.\nres: ${res}`);
                fn.commands.quit();
                break;
        }
    });
}