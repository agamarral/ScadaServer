const zmq = require("zeromq");
const alarmsub = require('./alarmsubscriber.js');
var loglib = require('logger');
config_data = require('./config/config.json');



async function run() {
    const ctx = new zmq.Context();

    logger = loglib.createLogger(config_data.common.logfile);
    logger.setLevel(config_data.common.loglevel);
    logger.format = function(level, date, message) {
        return date + " - ALARMMGR: " + message;
    };

    logger.debug("create alarm subscriber");
    const sub = new alarmsub.AlarmSubscriber(ctx, config_data.alarmpublisher.zmqendpoint, 
                                                ['alarms', 'health'],
                                                'undefined', config_data.alarmsubscriber.ioport,
                                                "alarmCache");
    await sub.init();

    
    process.on('SIGINT', function() {
        sub.exit();
    });
}

run()