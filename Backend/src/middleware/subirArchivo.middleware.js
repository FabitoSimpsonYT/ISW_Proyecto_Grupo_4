import multer from "multer";
import path from "path";

// Carpeta donde se guardarán los archivos
const uploadFolder = "./src/uploads/";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const sanitized = file.originalname.replace(/\s+/g, "-");
    const uniqueName = Date.now() + "-" + sanitized;
    cb(null, uniqueName);
  },
});

// Tipos permitidos
const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos PDF, JPG o PNG"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

// Para subir SOLO 1 archivo, por ejemplo evidencia
export const uploadArchivoApelacion = upload.single("archivo");

// Manejo de errores
export const handleFileUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: "El archivo excede 5MB" });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};
