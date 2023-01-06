// TODOs: Add tests for PoF and Vacuum switches, add delays for shutting down blower, test logic for igniter

// TODO: Move these to config
// Physical Pin numbers for GPIO
const augerPin = 26;         // Pin for controlling the relay for the pellet auger motor.

// Require the package for pulling version numbers
const package = require('./package.json');
// Import the config file
var config = require('./config.json');
config.timestamps.procStart = Date.now();

// Get environment variables
const dotenv = require('dotenv').config();
// Module for working with files
const fs = require('fs');
const { time } = require('console');

const main = (gpio) => {
    // If the auger is enabled
    if (config.status.auger == 1) {
        // Run a cycle of the auger
        functions.auger.cycle(gpio).then(res => {
            if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
            // Recursion ecursion cursion ursion rsion sion ion on n
            main(gpio);
        }).catch(err => {
            if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${err}`);
        });
    } else {
    // If the auger is disabled
        functions.commands.pause().then(res => {
            main(gpio);
        }).catch(err => {
            if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] E: ${err}`);
            main(gpio);
        });
    }
}

// The functions we'll export to be used in other files
const functions = {
    auger: {
        // Gets called once the Auger Pin has been setup by rpi-gpio
        ready(err) {
            if (err) throw err;
            console.log('Auger GPIO Ready');
            return;
        },
        // Turns the auger on (Pin 7 high)
        on(gpio) {
            return new Promise((resolve) => {
                if (process.env.ONPI == 'true') {
                    gpio.write(augerPin, true, function(err) {
                        if (err) throw err;
                        resolve('Auger turned on.');
                    });
                } else {
                    resolve('Simulated auger turned on.');
                }
            });
            
        },
        // Turns the auger off (pin 7 low)
        off(gpio) {
            return new Promise((resolve) => {
                if (process.env.ONPI == 'true') {
                    gpio.write(augerPin, false, function(err) {
                        if (err) throw err;
                        resolve('Auger turned off.');

                    });
                } else {
                    resolve('Simulated auger turned off.');
                }
            });

        },
        // Cycles the auger using the two functions above this one (functions.auger.on() and functions.auger.off())
        // Sleeps in between cycles using functions.sleep()
        cycle(gpio) {
            return new Promise((resolve) => {
                // Turn the auger on
                this.on(gpio).then((res) => {
                    // Log action if in debug mode
                    // if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                    // Sleep for the time set in env variables
                    functions.sleep(config.intervals.augerOn).then((res) => {
                        // Log action if in debug mode
                        // if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                        // Turn the auger off
                        this.off(gpio).then((res) => {
                            // Log action if in debug mode
                            // if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                            // Sleep for the time set in env variables
                            functions.sleep(config.intervals.augerOff).then((res) => {
                                // Log action if in debug mode
                                // if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                                // Resolve the promise, letting the main script know the cycle is complete
                                resolve(`Auger cycled (${config.intervals.augerOn}/${config.intervals.augerOff})`);
                            });
                        });
                    });
                });
            });
        },
    },
    commands: {
        // Prepare the stove for starting
        startup () {
            // Basic startup just enables the auger
            config.status.auger = 1;
            return;
        },
        shutdown() {
            // Basic shutdown only needs to disable the auger
            config.status.auger = 0;
        },
        // Pauses the script for the time defined in env variables
        pause() {
            return new Promise((resolve) => {
                if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Pausing for ${config.intervals.pause}ms`);
                               
                functions.sleep(config.intervals.pause).then(() => { resolve(); });
            });
        },
        // Reload the environment variables on the fly
        reload(envs) {
            return new Promise((resolve) => {
                // Re-require dotenv because inheritance in js sucks
                const dotenv = require('dotenv').config({ override: true });
                // Delete the reload file
                fs.unlink('./reload', (err) => {
                    if (err) throw err;
                    if (config.debugMode) console.log('Deleted reload file.');
                });
                // Print out the new environment variables
                // This should be printed regardless of debug status, maybe prettied up TODO?
                console.log('Reloaded environment variables.');
                console.log(`ONTIME=${config.intervals.augerOn}\nOFFTIME=${config.intervals.augerOff}\nPAUSETIME=${config.intervals.pause}\nDEBUG=${config.debugMode}\nONPI=${process.env.ONPI}`);
                // Resolve the promise, letting the main script know we're done reloading the variables and the cycle can continue
                resolve();
            });
            
        },
        refreshConfig(newSettings) {
            // When the reload button is pressed, the call to this function will contain new config values
            // {
            //     augerOff: 500,
            //     augerOn: 1500,
            //     pause: 5000
            // }
            if (newSettings != undefined) {
                config.intervals.augerOff = newSettings.augerOff;
                config.intervals.augerOn = newSettings.augerOn;
                config.intervals.pause = newSettings.pause;
            }
            fs.writeFile('./config.json', JSON.stringify(config), (err) => {
                if (err) throw err;
            });
        }
    },
    // Sleeps for any given milliseconds
    sleep(ms) {
        return new Promise((resolve) => {
            // if (config.debugMode) console.log(`Sleeping for ${ms}ms`);
            // Function to be called when setTimeout finishes
            const finish = () => {
                // Resolve the promise 
                resolve(`Slept for ${ms}ms`);
            };
            // The actual sleep function, sleeps for ms then calls finish()
            setTimeout(finish, ms);
        });
    },
    // Initializes rpi-gpio, or resolves if not on a raspberry pi
    init(gpio) {
        fs.readFile('./templates/config.json', (err, data) => {
            fs.writeFile('./config.json', data, (err) => {
                if (err) throw err;
                config = require('./config.json');
            })
        })
        // TODO this boot splash needs updating
        return new Promise((resolve, reject) => {
            // Boot/About/Info
            console.log(`== Lennox Winslow PS40
== Pellet Stove Control Panel
== Author: Skylar Grant
== Version: v${package.version}
==
== Startup Time: ${new Date().toISOString()}
==
== Environment variables:
== == ONTIME=${config.intervals.augerOn}
== == OFFTIME=${config.intervals.augerOff}
== == PAUSETIME=${config.intervals.pause}
== == DEBUG=${config.debugMode}
== == ONPI=${process.env.ONPI}`);
            // Set up GPIO 4 (pysical pin 7) as output, then call functions.auger.ready()
            if (process.env.ONPI == 'true') {
                // Init the Auger pin
                gpio.setup(augerPin, gpio.DIR_OUT, (err) => {
                    if (err) reject(err);
                    if (config.debugMode) console.log('== Auger pin initialized.');
                    // Resolve the promise now that all pins have been initialized
                    resolve('== GPIO Initialized.');
                });
            } else {
                // Resolve the promise
                resolve('== GPIO Not Available');
            }
        });
    },
    time(stamp) {
        const time = new Date(stamp);
        return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    }
}

// Setup for use with the Pi's GPIO pins
switch (process.env.ONPI) {
    case 'true':
        console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] == Running on a Raspberry Pi.`);
        var gpio = require('rpi-gpio');
        functions.init(gpio).then((res) => {
            console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
            main(gpio);
        }).catch(rej => {
            console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Error during initialization: ${rej}`);
            process.exit(1);
        });
        break;
    case 'false':
        console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Not running on a Raspberry Pi.`);
        var gpio = 'gpio';
        functions.init(gpio).then(res => {
            console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
            main(gpio);
        }).catch(rej => {
            console.error(`[${(Date.now() - config.timestamps.procStart)/1000}] E: Error during initialization: ${rej}`);
            process.exit(1);
        });
        break;
    default:
        console.error(`[${Date.now() - config.timestamps.procStart}] E: Problem with ENV file.`);
        process.exit(1);
        break;
}

// Export the above object, functions, as a module
module.exports = { functions };