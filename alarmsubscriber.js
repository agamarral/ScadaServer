const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

const Subscriber =  require("./subscriber");

class AlarmSubscriber extends Subscriber {
    constructor(context, endpoint, topics, pushendpoint, ioport, cacheid) {
        super(context, endpoint, topics, pushendpoint, cacheid);

        http.listen(ioport, () => {
            console.log('Listening on port '+ ioport.toString());
        });
    }
    init_alarms(alarms) {
        this.cache.setItem("alarms", JSON.stringify(alarms));
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
            self.logger.debug("on connection: number of connections " + self.connections.length);

            // subscribes the new subscriber to all topics
            self.subscribe_2_all_alarms(socket);
            self.subscribe_2_update_alarm(socket);

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

    subscribe_2_all_alarms(socket) {
        var self = this;
        // get all alarms 
        socket.on("getAllAlarms",() => {
            console.log("getAllAlarms received");
   
            self.trigger("alarms", self.cache.getItem("alarms"));

        });
    } 
    subscribe_2_update_alarm(socket) {
        var self = this;
        // get single alarm
        socket.on("updateAlarm", alarm => {
            self.logger.debug("updateAlarm received for " + alarm.description);
            
            let alarms = JSON.parse(self.cache.getItem("alarms")).filter((item) => item.id !== alarm.id);

            alarms.push(alarm);
            self.trigger("alarms", JSON.stringify(alarms));

            self.cache.setItem("alarms", JSON.stringify(alarms));
            
        });        
    } 
}
module.exports = {
    AlarmSubscriber: AlarmSubscriber
}

