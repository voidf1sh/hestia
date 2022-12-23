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
        document.getElementById('log-area').contentWindow.scrollTo(0, 9999999);
    });

    const augerStatus = document.getElementById('auger-status');
    // const augerOn = document.getElementById('auger-on');
    // const augerOff = document.getElementById('auger-off');
    const igniterStatus = document.getElementById('igniter-status');
    const blowerStatus = document.getElementById('blower-status');
    // const pauseInt = document.getElementById('pause-int');
    const vacuumStatus = document.getElementById('vacuum-status');
    const pofStatus = document.getElementById('pof-status');

    const config = readJSON('./config.json');

    augerStatus.innerHTML = parseStatus(config.status.auger);
    // augerOn.innerHTML = parseStatus(config.intervals.augerOn);
    // augerOff.innerHTML = parseStatus(config.intervals.augerOff);
    igniterStatus.innerHTML = parseStatus(config.status.igniter);
    blowerStatus.innerHTML = parseStatus(config.status.blower);
    // pauseInt.innerHTML = parseStatus(config.intervals.pause);
    vacuumStatus.innerHTML = parseStatus(config.status.vacuum);
    pofStatus.innerHTML = parseStatus(config.status.pof);

    sleep(2000).then(() => {
        refreshData();
    });
};