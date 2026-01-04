"use strict";
import dotenv from "dotenv";

dotenv.config();

export const HOST = process.env.DB_HOST || process.env.HOST || "localhost";
export const PORT = process.env.PORT || 3000;
export const DB_PORT = process.env.DB_PORT || 5432;
export const DB_USERNAME = process.env.DB_USERNAME || process.env.DB_USER || "postgres";
export const PASSWORD = process.env.DB_PASSWORD;
export const DATABASE = process.env.DATABASE || process.env.DB_NAME;
export const JWT_SECRET = process.env.JWT_SECRET;
export const cookieKey = process.env.COOKIE_KEY;