// Physical Pin numbers for GPIO
const augerPin = 7;         // Pin for controlling the relay for the pellet auger motor.
const igniterPin = 13;      // Pin for controlling the relay for the igniter.
const blowerPin = 15;       // Pin for controlling the relay for the combustion blower/exhaust.
const pofPin = 16;          // Pin for sensing the status (open/closed) of the Proof of Fire switch.
const tempPin = 18;         // Pin for receiving data from a DS18B20 OneWire temperature sensor.
const vacuumPin = 22;       // Pin for sensing the status (open/closed) of the vacuum switch.

// Require the package for pulling version numbers
const package = require('./package.json');

// Get environment variables
const dotenv = require('dotenv').config();
// Module for working with files
const fs = require('fs');
// Promises I think?
const { resolve } = require('path');


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
                    gpio.write(7, true, function(err) {
                        if (err) throw err;
                        resolve('Auger turned on.');
                    });
                } else {
                    console.log('NOPI Auger turned on.');
                    resolve('NOPI Auger turned on.');
                }
            });
            
        },
        // Turns the auger off (pin 7 low)
        off(gpio) {
            return new Promise((resolve) => {
                if (process.env.ONPI == 'true') {
                    gpio.write(7, false, function(err) {
                        if (err) throw err;
                        resolve('Auger turned on.');

                    });
                } else {
                    console.log('NOPI Auger turned off.');
                    resolve('NOPI Auger turned off.');
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
                    if (process.env.DEBUG == 'true') console.log(res);
                    // Sleep for the time set in env variables
                    functions.sleep(process.env.ONTIME).then((res) => {
                        // Log action if in debug mode
                        if (process.env.DEBUG == 'true') console.log(res);
                        // Turn the auger off
                        this.off(gpio).then((res) => {
                            // Log action if in debug mode
                            if (process.env.DEBUG == 'true') console.log(res);
                            // Sleep for the time set in env variables
                            functions.sleep(process.env.OFFTIME).then((res) => {
                                // Log action if in debug mode
                                if (process.env.DEBUG == 'true') console.log(res);
                                // Resolve the promise, letting the main script know the cycle is complete
                                resolve("Cycle complete.");
                            });
                        });
                    });
                });
            });
        },
    },
    files: {
        // Check for a preset-list of files in the root directory of the app
        check() {
            return new Promise((resolve, reject) => {
                // Check for pause file existing
                if (fs.existsSync('./pause')) {
                    // Resolve the promise, letting the main script know what we found
                    resolve("pause");
                }

                // Check for reload file existing
                if (fs.existsSync('./reload')) {
                    // Resolve the promise, letting the main script know what we found
                    resolve("reload");
                }

                // Check for quit file existing
                if (fs.existsSync('./quit')) {
                    // Resolve the promise, letting the main script know what we found
                    resolve("quit");
                }
                // Resolve the promise, letting the main script know what we found (nothing)
                resolve("none");
            });
        },
    },
    commands: {
        // Pauses the script for the time defined in env variables
        pause() {
            return new Promise((resolve) => {
                functions.sleep(process.env.PAUSETIME).then(() => { resolve(); });
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
                    if (process.env.DEBUG == 'true') console.log('Deleted reload file.');
                });
                // Print out the new environment variables
                // This should be printed regardless of debug status, maybe prettied up TODO?
                console.log('Reloaded environment variables.');
                console.log(`ONTIME=${process.env.ONTIME}\nOFFTIME=${process.env.OFFTIME}\nPAUSETIME=${process.env.PAUSETIME}\nDEBUG=${process.env.DEBUG}\nONPI=${process.env.ONPI}`);
                // Resolve the promise, letting the main script know we're done reloading the variables and the cycle can continue
                resolve();
            });
            
        },
        // Shutdown the script gracefully
        quit() {
            // Delete the quit file
            fs.unlink('./quit', (err) => {
                if (err) throw err;
                if (process.env.DEBUG == 'true') console.log('Removed quit file.');
            });
            // Print out that the script is quitting
            console.log('Quitting...');
            // Quit the script
            process.exit();
        },
    },
    // Sleeps for any given milliseconds
    sleep(ms) {
        return new Promise((resolve) => {
            if (process.env.DEBUG == "true") console.log(`Sleeping for ${ms}ms`);
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
== == ONTIME=${process.env.ONTIME}
== == OFFTIME=${process.env.OFFTIME}
== == PAUSETIME=${process.env.PAUSETIME}
== == DEBUG=${process.env.DEBUG}
== == ONPI=${process.env.ONPI}`);
            // Set up GPIO 4 (pysical pin 7) as output, then call functions.auger.ready()
            if (process.env.ONPI == 'true') {
                // Init the Auger pin
                gpio.setup(augerPin, gpio.DIR_OUT, (err) => {
                    if (err) reject(err);
                    if (process.env.DEBUG == 'true') console.log('== Auger pin initialized.');
                    // Init the igniter pin
                    gpio.setup(igniterPin, gpio.DIR_OUT, (err) => {
                        if (err) reject(err);
                        if (process.env.DEBUG == 'true') console.log('== Igniter pin initialized.');
                        // Init the blower pin
                        gpio.setup(blowerPin, gpio.DIR_OUT, (err) => {
                            if (err) reject(err);
                            if (process.env.DEBUG == 'true') console.log('== Combustion blower pin initialized.');
                            // Init the Proof of Fire pin
                            gpio.setup(pofPin, gpio.DIR_IN, (err) => {
                                if (err) reject(err);
                                if (process.env.DEBUG == 'true') console.log('== Proof of Fire pin initialized.');
                                // Init the Temp Sensor pin
                                gpio.setup(tempPin, gpio.DIR_IN, (err) => {
                                    if (err) reject(err);
                                    if (process.env.DEBUG == 'true') console.log('== Temperature pin initialized.');
                                    // Init the Vacuum Switch pin
                                    gpio.setup(vacuumPin, gpio.DIR_IN, (err) => {
                                        if (err) reject(err);
                                        if (process.env.DEBUG == 'true') console.log('== Vacuum Switch pin initialized.');
                                        // Resolve the promise now that all pins have been initialized
                                        resolve('== GPIO Initialized.');
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                // Resolve the promise
                resolve('GPIO Not Available');
            }
        });
    },
}

// Export the above object, functions, as a module
module.exports = { functions };