const mongoose = require("mongoose");
const Image = require("../models/Image");
const User = require("../models/User");
const Comment = require("../models/Comment");
const asyncHandler = require("../middlewares/asyncHandler");

exports.getImages = asyncHandler(async (req, res, next) => {
  var perPage = 10;
  console.log(req);
  var page = req.query.page || 1;
  const images = await Image.find()
                            .skip((perPage * page) - perPage)
                            .limit(perPage);


  var hateoas_links = [];
  if(images.length == 10) {
    hateoas_links.push({ rel: "next", method: "GET", href: process.env.APP_URL+req.baseUrl+"?page="+(page+1) });
  }
  if(page > 1){
    hateoas_links.push({ rel: "prev", method: "GET", href: process.env.APP_URL+req.baseUrl+"?page="+(page-1) });
  }

  res.status(200).json(
    { success: true, data: images, pagina: page },
    hateoas_links
    );
});

exports.getImage = asyncHandler(async (req, res, next) => {
  const image = await Image.findById(req.params.id)
    .populate({
      path: "comments",
      select: "text",
      populate: {
        path: "user",
        select: "username avatar",
      },
    })
    .populate({
      path: "user",
      select: "username avatar",
    })
    .lean()
    .exec();

  if (!image) {
    return next({
      message: `No image found for id ${req.params.id}`,
      statusCode: 404,
    });
  }

  // is the image belongs to loggedin user?
  image.isMine = req.user.id === image.user._id.toString();

  // is the loggedin user liked the image??
  const likes = image.likes.map((like) => like.toString());
  image.isLiked = likes.includes(req.user.id);

  // is the loggedin user liked the image??
  const savedImages = req.user.savedImages.map((image) => image.toString());
  image.isSaved = savedImages.includes(req.params.id);

  // is the comment on the image belongs to the logged in user?
  image.comments.forEach((comment) => {
    comment.isCommentMine = false;

    const userStr = comment.user._id.toString();
    if (userStr === req.user.id) {
      comment.isCommentMine = true;
    }
  });

  res.status(200).json({ success: true, data: image });
});

exports.deleteImage = asyncHandler(async (req, res, next) => {
  const image = await Image.findById(req.params.id);

  if (!image) {
    return next({
      message: `No se encontró una imagen con id ${req.params.id}`,
      statusCode: 404,
    });
  }

  if (image.user.toString() !== req.user.id) {
    return next({
      message: "No estas autorizado a eliminar esta imagen",
      statusCode: 401,
    });
  }

  await User.findByIdAndUpdate(req.user.id, {
    $pull: { images: req.params.id },
    $inc: { imageCount: -1 },
  });

  await image.remove();

  res.status(200).json({ success: true, data: {} });
});

exports.addImage = asyncHandler(async (req, res, next) => {
  const { caption, files, tags } = req.body;
  const user = req.user.id;

  let image = await Image.create({ caption, files, tags, user });

  await User.findByIdAndUpdate(req.user.id, {
    $push: { images: image._id },
    $inc: { imageCount: 1 },
  });

  image = await image
    .populate({ path: "user", select: "avatar username fullname" })
    .execPopulate();

  res.status(200).json({ success: true, data: image });
});

exports.toggleLike = asyncHandler(async (req, res, next) => {
  // make sure that the image exists
  const image = await Image.findById(req.params.id);

  if (!image) {
    return next({
      message: `No se encontro una imagen para el id ${req.params.id}`,
      statusCode: 404,
    });
  }

  if (image.likes.includes(req.user.id)) {
    const index = image.likes.indexOf(req.user.id);
    image.likes.splice(index, 1);
    image.likesCount = image.likesCount - 1;
    await image.save();
  } else {
    image.likes.push(req.user.id);
    image.likesCount = image.likesCount + 1;
    await image.save();
  }

  res.status(200).json({ success: true, data: {} });
});

exports.addComment = asyncHandler(async (req, res, next) => {
  const image = await Image.findById(req.params.id);

  if (!image) {
    return next({
      message: `No se encontro una imagen para el id ${req.params.id}`,
      statusCode: 404,
    });
  }

  let comment = await Comment.create({
    user: req.user.id,
    image: req.params.id,
    text: req.body.text,
  });

  image.comments.push(comment._id);
  image.commentsCount = image.commentsCount + 1;
  await image.save();

  comment = await comment
    .populate({ path: "user", select: "avatar username fullname" })
    .execPopulate();

  res.status(200).json({ success: true, data: comment });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const image = await Image.findById(req.params.id);

  if (!image) {
    return next({
      message: `No se encontro una imagen para el id ${req.params.id}`,
      statusCode: 404,
    });
  }

  const comment = await Comment.findOne({
    _id: req.params.commentId,
    image: req.params.id,
  });

  if (!comment) {
    return next({
      message: `No se encontro un comentario con id ${req.params.id}`,
      statusCode: 404,
    });
  }

  if (comment.user.toString() !== req.user.id) {
    return next({
      message: "No estas autorizado a eliminar este comentario",
      statusCode: 401,
    });
  }

  // remove the comment from the image
  const index = image.comments.indexOf(comment._id);
  image.comments.splice(index, 1);
  image.commentsCount = image.commentsCount - 1;
  await image.save();

  await comment.remove();

  res.status(200).json({ success: true, data: {} });
});

exports.searchImage = asyncHandler(async (req, res, next) => {
  if (!req.query.caption && !req.query.tag) {
    return next({
      message: "Ingresa por favor un termino o etiqueta para busqueda",
      statusCode: 400,
    });
  }

  let images = [];

  if (req.query.caption) {
    const regex = new RegExp(req.query.caption, "i");
    images = await Image.find({ caption: regex });
  }

  if (req.query.tag) {
    images = images.concat([await Image.find({ tags: req.query.tag })]);
  }

  res.status(200).json({ success: true, data: images });
});

exports.toggleSave = asyncHandler(async (req, res, next) => {
  // make sure that the image exists
  const image = await Image.findById(req.params.id);

  if (!image) {
    return next({
      message: `No se encontro imagen para el id ${req.params.id}`,
      statusCode: 404,
    });
  }

  const { user } = req;

  if (user.savedImages.includes(req.params.id)) {
    console.log("borrando imagen");
    await User.findByIdAndUpdate(user.id, {
      $pull: { savedImages: req.params.id },
    });
  } else {
    console.log("guardando imagen");
    await User.findByIdAndUpdate(user.id, {
      $push: { savedImages: req.params.id },
    });
  }

  res.status(200).json({ success: true, data: {} });
});
