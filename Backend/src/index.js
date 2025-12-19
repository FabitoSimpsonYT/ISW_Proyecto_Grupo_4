import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource, connectDB } from "./config/configDb.js";
import { routerApi } from "./routes/index.routes.js";
import { HOST, PORT } from "./config/configEnv.js";
import initDB from "./config/initDB.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Configurar CORS: permitir el origen del frontend y credenciales (cookies)
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const corsOptions = process.env.NODE_ENV === "development"
  ? { origin: true, credentials: true }
  : { origin: FRONTEND_URL, credentials: true };
app.use(cors(corsOptions));
app.get("/", (req, res) => {
  res.send("¡Bienvenido a mi API REST con TypeORM!");
});

connectDB()
  .then(() => {
    initDB()
      .then(() => {
        routerApi(app);

        app.listen(PORT, () => {
          console.log(`Servidor iniciado en http://${HOST}:${PORT}`);
        });
      })
      .catch((error) => {
        console.error("Error al inicializar datos por defecto:", error);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.log("Error al conectar con la base de datos:", error);
    process.exit(1);
  });
