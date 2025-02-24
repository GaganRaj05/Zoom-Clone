require("dotenv").config()
const express = require('express');
const connectToDb = require("./config/db");
const router = require("./routes/auth")
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(cookieParser())
app.use(helmet())
app.use(express.json())
app.use(morgan("dev"))
app.use("/app",router);

connectToDb(process.env.MONGODB_URI)


app.listen(process.env.PORT,()=>console.log("Server started at port:"+process.env.PORT))
