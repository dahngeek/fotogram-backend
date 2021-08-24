const User = require("../models/User");
const Image = require("../models/Image");
const asyncHandler = require("../middlewares/asyncHandler");

exports.getUsers = asyncHandler(async (req, res, next) => {
  let users = await User.find().select("-password").lean().exec();

  users.forEach((user) => {
    user.isFriend = false;
    const friends = user.friends.map((friend) => friend._id.toString());
    if (friends.includes(req.user.id)) {
      user.isFriend = true;
    }
  });

  users = users.filter((user) => user._id.toString() !== req.user.id);

  res.status(200).json({ success: true, data: users });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username })
    .select("-password")
    .populate({ path: "images", select: "files caption createdAt tags commentsCount likesCount" })
    .populate({ path: "savedImages", select: "files commentsCount likesCount" })
    .populate({ path: "friends", select: "avatar username fullname" })
    .populate({ path: "friended", select: "avatar username fullname" })
    .lean()
    .exec();

  if (!user) {
    return next({
      message: `No se encontro el usuario ${req.params.username}.`,
      statusCode: 404,
    });
  }

  user.isFriend = false;
  const friends = user.friends.map((friend) => friend._id.toString());

  user.friends.forEach((friend) => {
    friend.isFriend = false;
    if (req.user.friended.includes(friend._id.toString())) {
      friend.isFriend = true;
    }
  });

  user.friended.forEach((user) => {
    user.isFriend = false;
    if (req.user.friended.includes(user._id.toString())) {
      user.isFriend = true;
    }
  });

  if (friends.includes(req.user.id)) {
    user.isFriend = true;
  }

  user.isMe = req.user.id === user._id.toString();

  res.status(200).json({ success: true, data: user });
});

exports.friend = asyncHandler(async (req, res, next) => {
  // make sure the user exists
  const user = await User.findById(req.params.id);

  if (!user) {
    return next({
      message: `No se encontró un usuario con id ${req.params.id}`,
      statusCode: 404,
    });
  }

  // make the sure the user is not the logged in user
  if (req.params.id === req.user.id) {
    return next({ message: "No te puedes agregar como amigo a ti mismo", status: 400 });
  }

  // only friend if the user is not friended already
  if (user.friends.includes(req.user.id)) {
    return next({ message: "Ya lo tienes como amigo", status: 400 });
  }

  await User.findByIdAndUpdate(req.params.id, {
    $push: { friends: req.user.id },
    $inc: { friendsCount: 1 },
  });
  await User.findByIdAndUpdate(req.user.id, {
    $push: { friended: req.params.id },
    $inc: { friendedCount: 1 },
  });

  res.status(200).json({ success: true, data: {} });
});

exports.unfriend = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next({
      message: `No se encontró un usuario con el ID ${req.params.id}`,
      statusCode: 404,
    });
  }

  // make the sure the user is not the logged in user
  if (req.params.id === req.user.id) {
    return next({ message: "No puedes agregarte o eliminarte a ti mismo como amigo.", status: 400 });
  }

  await User.findByIdAndUpdate(req.params.id, {
    $pull: { friends: req.user.id },
    $inc: { friendsCount: -1 },
  });
  await User.findByIdAndUpdate(req.user.id, {
    $pull: { friended: req.params.id },
    $inc: { friendedCount: -1 },
  });

  res.status(200).json({ success: true, data: {} });
});

exports.feed = asyncHandler(async (req, res, next) => {
  const friended = req.user.friended;

  const users = await User.find()
    .where("_id")
    .in(friended.concat([req.user.id]))
    .exec();

  const imageIds = users.map((user) => user.images).flat();

  const images = await Image.find()
    .populate({
      path: "comments",
      select: "text",
      populate: { path: "user", select: "avatar fullname username" },
    })
    .populate({ path: "user", select: "avatar fullname username" })
    .sort("-createdAt")
    .where("_id")
    .in(imageIds)
    .lean()
    .exec();

  images.forEach((image) => {
    // is the loggedin user liked the image
    image.isLiked = false;
    const likes = image.likes.map((like) => like.toString());
    if (likes.includes(req.user.id)) {
      image.isLiked = true;
    }

    // is the loggedin saved this image
    image.isSaved = false;
    const savedImages = req.user.savedImages.map((image) => image.toString());
    if (savedImages.includes(image._id)) {
      image.isSaved = true;
    }

    // is the image belongs to the loggedin user
    image.isMine = false;
    if (image.user._id.toString() === req.user.id) {
      image.isMine = true;
    }

    // is the comment belongs to the loggedin user
    image.comments.map((comment) => {
      comment.isCommentMine = false;
      if (comment.user._id.toString() === req.user.id) {
        comment.isCommentMine = true;
      }
    });
  });

  res.status(200).json({ success: true, data: images });
});

exports.searchUser = asyncHandler(async (req, res, next) => {
  if (!req.query.username) {
    return next({ message: "El usuario no puede estar vacío", statusCode: 400 });
  }

  const regex = new RegExp(req.query.username, "i");
  const users = await User.find({ username: regex });

  res.status(200).json({ success: true, data: users });
});

exports.editUser = asyncHandler(async (req, res, next) => {
  const { avatar, username, fullname, website, bio, email } = req.body;

  const fieldsToUpdate = {};
  if (avatar) fieldsToUpdate.avatar = avatar;
  if (username) fieldsToUpdate.username = username;
  if (fullname) fieldsToUpdate.fullname = fullname;
  if (email) fieldsToUpdate.email = email;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      $set: { ...fieldsToUpdate, website, bio },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("avatar username fullname email bio website");

  res.status(200).json({ success: true, data: user });
});
