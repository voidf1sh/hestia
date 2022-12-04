// Custom functions module to keep main script clean
const fn = require('./functions.js').functions;

// Environment Variables Importing
const dotenv = require('dotenv').config();

// TODO Add logic for other sensors

main(fn);

// Main function, turns the auger on, sleeps for the time given in environment variables, then turns the auger off, sleeps, repeats.
async function main(fn) {
    fn.files.check().then((res,rej) => {
        console.log('File Check: ' + res);
        switch (res) {
            case "pause":
                fn.commands.pause().then(() => {
                    main(fn);
                });
                break;
            case "reload":
                fn.commands.reload().then(() => {
                    main(fn);
                });
                break;
            case "quit":
                fn.commands.quit();
                break;
            case "none":
                fn.auger.cycle().then(() => {
                    main(fn);
                });
                break;
        
            default:
            main(fn);
            break;
        }
    });
}