const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

const Subscriber =  require("./subscriber");

class EventSubscriber extends Subscriber {
    constructor(context, endpoint, topics, pushendpoint, ioport, cacheid) {
        super(context, endpoint, topics, pushendpoint, cacheid);

        http.listen(ioport, () => {
            console.log('Listening on port '+ ioport.toString());
        });
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
            self.subscribe_2_all_events(socket);
            self.subscribe_2_add_event(socket);

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

    subscribe_2_all_events(socket) {
        var self = this;
        // get all events 
        socket.on("getAllEvents",() => {
            console.log("getAllEvents received");
   
            self.trigger("events", self.cache.getItem("events"));

        });
    } 
    subscribe_2_add_event(socket) {
        var self = this;
        // get single cmd
        socket.on("addEvent", event => {
            self.logger.debug("addEvent received for " + event.description);
            
            let events = JSON.parse(self.cache.getItem("events")).filter((item) => item.id !== event.id);

            events.push(event);
            self.trigger("events", JSON.stringify(events));

            self.cache.setItem("events", JSON.stringify(events));
            
        });        
    } 
}
module.exports = {
    EventSubscriber: EventSubscriber
}

