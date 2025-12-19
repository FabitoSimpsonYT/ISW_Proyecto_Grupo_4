import multer from "multer";

const uploadFolder = "./src/uploads/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Solo se permiten PDF, JPG o PNG"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const uploadSingleFile = (fieldName) => upload.single(fieldName);

export const handleFileUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ message: "El archivo excede 5MB" });
  if (err) return res.status(400).json({ message: err.message });
  next();
};
