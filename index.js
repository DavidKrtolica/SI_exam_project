import express from 'express';
import http from 'http';
import cors from 'cors';
import { getUsersInRoom, removeUser, addUser, markUserAsDisconnected, addUserToDatabase, getUser } from "./users.js";
import { Server } from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    perMessageDeflate: false,
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(express.static('public'));

app.use(express.json());

app.use(cors())

app.get('/', (req, res) => {
    res.sendFile('index.html');
})
 
app.post('/invite', (req, res) => {
    const userCreated = addUserToDatabase(req.body);
    console.log('user created = ', userCreated);
    if (!userCreated) {
        throw new Error('User already exists!');
    } else {
        const user = getUser(req.body.email);
        res.send({ created: true });
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
    }
})

io.on("connection", (socket) => {
    socket.on('joinRequest', ({ name, room }) => {
        const socketId = socket.id;
        const { error, user } = addUser(name, room, socketId);
        if (error) return socket.emit('error', error);

        socket.join(user.room);

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            markUserAsDisconnected(socket.id);
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    })
})

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
})