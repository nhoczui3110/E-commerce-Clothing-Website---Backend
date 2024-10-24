const express = require("express");
const mongoose = require("mongoose");
const productRoute = require("./routes/product");
const categoryRoute = require("./routes/category");
const authRoute = require("./routes/auth");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const User = require("./models/user");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.DB_URI;

app.use(bodyParser.json());
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    // Nếu yêu cầu là preflight request (OPTIONS), trả về phản hồi thành công
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    next();
});

const upload = multer({
    storage: multer.diskStorage({
        destination: path.join(__dirname, "public/images"),
        filename: (req, file, cb) => {
            cb(null, Date.now() + path.extname(file.originalname));
        },
    }),
});

app.use(upload.array("img"));
app.use("/api", productRoute);
app.use("/api", categoryRoute);
app.use("/api", authRoute);

app.use((req, res, next) => {
    const err = new Error("Page not found!");
    err.status = 404;
    next(err);
});

app.use((error, req, res, next) => {
    const { status, msg } = error;
    res.status(status ? status : 500).json({
        error: msg,
    });
});

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect(DB_URI);
    // try {
    //     // Define the password to hash
    //     const plainPassword = "securePassword123"; // Choose a strong password
    //     const hashedPassword = await bcrypt.hash(plainPassword, 10);

    //     const adminUser = new User({
    //         name: "Admin User", // Set the admin's name
    //         email: "admin@example.com", // Set the admin's email
    //         password: hashedPassword, // Use the hashed password
    //         role: "Admin", // Set the role to Admin
    //         address: "123 Admin Street", // Admin's address (optional)
    //         phone: "123-456-7890", // Admin's phone number (optional)
    //         cart: [], // Empty cart
    //         orderHistory: [], // Empty order history
    //     });

    //     // Save the admin user to the database
    //     await adminUser.save();
    //     console.log("Admin user created successfully:", adminUser);
    // } catch (error) {
    //     console.error("Error creating admin user:", error);
    // }
    app.listen(PORT, () => {
        console.log(`Example app listening on port ${PORT}`);
    });
}
