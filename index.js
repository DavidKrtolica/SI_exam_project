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

// get my wishlists
app.post('/wishlists', async (req, res) => {
    try {
        const accessToken = req.body.accessToken;
        const parsedToken = parseJwt(accessToken);
        const userEmail = parsedToken.email;
        const result = await getWishlistsByUserEmail(userEmail);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post('/create-wishlist', async (req, res) => {
    try {
        const accessToken = req.body.accessToken;
        const parsedToken = parseJwt(accessToken);
        const userEmail = parsedToken.email;
        const wishlistName = req.body.wishlistName;
        const lastInsertedId = await createNewWishlist(wishlistName, userEmail);
        const code = uuidv4();
        // adds owner of wishlist to wishlists_have_users table
        await addUserToWishlist(lastInsertedId, code, userEmail, true);
        res.status(200).send(`${lastInsertedId}`);
    } catch (error) {
        res.status(500).send(error);
    }
})

// invite a friend to join a wishlist
app.post('/invite', async (req, res) => {
    try {
        const accessToken = req.body.accessToken;
        const parsedToken = parseJwt(accessToken);
        const userEmail = parsedToken.email;

        const wishlistId = req.body.wishlistId;
        const wishlistName = req.body.wishlistName;
        const emailTo = req.body.emailTo;

        // checks if passed email has valid pattern
        const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        if (!emailTo?.match(validEmailRegex)) {
            socket.emit('inviteFailed', 'Invalid email');
            return;
        }

        const code = uuidv4();

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
        res.status(200).send('Success');
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post('/add-product-to-wishlist', async (req, res) => {
    try {
        const wishlistId = req.body.wishlistId;
        const productId = req.body.productId;
        const size = req.body.size;
        const color = req.body.color;
        await addProductToWishlist(wishlistId, productId, size, color);
        res.status(200).send('Success');
    } catch (error) {
        res.status(500).send(error);
    }
})

io.on("connection", async (socket) => {

    let userEmail, wishlistIds, allUsers, onlineUsers;

    try {
        const accessToken = socket.handshake.headers['authorization'];
        const parsedToken = parseJwt(accessToken);
        userEmail = parsedToken.email;
    } catch (error) {
        socket.emit('authFailed', error);
    }

    // gets the wishlist ids that the user created/is invited
    wishlistIds = await getWishlistIdsByUserEmail(userEmail);
    if (wishlistIds?.length > 0) {
        socket.userEmail = userEmail;
        socket.profilePictureUrl = `https://yggrasil.blob.core.windows.net/profile-pictures/${userEmail}.png`;

        const promises = wishlistIds.map(async ({ wishlist_id }) => {
            socket.join(wishlist_id);
            allUsers = await getUsersByWishlist(wishlist_id);
            return { [wishlist_id]: allUsers };
        });
        allUsers = await Promise.all(promises);

        const sockets = await io.in(wishlistIds.map(e => e.wishlist_id)).fetchSockets();
        onlineUsers = sockets.map(socket => socket?.userEmail);

        let friends = {};
        allUsers.map((users) => {
            const id = Object.keys(users)[0];
            const all = users[Object.keys(users)[0]];
            const online = all.filter(e => onlineUsers.indexOf(e.userEmail) !== -1);
            const offline = all.filter(e => onlineUsers.indexOf(e.userEmail) === -1 && !e.code);
            const notRegistered = all.filter(e => onlineUsers.indexOf(e.userEmail) === -1 && e.code);
            friends[id] = {
                online,
                offline,
                notRegistered,
            }
        })

        socket.emit('friends', { friends });
        socket.to(wishlistIds.map(e => e.wishlist_id)).emit('friends', { friends });
    }

    socket.on('disconnect', async () => {
        const promises = wishlistIds.map(async ({ wishlist_id }) => {
            socket.join(wishlist_id);
            allUsers = await getUsersByWishlist(wishlist_id);
            return { [wishlist_id]: allUsers };
        });

        allUsers = await Promise.all(promises);

        const sockets = await io.in(wishlistIds.map(e => e.wishlist_id)).fetchSockets();
        onlineUsers = sockets.map(socket => socket?.userEmail);

        let friends = {};

        allUsers.map((users) => {
            const id = Object.keys(users)[0];
            const all = users[Object.keys(users)[0]];
            const online = all.filter(e => onlineUsers.indexOf(e.userEmail) !== -1);
            const offline = all.filter(e => onlineUsers.indexOf(e.userEmail) === -1 && e.code === null);
            const notRegistered = all.filter(e => onlineUsers.indexOf(e.userEmail) === -1 && e.code !== null);
            friends[id] = {
                online,
                offline,
                notRegistered,
            }
        })

        socket.emit('friends', { friends });
        socket.to(wishlistIds.map(e => e.wishlist_id)).emit('friends', { friends });
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

const createNewWishlist = async (wishlistName, userEmail) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'INSERT INTO wishlists SET ?', {
            name: wishlistName,
            user_email: userEmail,
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

const addProductToWishlist = async (wishlistId, productId, size, color) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'INSERT INTO wishlists_have_products VALUES (?, ?, ?, ?)', [wishlistId, productId, size, color],
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

//returns an array of wishlist ids, created by (user email), and wishlist name
const getWishlistsByUserEmail = async (userEmail) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'SELECT w.id AS wishlist_id, w.name AS wishlist_name, w.user_email AS created_by,' +
            ' w.created_at AS created_at FROM wishlists w JOIN wishlists_have_users wu ON w.id = wu.wishlist_id' +
            ' where wu.user_email = ?', [userEmail],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}

const getUsersByWishlist = async (wishlistId) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'SELECT wu.code, wu.user_email AS userEmail FROM wishlists_have_users wu WHERE wishlist_id = ?', [wishlistId],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}