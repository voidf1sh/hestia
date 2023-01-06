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
    const log = document.getElementById('log-area');
    log.contentWindow.location.reload();
    sleep(100).then(() => {
        document.getElementById('log-area').contentWindow.scrollTo(0, 9999999999);
    });

    // Get the elements we need to update
    const augerStatus = document.getElementById('auger-status');
    const augerOn = document.getElementById('auger-on');
    const augerOff = document.getElementById('auger-off');
    const feedRate = document.getElementById('feed-rate');
    
    // Get the config file
    const config = readJSON('./config.json');
    // console.log(config);

    augerStatus.innerHTML = parseStatus(config.status.auger);
    augerOn.innerHTML = config.intervals.augerOn;
    augerOff.innerHTML = config.intervals.augerOff;

    switch (config.intervals.augerOn) {
        case 600:
            feedRate.selectedIndex = 0;
            break;
        case 800:
            feedRate.selectedIndex = 1;
            break;
        case 1000:
            feedRate.selectedIndex = 2;
            break;
        default:
            feedRate.selectedIndex = 0;
            break;
    }
    feedRate.value = config.intervals.augerOn;
    
    // Run this again after 2 seconds
    sleep(5000).then(() => {
        refreshData();
    });
};