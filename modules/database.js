const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/config.db', (err) => {
    if (err) throw `E: DB Connection: ${err.message}`;
    console.log(`I: Connected to the database.`);
});

module.exports = {
	run(query) {
		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.run(query, function(err) {
					if (err) {
						reject("Problem executing the query: " + err.message);
						return;
					}
					resolve( { "status": "Query executed successfully: " + query, "data": this });
				});
			});
		});
	},
	all(query) {
		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.all(query, (err, rows) => {
					if (err) {
						reject("Problem executing the query: " + err.message);
						return;
					}
					// [ { key: 'key_name', value: '0' }, { key: 'key_name', value: '0' } ]
					let organizedRows = {};
					rows.forEach(row => {
						organizedRows[row.key] = row.value;
					});
					resolve({ "status": "Query executed successfully: " + query, "rows": organizedRows });
				});
			});
		});
	},
	showTables() {
		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
					if (err) {
						reject("Problem executing the query: " + err.message);
						return;
					}
					resolve({ "status": "Tables retreived successfully", "rows": rows });
				});
			});
		});
	}
};