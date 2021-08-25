require("dotenv").config();
const express = require("express");
const cors = require("cors");
const auth = require("./routes/auth");
const user = require("./routes/user");
const principal = require("./routes/principal");
const connectToDb = require("./utils/db");
const errorHandler = require("./middlewares/errorHandler");
const path = require('path');

const app = express();

// Agregamos el principio HATEOAS
var hateoasLinker = require('express-hateoas-links');
// Reemplaza el .res.json standard
app.use(hateoasLinker);

app.use(express.static('public'))

connectToDb();
app.use(express.json());
app.use(cors());

app.get('/me', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/login', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/registro', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/alumnos', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/subir', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});
app.get('/user/', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Los puntos de entrada de la API, funcionan como FACADE.
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", user);
app.use("/api/v1/principal", principal);

app.use(errorHandler);

const PORT = process.env.PORT || 80;
app.listen(
  PORT,
  console.log(`server started in ${process.env.NODE_ENV} mode at port ${PORT}`)
);
