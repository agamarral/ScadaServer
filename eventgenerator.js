const zmq = require("zeromq");
const publib = require('./publisher.js');
const loglib = require('logger');

config_data = require('./config/config.json');

const logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
        return date + " - EVENTPUB: " + message;
};



async function refresh_watchdog(publisher) {
    let watchdog = true;
    await publisher.send('health', JSON.stringify(watchdog));
}

async function publish_data(publisher) {

    //logger.debug("publish_data");
    
    eventData = [];

    for (let i = 0; i< 200; i++) {
        eventData.push( {
            id: i,
            type: 'DEBUG',
            timestamp: Date.now(),
            source: 'EVENTGENERATOR',
            description: "this is my event number " + i.toString()
        });
    }

    await publisher.send('events', JSON.stringify(eventData));
}

async function run() {
    const ctx = new zmq.Context();

    logger.debug("create publisher");
    const pub = new publib.Publisher(ctx, config_data.eventpublisher.zmqendpoint, ['events', 'health']);

    
    pub.init().then((result) => {
       
        setInterval(refresh_watchdog, config_data.common.healthcycle, pub);
        setInterval(publish_data, config_data.eventpublisher.refreshcycle, pub);
         
    });
}

run()