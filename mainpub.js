const zmq = require("zeromq");
const proxylib = require('./proxy.js');
const publib = require('./publisher.js');
const loglib = require('logger');

const logger = loglib.createLogger('mainpub.log');
logger.setLevel('debug');

async function publish_data(publisher) {

    console.log("publish_data");
    
    acqData = [];
    cmdData = [];

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
        onValue = Math.random() < 0.5;
        validity = Math.random() < 0.5;
        cmdData.push( {
            id: i,
            signal: 'switch'+i+'_on',
            value: onValue,
            isValid: validity
        });
        cmdData.push( {
            id: i,
            signal: 'switch'+i+'_off',
            value: !onValue,
            isValid: validity
        });
    }
    //console.log(acqData);
    await publisher.send('acqs', JSON.stringify(acqData));
    await publisher.send('cmds', JSON.stringify(cmdData));

}
async function run() {
    const ctx = new zmq.Context();

    logger.debug("create publisher");
    const pub = new publib.Publisher(ctx, ['acqs', 'cmds']);
    const proxy = new proxylib.Proxy(ctx);
    
    pub.init().then((result) => {
       
        //setInterval(pub.send.bind(pub), 20000, 'acqs', JSON.stringify(acqData));
        setInterval(publish_data, 1000, pub);
         
    });
}

run()