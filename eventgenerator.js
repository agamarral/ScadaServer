const zmq = require("zeromq");
const publib = require('./publisher.js');
const loglib = require('logger');

config_data = require('./config/config.json');

const logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
        return date + " - EVENTPUB: " + message;
};

let watchdog = false;

async function refresh_watchdog(publisher) {
    watchdog = !watchdog;
    await publisher.send('health', JSON.stringify(watchdog));
}

async function run() {
    const ctx = new zmq.Context();

    logger.debug("create publisher");
    const pub = new publib.Publisher(ctx, config_data.eventpublisher.zmqendpoint, ['events', 'health']);

    
    pub.init().then((result) => {
       
        setInterval(refresh_watchdog, config_data.common.healthcycle, pub);
         
    });
}

run()