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
    // Sleeps for any given milliseconds, call with await
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
            // Write the current env vars to console
            console.log('Environment variables:');
            console.log(`ONTIME=${process.env.ONTIME}\nOFFTIME=${process.env.OFFTIME}\nPAUSETIME=${process.env.PAUSETIME}\nDEBUG=${process.env.DEBUG}\nONPI=${process.env.ONPI}`);
            // Set up GPIO 4 (pysical pin 7) as output, then call functions.auger.ready()
            if (process.env.ONPI == 'true') {
                gpio.setup(7, gpio.DIR_OUT, (err) => {
                    if (err) reject(err);
                    // Resolve the promise
                    resolve('GPIO Initialized');
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