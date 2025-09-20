// src/middleware/middleware.ts
import multer from 'multer';

// Store file temporarily on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

export const upload = multer({ storage });
