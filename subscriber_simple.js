const process = require('process');
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

class Subscriber {

    constructor() {

        this.connections = [];
        this.acqData = [];
        for (let i = 0; i < 50; i++) {
            this.acqData.push({
                id: i,
                signal: 'lamp' + i + 'Status_on',
                value: true,
                isValid: true
            });
        }

    }
    //Create a function that will get triggered by ZeroMQ. Data is the binary stream that is recieved by ZeroMQ.
    trigger(topic, data) {
        //Throw away the Topic of your received String by cutting off the first 4 bytes ("rand") 
        //data = data.toString().slice(4);
        //Parse the remaining string and send the object to your WebUi via SocketIO
        console.log("sending " + topic + " : " + JSON.stringify(data));
        this.connections.map((socket) => socket.emit(topic, JSON.stringify(data)));
        //io.emit(topic, JSON.stringify(data));

    }

    async init() {

        try {
            var self = this;
            io.on('connection', function (socket) {
                console.log('a user connected');
                self.connections.push(socket);

                self.trigger("acqs", self.acqData);
                console.log(`
                    ------------New connection---------------------
                    
                    Connection ID:   ${socket.id}
                    IP:              ${socket.handshake.address}
                    Time:            ${socket.handshake.time}
                    ----------------------------------------------`);
                console.log("on connection: number of connections " + self.connections.length);

                socket.on('disconnect', () => {
                    self.connections = self.connections.filter((conn) => conn.id != socket.id);
                    console.log(`
                        ------------Disconnection---------------------
                        
                        Connection ID:   ${socket.id}
                        IP:              ${socket.handshake.address}
                        Time:            ${socket.handshake.time}
                        ----------------------------------------------`);
                    console.log("on disconnection: number of connections " + self.connections.length);
                });

            });
            // get single acq
            io.on("getAcq", acqId => {
                console.log("getAcq received for " + acqId);
            });
            // get all acqs 
            io.on("getAllAcqs", () => {
                console.log("getAllAcqs received");
            });
        } catch (error) {
            console.log(error);
        }

    }
}
async function run() {

    const sub = new Subscriber();

    await sub.init();

}

run()