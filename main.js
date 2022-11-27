var gpio = require('rpi-gpio');
var dotenv = require('dotenv').config();

gpio.setup(7, gpio.DIR_OUT, cycleAuger);

function augerOn(err) {
    if (err) throw err;
    gpio.write(7, true, function(err) {
        if (err) throw err;
        console.log('Auger turned on.');
    });
}

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
  
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
        console.log(`Slept for ${ms}ms`);
    });
}

async function cycleAuger(err) {
    if (err) throw err;
    augerOn();
    await sleep(process.env.ONTIME);
    augerOff();
    await sleep(process.env.OFFTIME);
    cycleAuger();
}