const zmq = require("zeromq");
//const proxylib = require('./proxy.js');
const publib = require('./publisher.js');
const loglib = require('logger');

config_data = require('./config/config.json');

const logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
        return date + " - SIGNALPUB: " + message;
};

let watchdog = true;

async function refresh_watchdog(publisher) {

    await publisher.send('health', JSON.stringify(watchdog));
}

async function publish_data(publisher) {

    //logger.debug("publish_data");
    
    acqData = [];


    for (let i = 0; i< 20; i++) {
        acqData.push( {
            id: i,
            signal: 'lamp'+i+'Status_on',
            value: Math.random() < 0.5,
            isValid: Math.random() < 0.5
        });
        acqData.push( {
            id: i+100,
            signal: 'analog'+i+'_meas',
            value: Math.random()*100,
            isValid: Math.random() < 0.5
        });
        acqData.push( {
            id: i+200,
            signal: 'digital'+i+'_meas',
            value: Math.trunc(Math.random() *10000),
            isValid: Math.random() < 0.5
        });

    }
    //console.log(acqData);
    await publisher.send('acqs', JSON.stringify(acqData));

}

async function run() {
    const ctx = new zmq.Context();

    logger.debug("create publisher");
    const pub = new publib.Publisher(ctx, config_data.signalpublisher.zmqendpoint, ['acqs', 'health']);
    
    pub.init().then((result) => {
       
        setInterval(publish_data, config_data.signalpublisher.refreshcycle, pub);
        setInterval(refresh_watchdog, config_data.common.healthcycle, pub);
         
    });
}

run()