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
