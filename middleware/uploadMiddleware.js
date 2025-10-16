const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    // Allow specific image types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        ),
        false
      );
    }
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kavios-pix", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit" }, // Limit max size
      { quality: "auto" }, // Auto quality optimization
      { fetch_format: "auto" }, // Auto format optimization
    ],
    public_id: (req, file) => {
      // Generate unique public ID
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1e9);
      return `image-${timestamp}-${random}`;
    },
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
  },
});

// Middleware for single image upload
const uploadSingleImage = upload.single("image");

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Only one file is allowed.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "image" as the field name.',
      });
    }
  }

  if (
    err.message.includes("Invalid file type") ||
    err.message.includes("Only image files")
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Other errors
  return res.status(500).json({
    success: false,
    message: "File upload error",
    error: err.message,
  });
};

// Validation middleware for image metadata
const validateImageMetadata = (req, res, next) => {
  const { tags, person } = req.body;

  // Validate tags
  if (tags) {
    try {
      let parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      if (!Array.isArray(parsedTags)) {
        return res.status(400).json({
          success: false,
          message: "Tags must be an array",
        });
      }

      // Check tag limits
      if (parsedTags.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Maximum 20 tags allowed",
        });
      }

      // Validate individual tags
      for (const tag of parsedTags) {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "All tags must be non-empty strings",
          });
        }
        if (tag.length > 50) {
          return res.status(400).json({
            success: false,
            message: "Each tag must be less than 50 characters",
          });
        }
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid tags format",
      });
    }
  }

  // Validate person name
  if (person && typeof person !== "string") {
    return res.status(400).json({
      success: false,
      message: "Person name must be a string",
    });
  }

  if (person && person.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Person name must be less than 100 characters",
    });
  }

  next();
};

module.exports = {
  uploadSingleImage,
  handleUploadError,
  validateImageMetadata,
};
