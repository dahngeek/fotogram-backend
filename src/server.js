require("dotenv").config();
const express = require("express");
const cors = require("cors");
const auth = require("./routes/auth");
const user = require("./routes/user");
const principal = require("./routes/principal");
const connectToDb = require("./utils/db");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Agregamos el principio HATEOAS
var hateoasLinker = require('express-hateoas-links');
// Reemplaza el .res.json standard
app.use(hateoasLinker);

connectToDb();
app.use(express.json());
app.use(cors());

// Los puntos de entrada de la API, funcionan como FACADE.
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", user);
app.use("/api/v1/principal", principal);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(
  PORT,
  console.log(`server started in ${process.env.NODE_ENV} mode at port ${PORT}`)
);
