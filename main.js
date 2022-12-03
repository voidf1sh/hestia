// Custom functions module to keep main script clean
const fn = require('./functions').functions;

// Environment Variables Importing
const dotenv = require('dotenv').config();

// TODO Add logic for other sensors

while (true) {
    main();
}

// Main function, turns the auger on, sleeps for the time given in environment variables, then turns the auger off, sleeps, repeats.
async function main() {
    switch (fn.files.check()) {
        case "pause":
            fn.commands.pause();
            break;
        case "reload":
            fn.commands.reload();
            break;
        case "quit":
            fn.commands.quit();
            break;
        case "none":
            fn.auger.cycle();
            break;
    
        default:
            break;
    }
}