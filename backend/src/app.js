import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));

app.use(express.json({limit : "16kb"}))
app.use(urlencoded({limit : "16kb" , extended : true}))
app.use(express.static("public"));
app.use(cookieParser())

import userRoutes from "./routes/user.routes.js";
import FileRoutes from "./routes/files.routes.js";

app.use("/api/files", FileRoutes);
app.use("/api/users", userRoutes);

export {app};