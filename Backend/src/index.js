import "dotenv/config";
import { connectDB } from "./config/configDb.js";
import initDB from "./config/initDB.js";
import { HOST, PORT } from "./config/configEnv.js";
import app from "./app.js"; // ✅ Usa el que ya configuraste

// Inicializa la conexión a la base de datos
connectDB()
  .then(() => {
    initDB()
      .then(() => {
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