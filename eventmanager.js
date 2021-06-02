const zmq = require("zeromq");
const eventsub = require('./eventsubscriber.js');
var loglib = require('logger');
config_data = require('./config/config.json');



async function run() {
    const ctx = new zmq.Context();

    logger = loglib.createLogger(config_data.common.logfile);
    logger.setLevel(config_data.common.loglevel);
    logger.format = function(level, date, message) {
        return date + " - EVENTMGR: " + message;
    };

    logger.debug("create event subscriber");
    const sub = new eventsub.EventSubscriber(ctx, config_data.eventpublisher.zmqendpoint, 
                                                ['events', 'health'],
                                                config_data.eventstub.zmqendpoint, 
                                                config_data.eventsubscriber.ioport,
                                                "eventCache");
    await sub.init();

    
    process.on('SIGINT', function() {
        sub.exit();
    });
}

run()