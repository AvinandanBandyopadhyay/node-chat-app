const path = require('path');
const http = require('http');
const express = require('express');
const Filter = require('bad-words');
const socketio = require('socket.io');
const {generateMessage, generateLocMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/user')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.port || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on( 'connection', (socket) => {
    console.log("Wbsocket up!!")
    
    socket.on('join', ({username, room}, callback) => {
        const {error, user } = addUser({id:socket.id, username, room})
        if(error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('fromServer', generateMessage('Admin', 'Welcome'));
        socket.broadcast.to(user.room).emit('fromServer', generateMessage('Admin', `${user.username} has joined!`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('clientMessage', (msg, callback) => {
        console.log('From client ', msg);
        const filter = new Filter();
        if ( filter.isProfane(msg)) {
            return callback('Profanity is not allowed!')
        }
        const user = getUser(socket.id)
        if(user) {
            io.to(user.room).emit('fromServer', generateMessage(user.username, msg));
            callback()
        }
    });
    socket.on('sendLocation', (lat, long, callback) => {
        const user = getUser(socket.id)
        if(user) {
                io.to(user.room).emit('locationMessage', generateLocMessage(user.username, "https://google.com/maps?="+long+","+lat));
            callback();
        }
    })
    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('fromServer', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
});

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}`);
});