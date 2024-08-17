import express from "express";
import db from "./utils/database";
import routes from "./routes";
import path from "path";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
db();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", routes);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "utils", "mail", "templates"));

// Other middleware and routes...

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
