const User = require("../models/user");
const Order = require("../models/order"); // Để lấy thông tin lịch sử đơn hàng
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /api/users/register: Đăng ký tài khoản người dùng mới
const registerUser = async (req, res) => {
    const { name, email, password, address, phone } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            address,
            phone,
        });

        await newUser.save();

        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi đăng ký tài khoản",
            error: err.message,
        });
    }
};

// GET /api/users/profile: Lấy thông tin cá nhân của người dùng (Yêu cầu token)
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi lấy thông tin người dùng",
            error: err.message,
        });
    }
};

// PUT /api/users/profile: Cập nhật thông tin cá nhân của người dùng (Yêu cầu token)
const updateUserProfile = async (req, res) => {
    const { name, email, address, phone, password } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.address = address || user.address;
        user.phone = phone || user.phone;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi cập nhật thông tin người dùng",
            error: err.message,
        });
    }
};

// GET /api/users/orders: Lấy lịch sử đơn hàng của người dùng (Yêu cầu token)
const getUserOrders = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("orderHistory");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        res.status(200).json(user.orderHistory);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi lấy lịch sử đơn hàng",
            error: err.message,
        });
    }
};

module.exports = {
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUserOrders,
};
