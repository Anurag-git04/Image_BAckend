const Image = require("../models/Image");
const Album = require("../models/Album");
const cloudinary = require("../config/cloudinary");

/**
 * Delete multiple images from both Cloudinary and database
 * @param {string} albumId - Album ID to delete images from
 * @returns {Object} - Result with deleted count and any errors
 */
const deleteImagesFromAlbum = async (albumId) => {
  try {
    const albumImages = await Image.find({ albumId });

    if (albumImages.length === 0) {
      return { deletedCount: 0, errors: [] };
    }

    const errors = [];

    // Delete images from Cloudinary
    const cloudinaryDeletions = albumImages.map(async (image) => {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (cloudinaryError) {
        const errorMsg = `Failed to delete image ${image.imageId} from Cloudinary: ${cloudinaryError.message}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    });

    // Wait for all Cloudinary deletions to complete
    await Promise.allSettled(cloudinaryDeletions);

    // Delete all image records from database
    const deleteResult = await Image.deleteMany({ albumId });

    console.log(
      `Deleted ${deleteResult.deletedCount} images from album ${albumId}`
    );

    return {
      deletedCount: deleteResult.deletedCount,
      errors: errors,
    };
  } catch (error) {
    console.error(`Error deleting images from album ${albumId}:`, error);
    throw error;
  }
};

/**
 * Delete a single image from both Cloudinary and database
 * @param {string} imageId - Image ID to delete
 * @param {string} albumId - Album ID the image belongs to
 * @returns {Object} - Result with success status and any errors
 */
const deleteSingleImage = async (imageId, albumId) => {
  try {
    const image = await Image.findOne({ imageId, albumId });

    if (!image) {
      return { success: false, error: "Image not found" };
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(image.cloudinaryPublicId);
    } catch (cloudinaryError) {
      console.warn(
        `Failed to delete image ${imageId} from Cloudinary:`,
        cloudinaryError.message
      );
    }

    // Delete from database
    await Image.deleteOne({ imageId, albumId });

    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting image ${imageId}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Find and clean up orphaned images (images without valid albums)
 * @returns {Object} - Result with cleanup statistics
 */
const cleanupOrphanedImages = async () => {
  try {
    // Find all images
    const allImages = await Image.find({});
    const orphanedImages = [];

    // Check each image's album
    for (const image of allImages) {
      const album = await Album.findOne({ albumId: image.albumId });
      if (!album) {
        orphanedImages.push(image);
      }
    }

    if (orphanedImages.length === 0) {
      return { cleanedCount: 0, errors: [] };
    }

    const errors = [];

    // Delete orphaned images from Cloudinary
    const cloudinaryDeletions = orphanedImages.map(async (image) => {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (cloudinaryError) {
        const errorMsg = `Failed to delete orphaned image ${image.imageId} from Cloudinary: ${cloudinaryError.message}`;
        console.warn(errorMsg);
        errors.push(errorMsg);
      }
    });

    await Promise.allSettled(cloudinaryDeletions);

    // Delete orphaned image records
    const orphanedImageIds = orphanedImages.map((img) => img.imageId);
    const deleteResult = await Image.deleteMany({
      imageId: { $in: orphanedImageIds },
    });

    console.log(`Cleaned up ${deleteResult.deletedCount} orphaned images`);

    return {
      cleanedCount: deleteResult.deletedCount,
      errors: errors,
    };
  } catch (error) {
    console.error("Error cleaning up orphaned images:", error);
    throw error;
  }
};

/**
 * Validate image file constraints
 * @param {Object} file - Multer file object
 * @returns {Object} - Validation result
 */
const validateImageFile = (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error:
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size too large. Maximum size is 5MB." };
  }

  return { valid: true, error: null };
};

module.exports = {
  deleteImagesFromAlbum,
  deleteSingleImage,
  cleanupOrphanedImages,
  validateImageFile,
};
