const zmq = require("zeromq");
const signalsub = require('./signalsubscriber.js');
var loglib = require('logger');
config_data = require('./config/config.json');


logger = loglib.createLogger(config_data.common.logfile);
logger.setLevel(config_data.common.loglevel);
logger.format = function(level, date, message) {
    return date + " - MAINSUB: " + message;
};

function init_cmds(subscriber) {

    cmdData = [];

    for (let i = 1; i< 21; i++) {
        onValue = Math.random() < 0.5;
        validity = true;
        
        cmdData.push( {
            id: 2*i-1,
            signal: 'switch'+i+'_on',
            value: onValue,
            isValid: validity
        });
        cmdData.push( {
            id: 2*i,
            signal: 'switch'+i+'_off',
            value: !onValue,
            isValid: validity
        });
    }
 
    subscriber.init_cmds(cmdData);
}

async function run() {
    const ctx = new zmq.Context();


    logger.debug("create subscriber");
    const sub = new signalsub.SignalSubscriber(ctx, config_data.signalpublisher.zmqendpoint, 
                                                    ['acqs', 'health'], 
                                                    config_data.cmdstub.zmqendpoint, 
                                                    config_data.signalsubscriber.ioport,
                                                    "signalCache");
    init_cmds(sub);

    await sub.init();
    
    process.on('SIGINT', function() {
        sub.exit();
    });
}

run()