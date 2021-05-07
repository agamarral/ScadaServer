var zmq = require("zeromq");
var loglib = require('logger');
const process = require('process');

config_data = require('./config/config.json');


//ctx = zmq.Context.instance()
class Publisher {
    constructor(context, endpoint, topics) {

        this.context = context;
        this.sock = new zmq.Publisher();
        this.endpoint = endpoint;

        this.logger = loglib.createLogger(config_data.common.logfile);
        this.logger.setLevel(config_data.common.loglevel);
        this.logger.format = function(level, date, message) {
                return date + " - PUBLISHER: " + message;
        };
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
            await this.sock.bind(this.endpoint);
            this.logger.debug("socket bound " + this.endpoint.toString());
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
