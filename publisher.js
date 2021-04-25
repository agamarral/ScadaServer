var zmq = require("zeromq");
var loglib = require('logger');
const process = require('process');

config_data = require('./config/config.zmq.json');


//ctx = zmq.Context.instance()
class Publisher {
    constructor(context, topics) {

        this.context = context;
        this.sock = new zmq.Publisher();

        this.logger = loglib.createLogger('publisher.log');
        this.logger.setLevel('debug');
/*        try {
            this.sock.connect(config_data.publisher.endpoint);
            this.logger.debug("socket connected " + config_data.publisher.endpoint);
        } catch (error) {
            this.logger.error(error);
        }*/

        this.topics = topics;

    }
    async init() {

        try {
            await this.sock.bind("tcp://127.0.0.1:5000");
            this.logger.debug("socket bound " + config_data.publisher.endpoint);
        } catch (error) {
            this.logger.error(error);
        }

        

        process.on('SIGINT', function() {
            this._exit();
        });
        
    }
    async send(topic, message) {
        if (this.topics.find(item => (item == topic)) === undefined ) {
            this.logger.error('topic '+ topic + ' is not present in accepted items');
        }
        
        this.sock.send([topic, message]);
        //this.logger.debug("Message sent "+ [topic, timestamp, message]);
        

    }
    _exit() {
        this.sock.close();
    }
}
module.exports = {
    Publisher: Publisher
}
