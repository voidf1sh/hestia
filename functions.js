// TODOs: Add tests for PoF and Vacuum switches, add delays for shutting down blower, test logic for igniter

// Physical Pin numbers for GPIO
const augerPin = 26;         // Pin for controlling the relay for the pellet auger motor.
const igniterPin = 13;      // Pin for controlling the relay for the igniter.
const blowerPin = 15;       // Pin for controlling the relay for the combustion blower/exhaust.
const pofPin = 16;          // Pin for sensing the status (open/closed) of the Proof of Fire switch.
// const tempPin = 18;         // Pin for receiving data from a DS18B20 OneWire temperature sensor.
const vacuumPin = 22;       // Pin for sensing the status (open/closed) of the vacuum switch.

// Require the package for pulling version numbers
const package = require('./package.json');
// Import the config file
const config = require('./config.json');

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
                    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                    // Sleep for the time set in env variables
                    functions.sleep(config.intervals.augerOn).then((res) => {
                        // Log action if in debug mode
                        if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                        // Turn the auger off
                        this.off(gpio).then((res) => {
                            // Log action if in debug mode
                            if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                            // Sleep for the time set in env variables
                            functions.sleep(config.intervals.augerOff).then((res) => {
                                // Log action if in debug mode
                                if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                                // Resolve the promise, letting the main script know the cycle is complete
                                resolve("Cycle complete.");
                            });
                        });
                    });
                });
            });
        },
    },
    blower: {
        canShutdown() {
            // If the blowerOff timestamp hasn't been set, return false as the blower hasn't been asked to turn off yet
            if (config.timestamps.blowerOff == 0) return false;
            // If the current time is past the blowerOff timestamp, we can turn off the blower
            if (Date.now() > config.timestamps.blowerOff) {
                return true;
            // Otherwise, return false because we're not ready to 
            } else {
                return false;
            }
        }
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

                // Check for ignite file existing
                if (fs.existsSync('./ignite')) {
                    resolve('ignite');
                }

                // Check for start file existing
                if (fs.existsSync('./start')) {
                    resolve('start');
                }
                // Resolve the promise, letting the main script know what we found (nothing)
                resolve("none");
            });
        },
    },
    commands: {
        // Prepare the stove for starting
        startup (gpio) {
            fs.unlink('./start', (err) => {
                if (err) throw err;
            });
            return new Promise((resolve, reject) => {
                if (process.env.ONPI == 'true') {
                    // Turn the combustion blower on
                    functions.power.blower.on(gpio).then(res => {
                        resolve(`I: Combustion blower has been enabled.`);
                    }).catch(rej => {
                        reject(`E: There was a problem starting the combustion blower: ${rej}`);
                    });
                } else {
                    resolve(`I: Simulated combustion blower turned on.`);
                }
            });
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
        // Shutdown the script gracefully
        quit() {
            // TODO add quit file detection, not always going to be quitting from files
            // Delete the quit file
            fs.unlink('./quit', (err) => {
                if (err) throw err;
                if (config.debugMode) console.log('Removed quit file.');
            });
            // Print out that the script is quitting
            console.log('Quitting...');
            // Quit the script
            process.exit();
        },
        ignite(gpio) {
            config.status.auger = 1;
            config.timestamps.igniterOn = Date.now();
            config.timestamps.igniterOff = config.timestamps.igniterOn + config.intervals.igniterStart;     // 7 Minutes, 420,000ms
            return new Promise((resolve, reject) => {
                fs.unlink('./ignite', (err) => {
                    if (err) reject(err);
                    if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Deleted the ignite file.`);                    
                });
                // Run the first block if this is being run on a Raspberry Pi
                if (process.env.ONPI == 'true') {
                    functions.power.blower.on(gpio).then(res => {
                        // TODO move this to a fn.power function
                        // Turn on the igniter
                        functions.power.igniter.on(gpio).then(res => {
                            resolve('Auger enabled, combustion blower and igniter turned on.');
                        }).catch(err => {
                            reject(err);
                        });
                    });

                } else {
                    resolve('Simulated igniter turned on.');
                }
            });
        },
        shutdown(gpio) {
            // Only run if a shutdown isn't already started
            if (config.status.shutdown == 0) {
                // set shutdown flag to 1
                config.status.shutdown = 1;
                // Check if this was invoked from a 'quit' file, if so, delete the file
                if (fs.existsSync('./quit')) fs.unlink('./quit', (err) => { throw err; });
                // If the auger is enabled, disable it
                if (config.status.auger == 1) {
                    config.status.auger = 0;
                }
                // If the igniter is on, shut it off.
                if (config.status.igniter == 1) {
                    functions.power.igniter.off(gpio).then(res => {
                        if (config.debugMode) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Shut off igniter.`);
                    }); // TODO catch an error here
                }
                // TODO Change this so it gives a delay after shutting down so smoke doesn't enter the house
                if (config.status.blower == 1) {
                    // Set the timestamp to turn the blower off at
                    config.timestamps.blowerOff = Date.now() + config.intervals.blowerStop;
                }
                return "Shutdown has been initiated.";
            } else {
                return "A shutdown has already been initiated.";
            }
        },
    },
    tests: {
        vacuum(gpio) {
            return new Promise((resolve, reject) => {
                gpio.read(vacuumPin, (err, status) => {
                    if (err) reject(err);
                    resolve(status);
                });
            });
        },
        pof(gpio) {
            return new Promise((resolve, reject) => {
                gpio.read(pofPin, (err, status) => {
                    if (err) reject(err);
                    resolve(status);
                });
            });
        },
        igniter(gpio) {
            return new Promise((resolve, reject) => {
                var statusMsg = "";
                if (config.status.igniter == 1) {
                    statusMsg += "The igniter is on.\n";
                } else if (config.status.igniter == 0) {
                    statusMsg += "The igniter is off.\n";
                } else {
                    reject("E: Unable to determine igniter status.");
                }
                if (config.timestamps.igniterOn > 0) {
                    const humanStartTime = new Date(config.timestamps.igniterOn).toISOString();
                    const humanEndTime = new Date(config.timestamps.igniterOff).toISOString();
                    if (Date.now() < config.timestamps.igniterOff && config.status.igniter == 1) {
                        statusMsg += `Igniter started: ${humanStartTime}.\n`;
                        statusMsg += `Igniter scheduled to stop: ${humanEndTime}.\n`;
                    }
                    // Shut the igniter off if it's past the waiting period
                    if ((Date.now() > config.timestamps.igniterOff) && (config.status.igniter == 1)) {
                        if (process.env.ONPI == 'true') {
                            gpio.write(igniterPin, false, (err) => {
                                if (err) throw(err);
                                config.status.igniter = 0;
                                statusMsg += `${new Date().toISOString()} I: Turned off igniter.`;
                                functions.tests.pof(gpio).then(res => {
                                    if (res) {
                                        config.status.seenFire = true;
                                    } else {
                                        reject(`E: No Proof of Fire after igniter shut off.`);
                                    }
                                }).catch(rej => {

                                });
                            });
                        } else {
                            config.status.igniter = 0;
                            statusMsg += `${new Date().toISOString()} I: Simulated igniter turned off.`;
                        }                       
                    } else if  ((Date.now() > config.timestamps.igniterOff) && (config.status.igniter == 0)) {
                        statusMsg += `The igniter was turned off at ${new Date(config.timestamps.igniterOff).toISOString()}.`;
                    }
                } else {
                    statusMsg += 'The igniter hasn\'t been started yet.';
                }
                resolve(statusMsg);
            });
        },
        blowerOffDelay() {

        },
    },
    power: {
        igniter: {
            on(gpio) {
                // TODO
                return new Promise((resolve, reject) => {
                    gpio.write(igniterPin, true, (err) => {
                        if (err) reject(err);
                        config.status.igniter = 1;
                        resolve('Igniter turned on.');
                    });
                });
            },
            off(gpio) {
                // TODO
                return new Promise((resolve, reject) => {
                    gpio.write(igniterPin, false, (err) => {
                        if (err) reject(err);
                        config.status.igniter = 0;
                        resolve('Igniter turned off.');
                    });
                });
            },
        },
        blower: {
            on(gpio) {
                // TODO
                return new Promise((resolve, reject) => {
                    gpio.write(blowerPin, true, (err) => {
                        if (err) reject(err);
                        config.status.blower = 1;
                        resolve('Blower turned on.');
                    });
                });
            },
            off(gpio) {
                // TODO
                return new Promise((resolve, reject) => {
                    gpio.write(blowerPin, false, (err) => {
                        if (err) reject(err);
                        config.status.blower = 0;
                        resolve('Blower turned off.');
                    });
                });
            },
        },
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
                    // Init the igniter pin
                    gpio.setup(igniterPin, gpio.DIR_OUT, (err) => {
                        if (err) reject(err);
                        if (config.debugMode) console.log('== Igniter pin initialized.');
                        // Init the blower pin
                        gpio.setup(blowerPin, gpio.DIR_OUT, (err) => {
                            if (err) reject(err);
                            if (config.debugMode) console.log('== Combustion blower pin initialized.');
                            // Init the Proof of Fire pin
                            gpio.setup(pofPin, gpio.DIR_IN, (err) => {
                                if (err) reject(err);
                                if (config.debugMode) console.log('== Proof of Fire pin initialized.');
                                // Init the Vacuum Switch pin
                                gpio.setup(vacuumPin, gpio.DIR_IN, (err) => {
                                    if (err) reject(err);
                                    if (config.debugMode) console.log('== Vacuum Switch pin initialized.');
                                    // Resolve the promise now that all pins have been initialized
                                    resolve('== GPIO Initialized.');
                                });
                                // Init the Temp Sensor pin
                                // gpio.setup(tempPin, gpio.DIR_IN, (err) => {
                                //     if (err) reject(err);
                                //     if (config.debugMode) console.log('== Temperature pin initialized.');
                                    
                                // });
                            });
                        });
                    });
                });
            } else {
                // Resolve the promise
                resolve('== GPIO Not Available');
            }
        });
    },
}

// Export the above object, functions, as a module
module.exports = { functions };