const zmq = require("zeromq");
//const proxylib = require('./proxy.js');
const publib = require('./publisher.js');
const loglib = require('logger');

config_data = require('./config/config.json');

const logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
        return date + " - ALARMPUB: " + message;
};



async function refresh_watchdog(publisher) {
    let watchdog = true;
    await publisher.send('health', JSON.stringify(watchdog));
}

async function publish_data(publisher) {
    
    alarmData = [];


    for (let i = 0; i< 500; i++) {
        alarmData.push( {
            id: i,
            severity: i % 3 + 1,
            appeared: Date.now() - 7200, //two hours ago
            disappeared: i%2 ? Date.now() : 0,
            acknowledged: i%3 ? Date.now() : 0,
            source: "TempSensor " + i.toString(),
            description: "Temperature exceeds 30º"
        });
    }

    await publisher.send('alarms', JSON.stringify(alarmData));

}
async function run() {
    const ctx = new zmq.Context();

    logger.debug("create publisher");
    const pub = new publib.Publisher(ctx, config_data.eventpublisher.zmqendpoint, ['alarms', 'health']);
    
    pub.init().then((result) => {
       
        //setInterval(pub.send.bind(pub), 20000, 'acqs', JSON.stringify(acqData));
        setInterval(publish_data, config_data.alarmpublisher.refreshcycle, pub);
        setInterval(refresh_watchdog, config_data.common.healthcycle, pub);
         
    });
}

run()