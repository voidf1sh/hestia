// Get environment variables
const dotenv = require('dotenv').config();
// Module for working with files
const fs = require('fs');
const { resolve } = require('path');


// The functions we'll export to be used in other files
const functions = {
    auger: {
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
        off() {
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
                this.on(gpio).then((res) => {
                    if (process.env.DEBUG == 'true') console.log(res);
                    functions.sleep(process.env.ONTIME).then((res) => {
                        if (process.env.DEBUG == 'true') console.log(res);
                        this.off(gpio).then((res) => {
                            if (process.env.DEBUG == 'true') console.log(res);
                            functions.sleep(process.env.OFFTIME).then((res) => {
                                if (process.env.DEBUG == 'true') console.log(res);
                                resolve("Cycle complete.");
                            });
                        });
                    });
                });
            });
        },
    },
    files: {
        check() {
            return new Promise((resolve, reject) => {
                // TODO this code needs to be finished from migration
                // Check for pause file existing, then sleep for preset time, then run the function again.
                if (fs.existsSync('./pause')) {
                    resolve("pause");
                }

                // Check for reload file existing, then reload environment variables, then delete the file.
                if (fs.existsSync('./reload')) {
                    resolve("reload");
                }

                // Check for quit file existing, then delete it, then quit the program
                if (fs.existsSync('./quit')) {
                    resolve("quit");
                }
                resolve("none");
            });
        },
    },
    commands: {
        pause() {
            return new Promise((resolve) => {
                functions.sleep(process.env.PAUSETIME).then(() => { resolve(); });
            });
        },
        reload(envs) {
            return new Promise((resolve) => {
                const dotenv = require('dotenv').config({ override: true });
                fs.unlink('./reload', (err) => {
                    if (err) throw err;
                    console.log('Deleted reload file.');
                });
                console.log('Reloaded environment variables.');
                console.log(`ONTIME=${process.env.ONTIME}\nOFFTIME=${process.env.OFFTIME}\nPAUSETIME=${process.env.PAUSETIME}\nDEBUG=${process.env.DEBUG}\nONPI=${process.env.ONPI}`);
                resolve();
            });
            
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
            if (process.env.DEBUG == "true") console.log(`Sleeping for ${ms}ms`);
            const finish = () => {
                resolve(`Slept for ${ms}ms`);
            }
            setTimeout(finish, ms);
        });
    },
    init(gpio) {
        return new Promise((resolve, reject) => {
            // Write the current env vars to console
            console.log('Environment variables:');
            console.log(`ONTIME=${process.env.ONTIME}\nOFFTIME=${process.env.OFFTIME}\nPAUSETIME=${process.env.PAUSETIME}\nDEBUG=${process.env.DEBUG}\nONPI=${process.env.ONPI}`);
            // Set up GPIO 4 (pysical pin 7) as output, then call functions.auger.ready()
            if (process.env.ONPI == 'true') {
                gpio.setup(7, gpio.DIR_OUT, (err) => {
                    if (err) reject(err);
                    resolve('GPIO Initialized');
                });
            } else {
                resolve('GPIO Not Available');
            }
        });
    },
}

module.exports = { functions };