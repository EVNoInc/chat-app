const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');

const path = require('path');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { getUser, getUsersInRoom, addUser, removeUser } = require('./utils/users');
const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);



const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {

    // User Joins Room
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        console.log('[ ]', user.username, 'connected');

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage(`Welcome ${user.username}!`));
        socket.broadcast.to(user.room).emit('message', generateMessage("System", `Everybody welcome ${user.username} to the ${user.room} chat room`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        callback();

    })

    // Send Message
    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter();

        const user = getUser(socket.id);

        if (filter.isProfane(message)) {
            return callback('Wash your damn mouf');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback('over and out');
    });

    // Send Location
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
        return callback();
    })

    //  User Disconnects
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage("System", `${user.username} has left ${user.room}`));
            console.log(`[X] ${user.username} disconnected `);

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }

    });
});

server.listen(port, () => {
    console.log('chat server up - port:', port);
});
