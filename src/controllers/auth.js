const User = require("../models/User");
const asyncHandler = require("../middlewares/asyncHandler");

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // make sure the email, pw is not empty
  if (!email || !password) {
    return next({
      message: "Ingrese un correo y contraseña",
      statusCode: 400,
    });
  }

  // check if the user exists
  const user = await User.findOne({ email });

  if (!user) {
    return next({
      message: "El Email aún no esta registrado para ninguna cuenta.",
      statusCode: 400,
    });
  }

  // if exists, make sure the password matches
  const match = await user.checkPassword(password);

  if (!match) {
    return next({ message: "La contraseña no coincide", statusCode: 400 });
  }
  const token = user.getJwtToken();

  // then send json web token as response
  res.status(200).json({ success: true, token });
});

exports.signup = asyncHandler(async (req, res, next) => {
  const { fullname, username, email, password, avatar } = req.body;
  
  const user = await User.create({ fullname, username, email, password, avatar });

  const token = user.getJwtToken();

  res.status(200).json({ success: true, token });
});

exports.me = asyncHandler(async (req, res, next) => {
  const { avatar, username, fullname, email, _id, website, bio } = req.user;
  console.log(req);
  res
    .status(200)
    .json({
      success: true,
      data: { avatar, username, fullname, email, _id, website, bio },
    },
    [
      { rel: "self", method: "GET", href: process.env.APP_URL+req.originalUrl }, // Tambien puede ser req.baseUrl+"/me"
    ]
    );
});
