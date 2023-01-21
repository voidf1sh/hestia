const sqlite3 = require('sqlite3').verbose();
// Connect to or create the database. 
let db = new sqlite3.Database('./config.db', (err) => {
    if (err) console.error("DB Connect: " + err);
    console.log("Connected to database.");
});

