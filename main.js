// npm module for Raspberri Pi GPIO
var gpio = require('rpi-gpio');
// Module for importing environment variables
var dotenv = require('dotenv').config();
// Module for working with files
var fs = require('fs');

// Set up GPIO 4 (pysical pin 7) as output, then call cycleAuger()
gpio.setup(7, gpio.DIR_OUT, cycleAuger);

// Turns the auger on (Pin 7 high)
function augerOn(err) {
    if (err) throw err;
    gpio.write(7, true, function(err) {
        if (err) throw err;
        console.log('Auger turned on.');
    });
}

// Turns the auger off (pin 7 low)
function augerOff(err) {
    if (err) throw err;
    gpio.write(7, false, function(err) {
        if (err) throw err;
        console.log('Auger turned off.');
    });
}

// Identical functions as above for debugging without gpio
// function augerOff() {
//     console.log('Auger turned off.');
// }

// function augerOn() {
//     console.log('Auger turned on.');
// }

// Sleeps for any given milliseconds, call with await
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
        console.log(`Slept for ${ms}ms`);
    });
}

// Main function, turns the auger on, sleeps for the time given in environment variables, then turns the auger off, sleeps, repeats.
async function cycleAuger(err) {
    if (err) throw err;
    // Check for pause file existing, then sleep for preset time, then run the function again.
    if (fs.existsSync('./pause')) {
        console.log('Paused...');
        await sleep(process.env.PAUSETIME);
        cycleAuger();
    }

    // Check for reload file existing, then reload environment variables, then delete the file.
    if (fs.existsSync('./reload')) {
        dotenv.config({ override: true })
        fs.unlink('./reload', (err) => {
            if (err) throw err;
            console.log('Deleted reload file.');
        });
        console.log('Reloaded environment variables.');
    }

    // Check for quit file existing, then delete it, then quit the program
    if (fs.existsSync('./quit')) {
        fs.unlink('./quit', (err) => {
            if (err) throw err;
            console.log('Removed quit file.');
        });
        console.log('Quitting.');
        process.exit();
    }

    // If none of the above checks are true, cycle the auger on and off, then repeat
    augerOn();
    await sleep(process.env.ONTIME);
    augerOff();
    await sleep(process.env.OFFTIME);
    cycleAuger();
}