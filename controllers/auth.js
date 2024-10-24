const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    console.log(email, password);
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(403).json({ errors: errors.array() });
            return;
        }
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error("Can not found user!");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        const match = await bcrypt.compare(password, user.password);
        console.log(match);
        if (!match) {
            const error = new Error("Password not match");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }

        // Tạo JWT token với thời gian hết hạn là 1 giờ
        const expiresIn = 3600; // 1 giờ = 3600 giây
        const token = jwt.sign(
            { email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: expiresIn }
        );

        // Tính toán thời gian hết hạn (expiresAt)
        const expiresAt = Date.now() + expiresIn * 1000; // Thời gian hiện tại cộng thêm thời gian hết hạn (miliseconds)

        // Gửi JWT token và thời gian hết hạn về frontend
        res.cookie("authToken", token, {
            httpOnly: true,
            maxAge: expiresIn * 1000, // MaxAge của cookie (miliseconds)
            sameSite: "strict",
        });

        return res.status(200).json({
            jwt: token,
            expiresAt: expiresAt, // Thời gian hết hạn được gửi trong response
            msg: "Authentication successful",
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Logout route
exports.logout = (req, res) => {
    res.clearCookie("authToken", {
        httpOnly: true,
        sameSite: "strict", // CSRF protection
    });

    // Respond with a success message
    return res.status(200).json({
        msg: "Logged out successfully",
    });
};
