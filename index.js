import express from 'express';
import http from 'http';
import mysql from 'mysql';
import { ServiceBusClient } from "@azure/service-bus";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    perMessageDeflate: false,
    pingInterval: 5000,
    pingTimeout: 2500,
    cors: {
        origin: '*', // here we can add frontend app IP
        methods: ['GET', 'POST'],
        allowedHeaders: ["Authorization"],
        credentials: true
    },
});

app.use(express.json());

app.use(cors());

// health checker
app.get('/', (req, res) => {
    res.status(200).send('OK');
})

io.on("connection", async (socket) => {

    let userEmail, userId, wishlistIds, onlineUsers;

    try {
        const accessToken = socket.handshake.headers['authorization'];
        const parsedToken = parseJwt(accessToken);
        userId = parsedToken.user_id;
        userEmail = parsedToken.email;
    } catch (error) {
        socket.emit('authFailed', error);
    }

    // gets the wishlist ids that the user created/is invited
    wishlistIds = await getWishlistIdsByUserEmail(userEmail);
    if (wishlistIds?.length > 0) {
        wishlistIds.forEach(async (wishlist) => {
            socket.userEmail = userEmail;
            socket.join(wishlist.wishlist_id);
            const sockets = await io.in(wishlist.wishlist_id).fetchSockets();
            onlineUsers = sockets.map(socket => socket?.userEmail);
            const onlineUsersUniqueValues = [...new Set(onlineUsers)];
            socket.emit('onlineUsers', { onlineUsersUniqueValues });
            socket.to(wishlist.wishlist_id).emit('onlineUsers', { onlineUsersUniqueValues });
        });
    }

    socket.on('invite', async ({ wishlistId, wishlistName, emailTo }) => {

        // checks if the passed wishlist id is included in the wishlists of this user
        if (wishlistIds.filter(wishlist => wishlist.wishlist_id === wishlistId).length === 0) {
            socket.emit('inviteFailed', 'Invalid wishlist id');
            return;
        }

        // checks if passed email has valid pattern
        const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!emailTo?.match(validEmailRegex)) {
            socket.emit('inviteFailed', 'Invalid email');
            return;
        }

        const code = uuidv4();

        try {
            await addUserToWishlist(wishlistId, code, emailTo, false);
            const serviceBusMessage = {
                body: {
                    emailTo,
                    invitedBy: userEmail,
                    wishlistId,
                    code,
                    wishlistName,
                }
            };
            await sendMessageToQueue(serviceBusMessage);
            socket.emit('inviteSucceeded');
        } catch (error) {
            socket.emit('inviteFailed', error);
        }
    })

    socket.on('createWishlist', async ({ wishlistName }) => {
        try {
            const lastInsertedId = await createNewWishlist(wishlistName, userId);
            const code = uuidv4();
            // adds owner of wishlist to wishlists_have_users table
            await addUserToWishlist(lastInsertedId, code, userEmail, true);
            socket.emit('createWishlistSucceeded', lastInsertedId);
        } catch (error) {
            socket.emit('createWishlistFailed', error);
        }
    })

    socket.on('addProductToWishlist', async ({ wishlistId, productId }) => {
        try {
            // checks if the passed wishlist id is included in the wishlists of this user
            if (wishlistIds.filter(wishlist => wishlist.wishlist_id === wishlistId).length === 0) {
                socket.emit('addProductFailed', 'Invalid wishlist id');
                return;
            }
            await addProductToWishlist(wishlistId, productId);
            socket.emit('addProductSucceeded');
        } catch (error) {
            socket.emit('addProductFailed', error);
        }
    })

    socket.on('disconnect', async () => {
        wishlistIds.forEach(async (wishlist) => {
            const sockets = await io.in(wishlist.wishlist_id).fetchSockets();
            onlineUsers = sockets.map(socket => socket?.userEmail);
            const onlineUsersUniqueValues = [...new Set(onlineUsers)];
            socket.emit('onlineUsers', { onlineUsersUniqueValues });
            socket.to(wishlist.wishlist_id).emit('onlineUsers', { onlineUsersUniqueValues });
        });
    })
})

const PORT = process.env.PORT || 3005;

server.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
})


// utils
const parseJwt = (token) => {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}


// inserts message to Azure Service Bus queue
const connectionString = process.env.QUEUE_CONN_STRING;
const queueName = process.env.QUEUE_NAME;
const sendMessageToQueue = async (message) => {
    const sbClient = new ServiceBusClient(connectionString);
    const sender = sbClient.createSender(queueName);
    try {
        await sender.sendMessages(message);
        await sender.close();
    } finally {
        await sbClient.close();
    }
}

// database methods
const MySQLConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: true,
    }
});

const createNewWishlist = async (wishlistName, userId) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'INSERT INTO wishlists SET ?', {
            name: wishlistName,
            user_id: userId,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        },
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results.insertId);
            });
    });
}

const addProductToWishlist = async (wishlistId, productId) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'INSERT INTO wishlists_have_products VALUES (?, ?)', [wishlistId, productId],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}

const addUserToWishlist = async (wishlistId, code, userEmail) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'INSERT INTO wishlists_have_users VALUES (?, ?, ?, ?)', [wishlistId, code, userEmail, new Date().toISOString().slice(0, 19).replace('T', ' ')],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}

const getWishlistIdsByUserEmail = async (userEmail) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'SELECT wishlist_id FROM wishlists_have_users WHERE user_email = ?', [userEmail],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}