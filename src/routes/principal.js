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
  uploadImage,
} = require("../controllers/principal");
const { protect } = require("../middlewares/auth");

var multer = require('multer')

router.route("/").get(getImages).post(protect, addImage);
router.route("/search").get(searchImage);
router.route("/:id").get(protect, getImage).delete(protect, deleteImage);
router.route("/:id/togglelike").get(protect, toggleLike);
router.route("/:id/togglesave").get(protect, toggleSave);
router.route("/:id/comments").post(protect, addComment);
router.route("/:id/comments/:commentId").delete(protect, deleteComment);

// router.route("/").get(function (req, res) {
//   res.status(200)
//       .send('<form method="POST" action="upload" enctype="multipart/form-data">'
//           + '<input type="file" name="file1"/><input type="submit"/>'
//           + '</form>')
//       .end();
// });

var upload = multer({limits: {fileSize:10*1024*1024}})

router.post("/upload", upload.single("file1"), uploadImage);

module.exports = router;
