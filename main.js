//This example shows how to setup the pin for write mode with the default state as "on". Why do this? It can sometimes be useful to reverse the default initial state due to wiring or uncontrollable circumstances.
//var gpio = require('rpi-gpio');

//gpio.setup(7, gpio.DIR_OUT, write);

// function augerOn(err) {
//     if (err) throw err;
//     gpio.write(7, true, function(err) {
//         if (err) throw err;
//         console.log('Auger turned on.');
//     });
// }

// function augerOff(err) {
//     if (err) throw err;
//     gpio.write(7, false, function(err) {
//         if (err) throw err;
//         console.log('Auger turned off.');
//     });
// }

function augerOff() {
    console.log('Auger turned off.');
}

function augerOn() {
    console.log('Auger turned on.');
}
  
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
        console.log("Slept for ${ms}ms");
    });
}

async function cycleAuger() {
    augerOn();
    await sleep(500);
    augerOff();
    await sleep(800);
}

while (true) {
    cycleAuger();
}