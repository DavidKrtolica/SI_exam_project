const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get("/register", (req, res) => {
    res.sendFile(__dirname + "/public/register.html");
});

const PORT = process.env.PORT || 8080
const server = app.listen(PORT, error => {
    if (error) {
        console.log(error);
    }
    console.log("Server running on port", server.address().port);
});