import dotenv from "dotenv";

dotenv.config();
export const SECRET: string =
  process.env.SECRET || "12345678901234567890123456789012";
export const CLOUDINARY_API_KEY: string =
  process.env.CLOUDINARY_API_KEY || "871559436218237";
export const CLOUDINARY_API_SECRET: string =
  process.env.CLOUDINARY_API_SECRET || "qTAjppTfEjSeed7jpqTw24yUkL8";
export const CLOUDINARY_CLOUD_NAME: string =
  process.env.CLOUDINARY_CLOUD_NAME || "dcbxti8yq";
export const DATABASE_URL: string =
  process.env.DATABASE_URL || "mongodb://localhost:27017";
