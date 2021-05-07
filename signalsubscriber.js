const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

const Subscriber =  require("./subscriber");

class SignalSubscriber extends Subscriber {
    constructor(context, endpoint, topics, pushendpoint, ioport, cacheid) {
        super(context, endpoint, topics, pushendpoint, cacheid);
        
        http.listen(ioport, () => {
            console.log('Listening on port '+ ioport.toString());
        });
    }
    init_cmds(cmds) {
        this.cache.setItem("cmds", JSON.stringify(cmds));
    }
    manage_connections() {
        var self = this;
        self.logger.debug('manage connections');
        io.on('connection', function(socket) {
            self.logger.debug('a user connected');
            self.connections.push(socket);


            self.logger.debug(`
                ------------New connection---------------------
                
                Connection ID:   ${socket.id}
                IP:              ${socket.handshake.address}
                Time:            ${socket.handshake.time}
                ----------------------------------------------`);
            self.logger.debug("on connection: number of connections " + self.connections.length);

            // subscribes the new subscriber to all topics
            self.subscribe_2_single_acq(socket);
            self.subscribe_2_all_acqs(socket);
            self.subscribe_2_single_cmd(socket);
            self.subscribe_2_all_cmds(socket);
            self.subscribe_2_update_cmd(socket);

            socket.on('disconnect', () => {
                self.connections = self.connections.filter((conn) => conn.id != socket.id);
                self.logger.debug(`
                    ------------Disconnection---------------------
                    
                    Connection ID:   ${socket.id}
                    IP:              ${socket.handshake.address}
                    Time:            ${socket.handshake.time}
                    ----------------------------------------------`);
                    self.logger.debug("on disconnection: number of connections " + self.connections.length);
            });

        });
    }
    subscribe_2_single_acq(socket) {
        var self = this;

        // get single acq
        this.logger.debug("subscribe_2_single_acq");
        socket.on("getAcq", acqId => {
            self.logger.debug("getAcq received for " + acqId);
 
            const acq =  self.cache.getItem("acqs").filter((item) => item.id == acqId);
            if(acq.length == 1) {
                self.trigger("acq_" + acqId, acq[0]);
            }
            
            else {
                self.trigger("error", "acq " + acqId + " is not registered");
            }
        });
    }

    subscribe_2_all_acqs(socket) {
        var self = this;
        this.logger.debug("subscribe_2_all_acqs");
        // get all acqs 
        socket.on("getAllAcqs",() => {
            self.logger.debug("getAllAcqs received");
   
            self.trigger("acqs", self.cache.getItem("acqs"));

        });
    }

    subscribe_2_single_cmd(socket) {
        var self = this;
        this.logger.debug("subscribe_2_single_cmd");
        // get single cmd
        socket.on("getCmd", cmdId => {
            self.logger.debug("getCmd received for " + cmdId);

            const cmd =  self.cache.getItem("cmds").filter((item) => item.id == cmdId);
            if (cmd.length == 1) {
                self.trigger("cmd_" + cmdId, cmd[0]);
            } else {
                self.trigger("error", "cmd " + cmdId + " is not registered");
            }
            
        });
    }
    subscribe_2_all_cmds(socket) {
        var self = this;
        this.logger.debug("subscribe_2_all_cmds");
        // get all cmds 
        socket.on("getAllCmds",() => {
            self.logger.debug("getAllCmds received");
   
            self.trigger("cmds", self.cache.getItem("cmds"));

        });
    } 
    subscribe_2_update_cmd(socket) {
        var self = this;
        // get single cmd
        self.logger.debug("subscribe_2_update_cmd");
        socket.on("updateCmd", cmd => {
            self.logger.debug("updateCmd received for " + cmd.signal);

            if (self.pushSocket) {
                self.pushSocket.send(cmd.signal + " with value " + cmd.value.toString() + " received");
            }
            
            let cmds = JSON.parse(self.cache.getItem("cmds")).filter((item) => item.id !== cmd.id);

            cmds.push(cmd);
            self.trigger("cmds", JSON.stringify(cmds));

            self.cache.setItem("cmds", JSON.stringify(cmds));
            
        });        
    }
}
module.exports = {
    SignalSubscriber: SignalSubscriber
}

