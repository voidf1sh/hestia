// TODOs: Add tests for PoF and Vacuum switches, add delays for shutting down blower, test logic for igniter

// Require the package for pulling version numbers
const package = require('../package.json');
// Database Functions
const dbfn = require('./database.js');


// Get environment variables
const dotenv = require('dotenv').config();
// Module for working with files
const fs = require('fs');
const { exec } = require('child_process');
var config = require('../templates/config.json');


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
                    gpio.write(augerPin, true, function (err) {
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
                    gpio.write(augerPin, false, function (err) {
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
                    // if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                    // Sleep for the time set in env variables
                    functions.sleep(config.intervals.augerOn).then((res) => {
                        // Log action if in debug mode
                        // if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                        // Turn the auger off
                        this.off(gpio).then((res) => {
                            // Log action if in debug mode
                            // if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
                            // Sleep for the time set in env variables
                            functions.sleep(config.intervals.augerOff).then((res) => {
                                // Log action if in debug mode
                                // if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: ${res}`);
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
        startup() {
            // Basic startup just enables the auger
            config.status.auger = 1;
            console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] I: Auger enabled.`);
            return;
        },
        shutdown() {
            // Basic shutdown only needs to disable the auger
            config.status.auger = 0;
            console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] I: Auger disabled.`);
        },
        // Pauses the script for the time defined in env variables
        pause() {
            return new Promise((resolve) => {
                if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] I: Pausing for ${config.intervals.pause}ms`);

                functions.sleep(config.intervals.pause).then((res) => {
                    if (process.env.DEBUG) console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] I: Pause finished.`);
                    resolve();
                });
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
                    if (process.env.DEBUG) console.log('Deleted reload file.');
                });
                // Print out the new environment variables
                // This should be printed regardless of debug status, maybe prettied up TODO?
                console.log('Reloaded environment variables.');
                console.log(`ONTIME=${config.intervals.augerOn}\nOFFTIME=${config.intervals.augerOff}\nPAUSETIME=${config.intervals.pause}\nDEBUG=${process.env.DEBUG}\nONPI=${process.env.ONPI}`);
                // Resolve the promise, letting the main script know we're done reloading the variables and the cycle can continue
                resolve();
            });

        },
        refreshConfig() {
            return new Promise((resolve, reject) => {
                // When the reload button is pressed, the call to this function will contain new config values
                // {
                //     augerOff: 500,
                //     augerOn: 1500,
                //     pause: 5000
                // }
                // if (newSettings != undefined) {
                //     config.intervals.augerOff = newSettings.augerOff;
                //     config.intervals.augerOn = newSettings.augerOn;
                //     console.log(`[${(Date.now() - config.timestamps.procStart)/1000}] I: Intervals updated: (${newSettings.augerOn}/${newSettings.augerOff})`);

                // }
                // fs.writeFile('./config.json', JSON.stringify(config), (err) => {
                //     if (err) reject(err);
                //     resolve();
                // });

                // Get status
                const selectStatusQuery = "SELECT * FROM status";
                dbfn.all(selectStatusQuery).then(res => {
                    console.log(JSON.stringify(res));
                    let { status } = config;
                    let { rows } = res;
                    status.auger = rows.auger;
                    status.blower = rows.blower;
                    status.igniter = rows.igniter;
                    status.igniterFinished = rows.igniter_finished;
                    status.pof = rows.proof_of_fire;
                    status.shutdownNextCycle = rows.shutdown_next_cycle;
                    status.vacuum = rows.vacuum;

                    // Get timestamps
                    const selectTimestampsQuery = "SELECT * FROM timestamps";
                    dbfn.all(selectTimestampsQuery).then(res => {
                        console.log(JSON.stringify(res));
                        let { timestamps } = config;
                        let { rows } = res;
                        timestamps.blowerOff = rows.blower_off;
                        timestamps.blowerOn = rows.blower_on;
                        timestamps.igniterOff = rows.igniter_off;
                        timestamps.igniterOn = rows.igniter_on;
                        timestamps.procStart = rows.process_start;

                        // Get intervals
                        const selectIntervalsQuery = "SELECT * FROM intervals";
                        dbfn.all(selectIntervalsQuery).then(res => {
                            console.log(JSON.stringify(res));
                            let { intervals } = config;
                            let { rows } = res;
                            intervals.augerOff = rows.auger_off;
                            intervals.augerOn = rows.auger_on;
                            intervals.blowerStop = rows.blower_stop;
                            intervals.igniterStart = rows.igniter_start;
                            intervals.pause = rows.pause;
                            resolve({ "status": "Refreshed the config", "config": config });
                        }).catch(err => {
                            reject(err);
                            return;
                        });
                    }).catch(err => {
                        reject(err);
                        return;
                    });
                }).catch(err => {
                    reject(err);
                    return;
                });
            });
        },
        quit() {
            functions.commands.shutdown();
            functions.auger.off(gpio).then(res => {
                console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] I: Exiting app...`);
                process.exit(0);
            }).catch(err => {
                console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] E: Unable to shut off auger, rebooting Pi!`);
                exec('shutdown -r 0');
            });
        }
    },
    // Sleeps for any given milliseconds
    sleep(ms) {
        return new Promise((resolve) => {
            // if (process.env.DEBUG) console.log(`Sleeping for ${ms}ms`);
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
                config = require('../config.json');
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
== == DEBUG=${process.env.DEBUG}
== == ONPI=${process.env.ONPI}`);
            // Set up GPIO 4 (pysical pin 7) as output, then call functions.auger.ready()
            if (process.env.ONPI == 'true') {
                // Init the Auger pin
                gpio.setup(augerPin, gpio.DIR_OUT, (err) => {
                    if (err) reject(err);
                    if (process.env.DEBUG) console.log('== Auger pin initialized.');
                    // Resolve the promise now that all pins have been initialized
                    resolve('== GPIO Initialized.');
                });
            } else {
                // Resolve the promise
                resolve('== GPIO Not Available');
            }
        });
    },
    checkForQuit() {
        if (config.status.shutdownNextCycle == 1) {
            console.log(`[${(Date.now() - config.timestamps.procStart) / 1000}] I: Exiting Process!`);
            process.exit();
        }
        return new Promise((resolve, reject) => {
            if (fs.existsSync('./quit')) {
                fs.unlink('./quit', err => {
                    if (err) console.log('Error removing the quit file: ' + err);
                    config.status.shutdownNextCycle = 1;
                    config.status.auger = 0;
                    resolve();
                });
            } else {
                resolve('Not shutting down');
            }
        });
    },
    time(stamp) {
        const time = new Date(stamp);
        return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    }
}



// Export the above object, functions, as a module
module.exports = { functions };