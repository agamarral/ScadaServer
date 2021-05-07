var zmq = require("zeromq");
var loglib = require('logger');
const process = require('process');
const ls = require("node-localstorage");

config_data = require('./config/config.json');


class Subscriber {
    constructor(context, endpoint, topics, pushendpoint, cacheid) {

        this.context = context;
        this.sock = new zmq.Subscriber();
        this.endpoint = endpoint;
        this.pushSocket = null;
        this.pushendpoint = '';

        if (pushendpoint !== 'undefined') {
            this.pushSocket = new zmq.Push();
            this.pushendpoint = pushendpoint;
        }


        this.logger = loglib.createLogger(config_data.common.logfile);
        this.logger.setLevel(config_data.common.loglevel);
        this.logger.format = function(level, date, message) {
                return date + " - SUBSCRIBER: " + message;
        };

        this.topics = topics;

        this.cache = new ls.LocalStorage(cacheid);
        this.connections = [];

    }
    trigger(topic, data) {
        
        if (this.connections.length > 0) {
            this.connections.map((socket) => socket.emit(topic, data));
        }
        
    }
 
    async init() {

        try {
            // subscribe to zmq publisher
            await this.sock.connect(this.endpoint);
            this.logger.debug("socket connected to "+ this.endpoint.toString());

            if (this.pushSocket) {
                await this.pushSocket.bind(this.pushendpoint);
                this.logger.debug("cmd forwarder connected to port " + this.pushendpoint);
            }


            // manage socketio subscriptions
            this.manage_connections();

           
        } catch (error) {
            this.logger.error(error);
        }
        var self = this;
        this.topics.forEach((topic) => {
            self.sock.subscribe(topic)
            self.logger.debug("subscribed to " + topic);

        });
        
        for await (const [topic, msg] of this.sock) {
            //this.logger.debug("received a message related to:", topic.toString("utf-8"), "containing message:", msg.toString("utf-8"));
            this.cache.setItem(topic.toString("utf-8"), msg.toString("utf-8"));
            this.trigger(topic.toString("utf-8"), msg.toString("utf-8"));
        }
    }
    exit() {
        this.logger.debug("Exit signal received");
        this.sock.close();
        
        if (this.pushSocket) {
            this.pushSocket.close();
        }
        this.cache._deleteLocation();
    }
}
module.exports = Subscriber;

