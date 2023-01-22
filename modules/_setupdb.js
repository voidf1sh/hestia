const dbfn = require('../modules/database.js');

// Create `status` table
/*
    + ----- + ------------- + ---- + --- + ------- + -------------- +
    | Field | Type          | Null | Key | Default | Extra          |
    + ----- + ------------- + ---- + --- + ------- + -------------- +
    | key   | varchar(100)  | No   |     |         |                |
    | value | varchar(1000) | No   |     |         |                |
    + ----- + ------------- + ---- + --- + ------- + -------------- +

    + ------------------- +
    | igniter             |
    | blower              |
    | auger               |
    | igniter_finished    |
    | shutdown_initiated  |
    | vacuum              |
    | proof_of_fire       |
    | shutdown_next_cycle |
    + ------------------- +

CREATE TABLE IF NOT EXISTS status (
    key varchar(100) NOT NULL,
    value varchar(1000) NOT NULL
);
*/

const createStatusTableQuery = "CREATE TABLE IF NOT EXISTS status (key varchar(100) NOT NULL,value varchar(1000) NOT NULL);";
dbfn.run(createStatusTableQuery).then(res => {
    console.log(res.status);
    const statusEntries = {
        igniter: 0,
        blower: 0,
        auger: 0,
        igniter_finished: false,
        shutdown_initiated: 0,
        vacuum: 0,
        proof_of_fire: 0,
        shutdown_next_cycle: 0
    };
    for ( key in statusEntries ){
        const insertStatusEntryQuery = `INSERT INTO status (key, value) VALUES ("${key}", "${statusEntries[key]}")`;
        dbfn.run(insertStatusEntryQuery).then(res => {
            console.log(`${res.status}: ${res.data.lastID}: ${res.data.changes} changes`);
        }).catch(err => console.error(err));
    }
    const selectAllStatusEntriesQuery = "SELECT * FROM status";
    dbfn.all(selectAllStatusEntriesQuery).then(res => {
        console.log(res.status);
    }).catch(err => console.error(err));
}).catch(err => {
    console.error(err);
});

// Create `timestamps` table
/*
    + ----- + ------------- + ---- + --- + ------- + -------------- +
    | Field | Type          | Null | Key | Default | Extra          |
    + ----- + ------------- + ---- + --- + ------- + -------------- +
    | key   | varchar(100)  | No   |     |         |                |
    | value | varchar(1000) | No   |     |         |                |
    + ----- + ------------- + ---- + --- + ------- + -------------- +

    + ------------- +
    | process_start |
    | blower_on     |
    | blower_off    |
    | igniter_on    |
    | igniter_off   |
    + ------------- +

CREATE TABLE IF NOT EXISTS timestamps (
    key varchar(100) NOT NULL,
    value varchar(1000) NOT NULL
);
*/

const createTimestampsTableQuery = "CREATE TABLE IF NOT EXISTS timestamps (key varchar(100) NOT NULL,value varchar(1000) NOT NULL);";
dbfn.run(createTimestampsTableQuery).then(res => {
    console.log(res.status);
    const timestampsEntries = {
        process_start: 0,
        blower_on: 0,
        blower_off: 0,
        igniter_on: 0,
        igniter_off: 0
    };
    for ( key in timestampsEntries ){
        const insertTimestampsEntryQuery = `INSERT INTO timestamps (key, value) VALUES ("${key}", "${timestampsEntries[key]}")`;
        dbfn.run(insertTimestampsEntryQuery).then(res => {
            console.log(`${res.status}: ${res.data.lastID}: ${res.data.changes} changes`);
        }).catch(err => console.error(err));
    }
    const selectAllTimestampsEntriesQuery = "SELECT * FROM timestamps";
    dbfn.all(selectAllTimestampsEntriesQuery).then(res => {
        console.log(res.status);
    }).catch(err => console.error(err));
}).catch(err => {
    console.error(err);
});

// Create `intervals` table
/*
    + ----- + ------------- + ---- + --- + ------- + -------------- +
    | Field | Type          | Null | Key | Default | Extra          |
    + ----- + ------------- + ---- + --- + ------- + -------------- +
    | key   | varchar(100)  | No   |     |         |                |
    | value | varchar(1000) | No   |     |         |                |
    + ----- + ------------- + ---- + --- + ------- + -------------- +

    + ------------- +
    | auger_on      |
    | auger_off     |
    | pause         |
    | igniter_start |
    | blower_stop   |
    + ------------- +

CREATE TABLE IF NOT EXISTS intervals (
    key varchar(100) NOT NULL,
    value varchar(1000) NOT NULL
);
*/

const createIntervalsTableQuery = "CREATE TABLE IF NOT EXISTS intervals (key varchar(100) NOT NULL,value varchar(1000) NOT NULL);";
dbfn.run(createIntervalsTableQuery).then(res => {
    console.log(res.status);
    const intervalsEntries = {
        auger_on: 600,
        auger_off: 1400,
        pause: 5000,
        igniter_start: 420000,
        blower_stop: 600000
    };
    for ( key in intervalsEntries ){
        const insertIntervalsEntryQuery = `INSERT INTO intervals (key, value) VALUES ("${key}", "${intervalsEntries[key]}")`;
        dbfn.run(insertIntervalsEntryQuery).then(res => {
            console.log(`${res.status}: ${res.data.lastID}: ${res.data.changes} changes`);
        }).catch(err => console.error(err));
    }
    const selectAllIntervalsEntriesQuery = "SELECT * FROM intervals";
    dbfn.all(selectAllIntervalsEntriesQuery).then(res => {
        console.log(res.status);
    }).catch(err => console.error(err));
}).catch(err => {
    console.error(err);
});

// Show the tables to confirm they were created properly:

dbfn.showTables().then(res => {
    res.rows.forEach(row => {
        console.log("Table: " + JSON.stringify(row));
    });
}).catch(err => {
    console.error(err);
});