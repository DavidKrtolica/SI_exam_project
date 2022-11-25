import express from 'express';
import http from 'http';
import mysql from 'mysql';
import {ServiceBusClient} from "@azure/service-bus";
import {Server} from "socket.io";
import {v4 as uuidv4} from 'uuid';
import cors from 'cors';

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    perMessageDeflate: false,
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ["Ocp-Apim-Subscription-Key", "Authorization"],
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

    const accessToken = socket.handshake.headers['authorization'];
    const parsedToken = parseJwt(accessToken);
    const userEmail = parsedToken.email;

    // gets the wishlist ids that the user created/is invited
    const wishlistIds = await getWishlistsByUserEmail(userEmail);
    wishlistIds.forEach(wishlist => socket.join(wishlist.wishlist_id));
    wishlistIds.forEach(wishlist => socket.to(wishlist.wishlist_id).emit('userJoined', userEmail));

    // // accept wishlist invite
    // socket.on('acceptInvite', async (wishlistId) => {
    //     await setHasAcceptedInviteByWishlistId(wishlistId, userEmail);
    // })

    socket.on('disconnect', async () => {
        wishlistIds.forEach(wishlist => socket.to(wishlist.wishlist_id).emit('userLeft', userEmail));
    })
})

// invites to join a wishlist
app.post('/invite', async (req, res) => {
    const accessToken = req.header('authorization');
    const parsedToken = parseJwt(accessToken);
    const userEmail = req.body.userEmail;
    const validEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!userEmail.match(validEmailRegex)) return res.status(400).send('Invalid email');
    const wishlistId = req.body.wishlistId;
    const wishlistName = req.body.wishlistName;
    const code = uuidv4();
 
    // adds the user to the wishlist in the database
    addUserToWishlist(wishlistId, code, userEmail, false)
        .then(() => {
            // sends message to queue for further processing by the email service
            const serviceBusMessage = {
                body: {
                    userEmail,
                    invitedBy: parsedToken.email,
                    wishlistId,
                    code,
                    wishlistName,
                }
            };
            // if db operation successful, we send message to queue
            sendMessageToQueue(serviceBusMessage).catch((err) => {
                console.log("Error occurred: ", err);
            });
            return res.status(200).send('Added user to wishlist');
        }).catch((e) => {
            return res.status(400).send(e);
        })
})

// creates a new wishlist
app.post('/wishlist', async (req, res) => {
    const wishlistName = req.body.wishlistName;
    const accessToken = req.header('authorization');
    const parsedToken = parseJwt(accessToken);
    const userId = parsedToken.user_id;
    const userEmail = parsedToken.email;

    createNewWishlist(wishlistName, userId).then(async (lastInsertedId) => {
        const code = uuidv4();
        // adds owner of wishlist to wishlists_have_users table
        await addUserToWishlist(lastInsertedId, code, userEmail, true);
        return res.status(200).send({
            lastInsertedId
        });
    }).catch((e) => {
        return res.status(400).send(e);
    })
})

// adds a product to a wishlist
app.post('/wishlist/product', async (req, res) => {
    const wishlistId = req.body.wishlistId;
    const productId = req.body.productId;
    addProductToWishlist(wishlistId, productId).then(() => {
        return res.status(200).send('Added product to wishlist');
    }).catch((e) => {
        return res.status(400).send(e);
    })
})

// views a wishlist
app.get('/wishlist/:id', async (req, res) => {
    const accessToken = req.header('authorization');
    const parsedToken = parseJwt(accessToken);
    const email = parsedToken.email;
    const wishlistId = req.params.id;

    // validates that there is a wishlist with the given id
    getWishlistById(wishlistId).then((dbResult) => {
        if (dbResult < 1) return res.status(400).send('Wishlist does not exist');
    }).catch((e) => {
        return res.status(400).send('Wishlist does not exist');
    })

    // wishlistId is the socket room id
    // gets the users associated with this wishlist
    // shows who is online, offline and not accepted invitation

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
const connectionString = "Endpoint=sb://service-bus-si-exam.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=Hfngr0rv5FC0gIXw0Jl0PSEn4BDCkR3LGHLi093MuPI="
const queueName = "invite-friend-with-email"
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
const createNewConnection = () => {
    return mysql.createConnection({
        host: "eros.mysql.database.azure.com",
        user: "api",
        password: "gcXHY&My-3=8+/6~",
        database: "wishlist_website",
        port: 3306,
        ssl: {
            rejectUnauthorized: true,
        }
    });
}

const createNewWishlist = async (wishlistName, userId) => {
    let conn;
    conn = await createNewConnection();
    return new Promise(async (resolve, reject) => {
        conn.connect();
        // verify that the wishlist exists
        conn.query(
            'INSERT INTO wishlists SET ?', {
                name: wishlistName,
                user_id: userId,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            },
            function (error, results, fields) {
                if (error) reject(error);
                resolve(results.insertId);
            });
        conn.end();
    });
}

const addProductToWishlist = async (wishlistId, productId) => {
    let conn;
    conn = await createNewConnection();
    return new Promise(async (resolve, reject) => {
        conn.connect();
        // verify that the wishlist exists
        conn.query(
            'INSERT INTO wishlists_have_products VALUES (?, ?)', [wishlistId, productId],
            function (error, results, fields) {
                if (error) reject(error);
                resolve(results);
            });
        conn.end();
    });
}

const addUserToWishlist = async (wishlistId, code, userEmail, has_accepted_invitation) => {
    let conn;
    conn = await createNewConnection();
    return new Promise(async (resolve, reject) => {
        conn.connect();
        // verify that the wishlist exists
        conn.query(
            'INSERT INTO wishlists_have_users VALUES (?, ?, ?, ?, ?, ?, ?)', [wishlistId, null, null, has_accepted_invitation, code, userEmail, new Date().toISOString().slice(0, 19).replace('T', ' ')],
            function (error, results, fields) {
                if (error) reject(error);
                resolve(results);
            });
        conn.end();
    });
}

const getWishlistById = async (wishlistId) => {
    let conn;
    conn = await createNewConnection();
    return new Promise(async (resolve, reject) => {
        conn.connect();
        // verify that the wishlist exists
        conn.query(
            'SELECT count(*) FROM wishlists where id = ?', [wishlistId],
            function (error, results, fields) {
                if (error) reject(error);
                resolve(parseInt(results[0]["count(*)"]));
            });
        conn.end();
    });
}

const getWishlistsByUserEmail = async (userEmail) => {
    let conn;
    conn = await createNewConnection();
    return new Promise(async (resolve, reject) => {
        conn.connect();
        conn.query(
            'SELECT wishlist_id FROM wishlists_have_users WHERE user_email = ?', [userEmail],
            function (error, results, fields) {
                if (error) reject(error);
                resolve(results);
            });
        conn.end();
    });
}

const setHasAcceptedInviteByWishlistId = async (wishlistId, userEmail) => {
    let conn;
    conn = await createNewConnection();
    return new Promise(async (resolve, reject) => {
        conn.connect();
        conn.query(
            'UPDATE wishlists_have_users SET has_accepted_invitation = TRUE WHERE wishlist_id = ? AND user_email = ?', [wishlistId, userEmail],
            function (error, results, fields) {
                if (error) reject(error);
                resolve(parseInt(results));
            });
        conn.end();
    });
}