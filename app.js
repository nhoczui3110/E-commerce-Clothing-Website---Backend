const express = require("express");
const mongoose = require("mongoose");
const productRoute = require("./routes/product");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type",
        "Authorization"
    );
    next();
});

app.use("/api", productRoute);

app.use((req, res, next) => {
    const err = new Error("Page not found!");
    err.status = 404;
    next(err);
});

app.use((error, req, res, next) => {
    const { status, message } = error;
    res.status(status ? status : 500).json({
        error: message,
    });
});

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect(DB_URI);
    app.listen(PORT, () => {
        console.log(`Example app listening on port ${PORT}`);
    });
}
