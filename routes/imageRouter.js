const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  uploadSingleImage,
  handleUploadError,
  validateImageMetadata,
} = require("../middleware/uploadMiddleware");
const {
  getAlbumImages,
  uploadImage,
  getFavoriteImages,
  toggleFavorite,
  addComment,
  updateImageMetadata,
  deleteImage,
  serveImage,
} = require("../controllers/imageController");

// All image routes require authentication
router.use(authenticateToken);

// Image upload
router.post(
  "/:albumId/images",
  uploadSingleImage,
  handleUploadError,
  validateImageMetadata,
  uploadImage
);

// Get images in album
router.get("/:albumId/images", getAlbumImages);

// Get favorite images in album
router.get("/:albumId/images/favorites", getFavoriteImages);

// Toggle favorite status
router.put("/:albumId/images/:imageId/favorite", toggleFavorite);

// Add comment to image
router.post("/:albumId/images/:imageId/comments", addComment);

// Update image metadata
router.put("/:albumId/images/:imageId/metadata", updateImageMetadata);

// Delete image
router.delete("/:albumId/images/:imageId", deleteImage);

// Serve image file
router.get("/:albumId/images/:imageId/file", serveImage);

module.exports = router;
