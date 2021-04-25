const zmq = require("zeromq");
const sublib = require('./subscriber.js');
var loglib = require('logger');


async function run() {
    const ctx = new zmq.Context();

    const logger = loglib.createLogger('mainsub.log');
    logger.setLevel('debug');

    logger.debug("create subscriber");
    const sub = new sublib.Subscriber(ctx, ['acqs', 'cmds']);
    
    await sub.init();
    
    process.on('SIGINT', function() {
        sub.exit();
    });
}

run()