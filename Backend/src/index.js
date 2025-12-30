import "dotenv/config";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource, connectDB } from "./config/configDB.js";
import { routerApi, configureSocketIO } from "./routes/index.routes.js";
import { HOST, PORT } from "./config/configEnv.js";
import initDB from "./config/initDB.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(morgan("dev"));

// Configurar CORS: permitir orígenes desde variable de entorno FRONTEND_ORIGINS (separados por coma)
const allowedOrigins = process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(',').map(origin => origin.trim())
  : ["http://localhost:5173"];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.get("/", (req, res) => {
  res.send("¡Bienvenido a mi API REST con TypeORM!");
});

connectDB()
  .then(() => {
    initDB()
      .then(() => {
        routerApi(app);

        // Configurar Socket.io
        const httpServer = configureSocketIO(app);

        httpServer.listen(PORT, () => {
          console.log(`Servidor iniciado en http://${HOST}:${PORT}`);
          console.log(`🔌 WebSocket habilitado`);
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

