// Get environment variables
const dotenv = require('dotenv').config();
// Module for working with files
const fs = require('fs');
// Setup for use with the Pi's GPIO pins
const gpio = require('rpi-gpio');

// The functions we'll export to be used in other files
const functions = {
    auger: {
        ready(err) {
            if (err) throw err;
            console.log('Auger GPIO Ready');
            return;
        },
        // Turns the auger on (Pin 7 high)
        on() {
            gpio.write(7, true, function(err) {
                if (err) throw err;
                if (process.env.DEBUG == "true") console.log('Auger turned on.');
            });
        },
        // Turns the auger off (pin 7 low)
        off() {
            gpio.write(7, false, function(err) {
                if (err) throw err;
                if (process.env.DEBUG == "true") console.log('Auger turned off.');
            });
        },
        // Cycles the auger using the two functions above this one (functions.auger.on() and functions.auger.off())
        // Sleeps in between cycles using functions.sleep()
        cycle() {
            this.on();
            functions.sleep(process.env.ONTIME);
            this.off();
            functions.sleep(process.env.OFFTIME);
            return;
        },
    },
    files: {
        async check() {
            // TODO this code needs to be finished from migration
            // Check for pause file existing, then sleep for preset time, then run the function again.
            if (fs.existsSync('./pause')) {
                return "pause";
            }

            // Check for reload file existing, then reload environment variables, then delete the file.
            if (fs.existsSync('./reload')) {
                return "reload";
            }

            // Check for quit file existing, then delete it, then quit the program
            if (fs.existsSync('./quit')) {
                return "quit";
            }
            return "none";
        },
    },
    commands: {
        pause() {
            console.log('Paused...');
            this.sleep(process.env.PAUSETIME).then(() => { return; });
            return;
        },
        reload() {
            dotenv.config({ override: true })
            fs.unlink('./reload', (err) => {
                if (err) throw err;
                console.log('Deleted reload file.');
            });
            console.log('Reloaded environment variables.');
            console.log(`ONTIME=${process.env.ONTIME}\nOFFTIME=${process.env.OFFTIME}\nPAUSETIME=${process.env.PAUSETIME}\nDEBUG=${process.env.DEBUG}`);
            return;
        },
        quit() {
            fs.unlink('./quit', (err) => {
                if (err) throw err;
                console.log('Removed quit file.');
            });
            console.log('Quitting...');
            process.exit();
        },
    },
    // Sleeps for any given milliseconds, call with await
    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
            if (process.env.DEBUG == "true") console.log(`Slept for ${ms}ms`);
        });
    },
    init() {
        // Write the current env vars to console
        console.log('Environment variables:');
        console.log(`ONTIME=${process.env.ONTIME}\nOFFTIME=${process.env.OFFTIME}\nPAUSETIME=${process.env.PAUSETIME}\nDEBUG=${process.env.DEBUG}`);
        return true;
    },
}

// Set up GPIO 4 (pysical pin 7) as output, then call functions.auger.ready()
gpio.setup(7, gpio.DIR_OUT, functions.auger.ready());

module.exports = { functions }