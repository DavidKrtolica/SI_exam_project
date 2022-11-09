import express from "express";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';


// Your web app's Firebase configuration
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

// Setup and Node Express server
const app = express();
app.use(express.json());

//SWAGGER DOCUMENTATION FOR API ENDPOINTS
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//ENDPOINT FOR SIGNING-UP (REGISTRATION) - "firebase.auth().createUserWithEmailAndPassword(email, password).then()"
//AFTER WHICH WE ALSO NEED TO REGISTER THE USER AND MAKE A QUERY USING OUR GRAPHQL SERVICE TO SAVE A USER
//CLIENT (REACT SIGN-UP FORM POST REQUEST) SEND A REQUEST WITH BODY CONTAINING USER INFO
app.post("/auth/register", (req, res) => {
    const newUser = req.body;
    createUserWithEmailAndPassword(firebaseAuth, newUser.email, newUser.password)
        .then((response) => {
            //HERE WE SAVE THE USER TO OUR?/THEIR? DATABASE
            //IN OUR CASE THE GRAPHQL QUERY TO SAVE USER DATA (EXCLUDING THE PASSWORD)
            newUser.id = response.user.uid;
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

//ENDPOINT FOR LOGIN - "firebase.auth().signInWithEmailAndPassword(email, password).then()"
//AFTER LOGIN, AGAIN A GRAPHQL QUERY TO FIND THE USER WITH THE CORRESPONDING EMAIL WHICH IS ALREADY IN THE DB
//SAME AS BEFORE, CLIENT SEND A POST REQUEST HITTING THIS ENDPOINT WITH A REQ.BODY CONTAINING EXISTING USER CREDENTIALS
app.post("/auth/login", (req, res) => {
    const loginUser = req.body;
    signInWithEmailAndPassword(firebaseAuth, loginUser.email, loginUser.password)
        .then((response) => {
            const accessToken = response.user.stsTokenManager.accessToken;
            const refreshToken = response.user.stsTokenManager.refreshToken;
            // const resAccessToken = await response.user.getIdToken();
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

//ENDPOINT FOR ACCEPTING AN INVITE SENT TO A USER VIA EMAIL-SERVICE
app.get("/", (req, res) => {
    res.send({ "text": "Hello World!!!" });
});

const port = process.env.PORT || 3000;
app.listen(port, (error) => {
    if (error) {
        console.log(error);
    }
    console.log(`Auth-app listening at port: ${port}`);
});