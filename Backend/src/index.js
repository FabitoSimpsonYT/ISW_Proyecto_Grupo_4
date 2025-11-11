import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { AppDataSource, connectDB } from "./config/configDb.js";
import { routerApi } from "./routes/index.routes.js";
import { HOST, PORT } from "./config/configEnv.js";
import initDB from "./config/initDB.js";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("¡Bienvenido a mi API REST con TypeORM!");
});

app.use((req, res, next) => {
  console.log(`\n[REQUEST] ${req.method} ${req.path}`);
  console.log(`Headers:`, req.headers);
  if (Object.keys(req.body).length > 0) {
    console.log(`Body:`, req.body);
  }
  next();
});

connectDB()
  .then(() => {
    initDB()
      .then(() => {
        routerApi(app);

        app.use((err, req, res, next) => {
          console.error("\n[ERROR] ERROR EN LA PETICIÓN:");
          console.error(`Método: ${req.method}`);
          console.error(`URL: ${req.path}`);
          console.error(`Error:`, err.message);
          console.error(`Stack:`, err.stack);
          
          res.status(err.status || 500).json({
            success: false,
            message: err.message || 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? err : {}
          });
        });

        app.use((req, res) => {
          console.warn(`\n[WARN] RUTA NO ENCONTRADA: ${req.method} ${req.path}`);
          res.status(404).json({
            success: false,
            message: `Ruta no encontrada: ${req.path}`
          });
        });

        app.listen(PORT, () => {
          console.log(`\n[OK] Servidor iniciado en http://${HOST}:${PORT}`);
          console.log(`[READY] Ready to accept connections\n`);
        });
      })
      .catch((error) => {
        console.error("[ERROR] Error al inicializar datos por defecto:", error);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.error("[ERROR] Error al conectar con la base de datos:", error);
    process.exit(1);
  });
