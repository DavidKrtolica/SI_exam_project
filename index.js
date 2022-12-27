import express from "express";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, fetchSignInMethodsForEmail } from "firebase/auth";
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';
import admin from "firebase-admin";
import mysql from 'mysql';
import * as dotenv from 'dotenv';

dotenv.config();

import serviceAccount from "./auth-service-si-firebase-adminsdk-nzwji-d987f2e2f4.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://auth-service-si-default-rtdb.europe-west1.firebasedatabase.app"
});

//Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAx6hyu6muOKO02z7dFLGVGkC89IifMzdQ",
    authDomain: "auth-service-si.firebaseapp.com",
    projectId: "auth-service-si",
    storageBucket: "auth-service-si.appspot.com",
    messagingSenderId: "407495336479",
    appId: "1:407495336479:web:965b053cbe9a83d8e2eb2a"
};
// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
const firebaseAuth = getAuth(firebaseApp);

// Setup and Node Express server with CORS
const app = express();
app.use(express.json());
app.use(cors());

//SWAGGER DOCUMENTATION FOR API ENDPOINTS
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


//ENDPOINT FOR SIGNING-UP (REGISTRATION)
app.post("/auth/register", (req, res) => {
    const newUser = req.body;  
    const code = req.query.code;
    createUserWithEmailAndPassword(firebaseAuth, newUser.email, newUser.password)
        .then(async (response) => {
            newUser.id = response.user.uid;
            if(code != undefined) {
                //call mysql query to update table and set CODE to null
                await updateRemovesCode(code);
            }
            res.status(201).json({
                status: "Success",
                data: {
                    email: newUser.email,
                    id: newUser.id
                }
            });
        })
        .catch((error) => {
            //HERE WE CATCH THE ERROR IF USER NOT CREATED
            if (error.code == "auth/email-already-in-use") {
                res.status(409).json({
                    status: "Failed",
                    description: "Email Already Exists"
                });
            } else if (error.code == "auth/weak-password") {
                res.status(500).json({
                    status: "Failed",
                    description: "Weak Password"
                });
            } else {
                res.status(500).json({
                    status: "Failed",
                    description: "Internal Server Error"
                });
            }
        });
});

//ENDPOINT FOR LOGIN 
app.post("/auth/login", (req, res) => {
    const loginUser = req.body; 
    const code = req.query.code;
    console.log(code);
    signInWithEmailAndPassword(firebaseAuth, loginUser.email, loginUser.password)
        .then(async (response) => {
            const accessToken = response.user.stsTokenManager.accessToken;
            const refreshToken = response.user.stsTokenManager.refreshToken;
            if(code != undefined) {
                //call mysql query to update table and set CODE to null
                await updateRemovesCode(code);
            }
            res.status(200).json({
                status: "Success",
                data: {
                    accessToken,
                    refreshToken
                }
            });
        })
        .catch((error) => {
            //HERE WE CATCH THE ERROR IF USER NOT FOUND
            let errDesc;
            let errStatus;
            let errStatusCode;
            if (error.code == "auth/wrong-password") {
                errDesc = "Wrong Password";
                errStatus = "Unauthorized";
                errStatusCode = 401;
            } else if (error.code == "auth/user-not-found") {
                errDesc = "User Not Found";
                errStatus = "Unauthorized";
                errStatusCode = 401;
            } else {
                errDesc = "Internal Server Error";
                errStatus = "Failed";
                errStatusCode = 500;
            }
            res.status(errStatusCode).json({
                status: errStatus,
                description: errDesc
            });
        });
});

// Exchange a refresh token for an ID token
// We refresh a Firebase ID token by issuing an HTTP POST request to the securetoken.googleapis.com endpoint.
const refreshTokenRequest = (req) => {
    const refreshToken = req.body.refreshToken;
    const data = {
        "grant_type": 'refresh_token',
        "refresh_token": refreshToken
    };
    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };
    // it resolves only if the status code is 200
    return new Promise((resolve, reject) => {
        axios.post(`https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`, data, config)
            .then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err.response.data.error);
            });
    });
}

//REFRESH TOKEN ENDPOINT
app.post("/auth/refreshToken", (req, res) => {
    refreshTokenRequest(req).then((firebaseRes) => {
        res.status(200).json({
            status: "Success",
            data: {
                accessToken: firebaseRes.data.access_token,
                refreshToken: firebaseRes.data.refresh_token,
                expiresIn: firebaseRes.data.expires_in, // 3600 milliseconds
            }
        });
    }).catch((firebaseRes) => {
        res.status(500).json({
            status: "Error",
            data: {
                firebaseRes
            }
        });
    });
});

//ENDPOINT FOR LOGGING THE USER OUT OF THEIR FIREBASE PROFILE
app.post("/auth/logout", (req, res) => {
    signOut(firebaseAuth).then(() => {
        res.status(200).json({
            status: "Success",
            desc: "Logged-out"
        });
    }).catch((err) => {
        res.status(500).json({
            status: "Error",
            data: { err }
        });
    });
});

//ENDPOINT FOR ACCEPTING AN INVITE, REDIRECTED FROM THE EMAIL SERVICE
app.get("/auth/acceptInvite", async (req, res) => {
    const inviteCode = req.query.code;
    const email = req.query.email;
    const codeValid = await isCodeValid(email, inviteCode);
    if(codeValid) {
        const emailExists = await userExists(email);
        if(emailExists) {
            //login with code query param, redirects to OUR client
            let urlLogin = new URL("https://integrate-authentication-service.azurewebsites.net/login");
            urlLogin.searchParams.set('code', inviteCode); 
            res.redirect(307, urlLogin);
        } else {
            //register with code query param, redirects to OUR client
            let urlRegister = new URL("https://integrate-authentication-service.azurewebsites.net/register"); 
            urlRegister.searchParams.set('code', inviteCode); 
            res.redirect(307, urlRegister);
        }
    } else {
        res.status(404).json({
            status: "Error",
            description: "Code Not Valid"
        });
    }
});

//ENDPOINT FOR VERIFYING ID TOKEN
//EXAMPLE: "https://firebase.google.com/docs/auth/admin/verify-id-tokens#node.js"
app.get("/verifyAccessToken", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const accessToken = authHeader.split(" ")[1];
        admin
            .auth()
            .verifyIdToken(accessToken)
            .then(function (decodedToken) {
                const uid = decodedToken.uid;
                res.status(200).json({
                    uid
                });
            })
            .catch(function (error) {
                res.status(403).json({
                    uid: "invalid"
                });
            });
    } else {
        res.sendStatus(403);
    }
});

//REDIRECT TO API-DOCS (SWAGGER)
app.get("/", (req, res) => {
    res.redirect('/api-docs');
});

//SETTING UP THE PORT AND SERVER/APP LISTENING TO IT
const port = process.env.PORT || 3000;
app.listen(port, (error) => {
    if (error) {
        console.log(error);
    }
    console.log(`Auth-app listening at port: ${port}`);
});

//mysql database connection
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

//SQL query to check for code validity
const isCodeValid = async (userEmail, code) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'SELECT wishlist_id FROM wishlists_have_users WHERE user_email = ? AND code = ?', [userEmail, code],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(false);
                }
                if(results.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        );
    });
};

//UPDATE sql query to update the code and set to NULL 
const updateRemovesCode = async (code) => {
    return new Promise(async (resolve, reject) => {
        MySQLConnection.query(
            'UPDATE wishlists_have_users SET code = NULL WHERE code = ?', [code],
            function (error, results, fields) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(true);
            }
        );
    });
};

//FIREBASE function to verify if the user with given email exists
const userExists = async (userEmail) => {
    return await fetchSignInMethodsForEmail(firebaseAuth, userEmail).then((response) => {
        if(response.length != 0) {
            return true;
        } else {
            return false;
        }
    });
};