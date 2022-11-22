const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
   res.redirect('/login');
});

app.get('/register', (req, res) => {
   res.sendFile(__dirname + '/public/register/register.html');
});

app.get('/login', (req, res) => {
   res.sendFile(__dirname + '/public/login/login.html');
});

app.get('/products', (req, res) => {
   res.sendFile(__dirname + '/public/products/products.html');
});

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, (error) => {
   if (error) {
      console.log(error);
   }
   console.log('Server running on port', server.address().port);
});
