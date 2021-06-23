const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, "Porfavor ingrese su nombre completo"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Porfavor ingrese un usuario"],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, "Porfavor ingrese su email"],
    trim: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Porfavor ingrese una contraseña "],
    minlength: [6, "La contraseña debe ser de almenos 6 characters"],
    maxlength: [15, "La contraseña debe ser de maximo 15 characters"],
  },
  avatar: {
    type: String,
    required: [true, "Porfavor suba una imagen de perfil."],
  },
  bio: String,
  website: String,
  friends: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  friendsCount: {
    type: Number,
    default: 0,
  },
  friendedCount: {
    type: Number,
    default: 0,
  },
  friended: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  images: [{ type: mongoose.Schema.ObjectId, ref: "Image" }],
  imageCount: {
    type: Number,
    default: 0,
  },
  savedImages: [{ type: mongoose.Schema.ObjectId, ref: "Image" }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

UserSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
