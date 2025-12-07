import "dotenv/config";
import { connectDB } from "./config/configDb.js";
import { initDB } from "./config/initDb.js";
import { HOST, PORT } from "./config/configEnv.js";
import app from "./app.js";


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
