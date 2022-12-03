const fn = require('./functions').functions;

// TODO Add logic for other sensors

while (true) {
    await main();
}

// Main function, turns the auger on, sleeps for the time given in environment variables, then turns the auger off, sleeps, repeats.
async function main() {
    fn.files.check();

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