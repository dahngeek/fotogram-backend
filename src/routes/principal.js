const express = require("express");
const router = express.Router();
const {
  getImages,
  getImage,
  addImage,
  deleteImage,
  toggleLike,
  toggleSave,
  addComment,
  deleteComment,
  searchImage,
} = require("../controllers/principal");
const { protect } = require("../middlewares/auth");

router.route("/").get(getImages).post(protect, addImage);
router.route("/search").get(searchImage);
router.route("/:id").get(protect, getImage).delete(protect, deleteImage);
router.route("/:id/togglelike").get(protect, toggleLike);
router.route("/:id/togglesave").get(protect, toggleSave);
router.route("/:id/comments").post(protect, addComment);
router.route("/:id/comments/:commentId").delete(protect, deleteComment);

module.exports = router;
