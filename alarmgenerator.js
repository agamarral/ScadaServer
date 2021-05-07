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

let watchdog = false;

async function refresh_watchdog(publisher) {
    watchdog = !watchdog;
    await publisher.send('health', JSON.stringify(watchdog));
}

async function publish_data(publisher) {

    logger.debug("publish_data");
    
    alarmData = [];


    for (let i = 0; i< 500; i++) {
        alarmData.push( {
            id: i,
            severity: shuffle([1,2,3])[0],
            appeared: new Date(1969, 07, 20, 9, 32, 37, 22),
            disappeared: shuffle([Date.now(), new Date(0)])[0],
            acknowledged: shuffle([Date.now(), new Date(0)])[0],
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
        setInterval(publish_data, config_data.eventpublisher.refreshcycle, pub);
        setInterval(refresh_watchdog, config_data.common.healthcycle, pub);
         
    });
}

run()