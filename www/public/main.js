function sleep(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

function readJSON(path) {
    var request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send(null)
    var JSONObj = JSON.parse(request.responseText);
    return JSONObj;
}

function parseStatus(data) {
    switch (data) {
        case 0:
            return "Off";
            break;
        case 1:
            return "On";
            break
        default:
            return "Error";
            break;
    }
}

function refreshData() {
    // const log = document.getElementById('log-area');
    // log.contentWindow.location.reload();
    // sleep(100).then(() => {
        // document.getElementById('log-area').contentWindow.scrollTo(0, 9999999999);
    // });

    // Get the elements we need to update
    const statusTable = document.getElementById('status-table');
    const augerStatus = statusTable.rows[0].cells[1];
    const augerOn = statusTable.rows[0].cells[3];
    const augerOff = statusTable.rows[1].cells[3];
    const feedRate = statusTable.rows[1].cells[1];

    // console.log(config);

    augerStatus.innerHTML = parseStatus(config.status.auger);
    augerOn.innerHTML = config.intervals.augerOn;
    augerOff.innerHTML = config.intervals.augerOff;

    switch (config.intervals.augerOn) {
        case '600':
            feedRate.innerHTML = 'Low';
            break;
        case '800':
            feedRate.innerHTML = 'Medium';
            break;
        case '1000':
            feedRate.innerHTML = 'High';
            break;
        default:
            feedRate.innerHTML = 'Unknown';
            break;
    }
    feedRate.value = config.intervals.augerOn;
    
    // Run this again after 2 seconds
    sleep(5000).then(() => {
        refreshData();
    });
};