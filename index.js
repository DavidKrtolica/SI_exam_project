import express from 'express';
import http from 'http';
import mysql from 'mysql';
import { ServiceBusClient } from "@azure/service-bus";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc'; 

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "REST API",
        }
    },
    apis: ['./index.js']
}

const swaggerSpec = swaggerJsDoc(swaggerOptions);

const swaggerDocs = (app, port) => {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    app.get("docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    }) 
}

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

/**
 * @openapi
 * /healthcheck:
 *  get:
 *   tags:
 *   - Healthcheck
 *   description: Responds if the app is up and running
 *   responses: 
 *    200:
 *     description: App is up and running
 */
app.get('/healthcheck', (req, res) => {
    res.status(200).send('OK');
})

/**
 * @openapi
 * /wishlists:
 *  post:
 *   tags:
 *   - Wishlists
 *   summary: Get wishlists of a user
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       required:
 *        - accessToken
 *       properties:
 *        accessToken:
 *         type: string
 *   responses:
 *    200:
 *     description: Success
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/GetWishlistsResponse'
 *    500: 
 *     description: Error
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorResponse'
 * components:
 *  schemas:  
 *   GetWishlistsResponse:
 *    type: array
 *    items:
 *     type: object
 *     properties:
 *      wishlist_id:
 *       type: number
 *      wishlist_name:
 *       type: string
 *      created_by:
 *       type: string
 *      created_at:
 *       type: string
 *   ErrorResponse:
 *    type: object  
 *    properties:
 *     code:
 *      type: string
 */
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

/**
 * @openapi
 * /create-wishlist:
 *  post:
 *   tags:
 *   - Wishlists
 *   summary: Create a new wishlist
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/CreateWishlistInput'
 *   responses:
 *    200:
 *     description: Success
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/CreateWishlistResponse'
 *    500: 
 *     description: Error
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorResponse'
 * components:
 *  schemas:  
 *   CreateWishlistInput:
 *    type: object
 *    required:
 *     - wishlistName
 *     - accessToken  
 *    properties:
 *     wishlistName:
 *      type: string
 *     accessToken: 
 *      type: string  
 *   CreateWishlistResponse:
 *    type: object  
 *    properties:
 *     lastInsertedId:
 *      type: number
 */
app.post('/create-wishlist', async (req, res) => {
    try {
        const accessToken = req.body.accessToken;
        const parsedToken = parseJwt(accessToken);
        const userEmail = parsedToken.email;
        const wishlistName = req.body.wishlistName;
        const lastInsertedId = await createNewWishlist(wishlistName, userEmail);
        // adds owner of wishlist to wishlists_have_users table
        await addUserToWishlist(lastInsertedId, null, userEmail, true);
        res.status(200).send(`${lastInsertedId}`);
    } catch (error) {
        res.status(500).send(error);
    }
})

/**
 * @openapi
 * /invite:
 *  post:
 *   tags:
 *   - Wishlists
 *   summary: Invite a friend to join a wishlist
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/InviteInput'
 *   responses:
 *    200:
 *     description: Success
 *     content:
 *      text/plain:
 *       schema:
 *        type: string
 *        example: 'Success'
 *    500: 
 *     description: Error
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorResponse'
 * components:
 *  schemas:  
 *   InviteInput:
 *    type: object
 *    required:
 *     - wishlistId
 *     - wishlistName
 *     - accessToken
 *     - emailTo  
 *    properties:
 *     wishlistName:
 *      type: string
 *     accessToken: 
 *      type: string
 *     wishlistId:
 *      type: number
 *     emailTo: 
 *      type: string
 */
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
            res.status(500).send(error);
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

/**
 * @openapi
 * /add-product-to-wishlist:
 *  post:
 *   tags:
 *   - Wishlists
 *   summary: Add a product to a wishlist
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/AddProductToWishlistInput'
 *   responses:
 *    200:
 *     description: Success
 *     content:
 *      text/plain:
 *       schema:
 *        type: string
 *        example: 'Success'
 *    500: 
 *     description: Error
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorResponse'
 * components:
 *  schemas:  
 *   AddProductToWishlistInput:
 *    type: object
 *    required:
 *     - wishlistId
 *     - productId
 *     - size
 *     - color  
 *     - accessToken
 *    properties:
 *     size:
 *      type: string
 *     accessToken: 
 *      type: string
 *     wishlistId:
 *      type: number
 *     color: 
 *      type: string
 *     productId: 
 *      type: number
 */
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

/**
 * @openapi
 * /get-wishlist-details:
 *  post:
 *   tags:
 *   - Wishlists
 *   summary: Get wishlist details
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/GetWishlistDetails'
 *   responses:
 *    200:
 *     description: Success
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/GetWishlistDetailsResponse'
 *    500: 
 *     description: Error
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorResponse'
 * components:
 *  schemas:  
 *   GetWishlistDetails:
 *    type: object
 *    required:
 *     - wishlistId
 *     - accessToken
 *    properties:
 *     accessToken: 
 *      type: string
 *     wishlistId:
 *      type: number
 *   GetWishlistDetailsResponse:
 *    type: object
 *    properties:
 *     id: 
 *      type: number
 *     user_email:
 *      type: string
 *     name: 
 *      type: string
 *     created_at:
 *      type: string
 */
app.post('/get-wishlist-details', async (req, res) => {
    try {
        const wishlistId = req.body.wishlistId;
        const result = await getWishlistDetails(wishlistId);
        if (result.length === 0) throw 'Invalid wishlist id';
        res.status(200).send(result[0]);
    } catch (error) {
        res.status(500).send(error);
    }
})

/**
 * @openapi
 * /get-wishlist-products:
 *  post:
 *   tags:
 *   - Wishlists
 *   summary: Get products of a wishlist
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/GetWishlistDetails'
 *   responses:
 *    200:
 *     description: Success
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/GetWishlistProductsResponse'
 *    500: 
 *     description: Error
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/components/schemas/ErrorResponse'
 * components:
 *  schemas:  
 *   GetWishlistProductsResponse:
 *    type: array
 *    items:
 *     type: object
 *     properties:
 *      product_id:
 *       type: number
 *      size:
 *       type: string
 *      color:
 *       type: string
 */
app.post('/get-wishlist-products', async (req, res) => {
    try {
        const wishlistId = req.body.wishlistId;
        const result = await getWishlistProducts(wishlistId);
        res.status(200).send(result);
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
    swaggerDocs(app, PORT);
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

const getWishlistDetails = async (wishlistId) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'SELECT * FROM wishlists WHERE id = ?', [wishlistId],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}

const getWishlistProducts = async (wishlistId) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'SELECT product_id, size, color FROM wishlists_have_products WHERE wishlist_id = ?', [wishlistId],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
    });
}