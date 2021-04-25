const zmq = require("zeromq");
const proxylib = require('./proxy.js');
const publib = require('./publisher.js');
var loglib = require('logger');


async function run() {
    const ctx = new zmq.Context();

    const logger = loglib.createLogger('mainpub.log');
    logger.setLevel('debug');

    logger.debug("create publisher");
    const pub = new publib.Publisher(ctx, ['acqs', 'cmds']);
    const proxy = new proxylib.Proxy(ctx);
    
    pub.init().then((result) => {

        acqData = [];
        cmdData = [];

        while(true) {

            for (let i = 0; i< 20; i++) {
                acqData.push( {
                    id: i,
                    signal: 'lamp'+i+'Status_on',
                    value: Math.random() < 0.5,
                    isValid: Math.random() < 0.5
                });
                acqData.push( {
                    id: i,
                    signal: 'analog'+i+'_meas',
                    value: Math.random()*100,
                    isValid: Math.random() < 0.5
                });
                acqData.push( {
                    id: i,
                    signal: 'digital'+i+'_meas',
                    value: Math.trunc(Math.random() *10000),
                    isValid: Math.random() < 0.5
                });
                cmdData.push( {
                    id: i,
                    signal: 'switch'+i+'_on',
                    value: Math.random() < 0.5,
                    isValid: Math.random() < 0.5
                });
            }
            setInterval(pub.send.bind(pub), 20000, 'acqs', JSON.stringify(acqData));
            setInterval(pub.send.bind(pub), 20000, 'cmds', JSON.stringify(cmdData));
        } 
    });
}

run()