const express = require("express");
const mongoose = require("mongoose");
const productRoute = require("./routes/product");
const categoryRoute = require("./routes/category");
const authRoute = require("./routes/auth");
const cartRoute = require("./routes/cart");
const importOrderRoute = require("./routes/importOrder");
const paymentRoute = require("./routes/payment");
const orderRoute = require("./routes/order");
const userRoute = require("./routes/user");
const recommendationRoute = require("./routes/recommendation");
const configurationRoute = require("./routes/configuration");
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

app.use("/api/import-orders", importOrderRoute);
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
app.use("/api", importOrderRoute);
app.use("/api", authRoute);
app.use("/api", userRoute);
app.use("/api", cartRoute);
app.use("/api", orderRoute);
app.use("/api", paymentRoute);
app.use("/api", paymentRoute);
app.use("/api", recommendationRoute);
app.use("/api", configurationRoute);

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
    try {
        // Define the password to hash
        const user = await User.findOne({ email: "admin@example.com" });
        const customer = await User.findOne({
            email: "tranvietquang3110@gmail.com",
        });
        console.log(customer);
        if (!user) {
            const plainPassword = "123456789"; // Choose a strong password
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const adminUser = new User({
                firstName: "Admin User", // Set the admin's name
                lastName: "Admin User",
                email: "admin@example.com", // Set the admin's email
                password: hashedPassword, // Use the hashed password
                role: "Admin", // Set the role to Admin
                phone: "123-456-7890", // Admin's phone number (optional)
                cart: [], // Empty cart
                orderHistory: [], // Empty order history
                birthday: new Date(),
            });

            await adminUser.save();
            console.log("Admin user created successfully:", adminUser);
        }
        if (!customer) {
            const plainPassword = "123456789"; // Choose a strong password
            const hashedPassword = await bcrypt.hash(plainPassword, 10);

            const customerUser = new User({
                firstName: "Quang", // Set the admin's name
                lastName: "Tran",
                email: "tranvietquang3110@gmail.com", // Set the admin's email
                password: hashedPassword, // Use the hashed password
                role: "Customer", // Set the role to Admin
                phone: "0839504994", // Admin's phone number (optional)
                cart: [], // Empty cart
                orderHistory: [], // Empty order history
                birthday: new Date(),
            });

            await customerUser.save();
            console.log("Customer user created successfully:", customerUser);
        }
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
    app.listen(PORT, () => {
        console.log(`Example app listening on port ${PORT}`);
    });
}
