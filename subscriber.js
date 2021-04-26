var zmq = require("zeromq");
var loglib = require('logger');
const process = require('process');
const ls = require("node-localstorage");
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

http.listen(4000, () => {
  console.log('Listening on port 4000');
});

config_data = require('./config/config.zmq.json');



class Subscriber {
    constructor(context, topics) {

        this.context = context;
        this.sock = new zmq.Subscriber();

        this.logger = loglib.createLogger('subscriber.log');
        this.logger.setLevel('debug');

        this.topics = topics;

        this.cache = new ls.LocalStorage('signalCache');
        this.connections = [];

    }
    //Create a function that will get triggered by ZeroMQ. Data is the binary stream that is recieved by ZeroMQ.
    trigger(topic, data) {
        //Throw away the Topic of your received String by cutting off the first 4 bytes ("rand") 
        //data = data.toString().slice(4);
        //Parse the remaining string and send the object to your WebUi via SocketIO
/*        if (topic ==="acqs") {
            console.log("sending "+data);
        }*/
        
        console.log("sending " + topic);
        this.connections.map((socket) => socket.emit(topic, data));
        //io.emit(topic, JSON.stringify(data));
        
    }
    manage_connections() {
        var self = this;

        io.on('connection', function(socket) {
            self.logger.debug('a user connected');
            self.connections.push(socket);


            self.logger.debug(`
                ------------New connection---------------------
                
                Connection ID:   ${socket.id}
                IP:              ${socket.handshake.address}
                Time:            ${socket.handshake.time}
                ----------------------------------------------`);
            console.log("on connection: number of connections " + self.connections.length);

            socket.on('disconnect', () => {
                self.connections = self.connections.filter((conn) => conn.id != socket.id);
                self.logger.debug(`
                    ------------Disconnection---------------------
                    
                    Connection ID:   ${socket.id}
                    IP:              ${socket.handshake.address}
                    Time:            ${socket.handshake.time}
                    ----------------------------------------------`);
                    console.log("on disconnection: number of connections " + self.connections.length);
            });

        });
    }
    subscribe_2_single_acq() {
        var self = this;
        // get single acq
        io.on("getAcq", acqId => {
            console.log("getAcq received for " + acqId);
 
            const acq =  self.cache.getItem("acqs").filter((item) => item.id == acqId);
            if(acq.length == 1) {
                self.trigger("acq_" + acqId, acq[0]);
            }
            
            else {
                self.trigger("error", "acq " + acqId + " is not registered");
            }
        });
    }

    subscribe_2_all_acqs() {
        var self = this;
        // get all acqs 
        io.on("getAllAcqs",() => {
            console.log("getAllAcqs received");
   
            self.trigger("acqs", self.cache.getItem("acqs"));

        });
    }

    subscribe_2_single_cmd() {
        var self = this;
        // get single cmd
        io.on("getCmd", cmdId => {
            console.log("getCmd received for " + cmdId);

            const cmd =  self.cache.getItem("cmds").filter((item) => item.id == cmdId);
            if (cmd.length == 1) {
                self.trigger("cmd_" + cmdId, cmd[0]);
            } else {
                self.trigger("error", "cmd " + cmdId + " is not registered");
            }
            
        });
    }
    subscribe_2_all_cmds() {
        var self = this;
        // get all cmds 
        io.on("getAllCmds",() => {
            console.log("getAllCmds received");
   
            self.trigger("cmds", self.cache.getItem("cmds"));

        });
    } 
    subscribe_2_update_cmd() {
        var self = this;
        // get single cmd
        io.on("updateCmd", cmd => {
            console.log("updateCmd received for " + cmd.signal);

            const cmds =  self.cache.getItem("cmds").filter((item) => item.id == cmd.id);
            cmds.push(cmd);
            self.trigger("cmds", cmds);
            self.cache.setItem("cmds", cmds);
            
        });        
    } 
    async init() {

        try {
            // subscribe to zmq publisher
            await this.sock.connect("tcp://127.0.0.1:5000");
            this.logger.debug("socket connected to tcp://127.0.0.1:5000");

            // manage socketio subscriptions
            this.manage_connections();
            this.subscribe_2_single_acq();
            this.subscribe_2_all_acqs();
            this.subscribe_2_single_cmd();
            this.subscribe_2_all_cmds();
            this.subscribe_2_update_cmd();
           
        } catch (error) {
            this.logger.error(error);
        }
        var self = this;
        this.topics.forEach((topic) => {
            self.sock.subscribe(topic)
            this.logger.debug("subscribed to " + topic);

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

        this.cache._deleteLocation();
    }
}
module.exports = {
    Subscriber: Subscriber
}

