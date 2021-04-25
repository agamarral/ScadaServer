const zmq = require("zeromq");
const ls = require("node-localstorage");
const loglib = require('logger');
const process = require('process');

config_data = require('./config/config.zmq.json');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class Proxy {
    constructor(ctx) {

        this.backend = new zmq.XSubscriber({context: ctx});
        this.frontend = new zmq.XPublisher({context: ctx});
        this.proxy = undefined;

        this.cache = new ls.LocalStorage('publisherCache');
        this.logger = loglib.createLogger('proxy.log');
        this.logger.setLevel('debug');

    }

    async init() {
        this.logger.debug("frontend " + config_data.subscriber.endpoint);
        this.logger.debug("backend " + config_data.publisher.endpoint);
  
        this.frontend.bind(config_data.subscriber.endpoint);
        this.backend.bind(config_data.publisher.endpoint);

 
        this.proxy = new zmq.Proxy(this.backend, this.frontend);

        process.on('SIGINT', function() {
            this._exit();
        });
    }


    async run() {
        let self = this;

        setTimeout(() => self.proxy.run(), 2000);       
    }

    _exit() {
        this.logger.debug("Exit signal received");
        this.frontend.close();
        this.backend.close();
        this.cache._deleteLocation();
    }
}
module.exports = {
    Proxy: Proxy
}