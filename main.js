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
    fn.files.check().then((res,rej) => {
        console.log('File Check: ' + res);
        switch (res) {
            case "pause":
                fn.commands.pause().then(() => {
                    main(fn);
                });
                break;
            case "reload":
                fn.commands.reload().then(() => {
                    main(fn);
                });
                break;
            case "quit":
                fn.commands.quit();
                break;
            case "none":
                fn.auger.cycle(gpio).then(() => {
                    main(fn);
                });
                break;
        
            default:
            main(fn);
            break;
        }
    });
}