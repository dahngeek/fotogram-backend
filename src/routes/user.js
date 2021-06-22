const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUser,
  friend,
  unfriend,
  feed,
  searchUser,
  editUser,
} = require("../controllers/user");
const { protect } = require("../middlewares/auth");

router.route("/").get(protect, getUsers);
router.route("/").put(protect, editUser);
router.route("/feed").get(protect, feed);
router.route("/search").get(searchUser);
router.route("/:username").get(protect, getUser);
router.route("/:id/friend").get(protect, friend);
router.route("/:id/unfriend").get(protect, unfriend);

module.exports = router;
