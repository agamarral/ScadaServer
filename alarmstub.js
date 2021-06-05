const zmq = require("zeromq");
var loglib = require('logger');
config_data = require('./config/config.json');

logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
    return date + " - ALARMSTUB: " + message;
};

async function run() {
    const ctx = new zmq.Context();

    logger.debug("create worker");

    const sock = new zmq.Pull();

    sock.connect(config_data.alarmstub.zmqendpoint);
    logger.debug("Worker connected to port " + config_data.alarmstub.zmqendpoint.toString());

    for await (const [msg] of sock) {
        logger.info("alarm received", msg.toString())
    }
    process.on('SIGINT', function() {
        sub.exit();
    });
}

run()