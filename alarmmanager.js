const zmq = require("zeromq");
const alarmsub = require('./alarmsubscriber.js');
var loglib = require('logger');
config_data = require('./config/config.json');


logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
    return date + " - ALARMMGR: " + message;
};

function init_alarms(subscriber) {

    alarmData = [];
    for (let i = 0; i< 100; i++) {
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
    subscriber.init_alarms(alarmData);
}
async function run() {
    const ctx = new zmq.Context();

    logger.debug("create alarm subscriber");
    const sub = new alarmsub.AlarmSubscriber(ctx, config_data.alarmpublisher.zmqendpoint, 
                                                ['alarms', 'health'],
                                                config_data.alarmstub.zmqendpoint, 
                                                config_data.alarmsubscriber.ioport,
                                                "alarmCache");
    init_alarms(sub);
    await sub.init();

    
    process.on('SIGINT', function() {
        sub.exit();
    });
}

run()