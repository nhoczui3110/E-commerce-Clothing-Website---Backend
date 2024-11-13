const User = require("../models/user");
const sendOtp = require("../utility/sendOtp");
const bcrypt = require("bcrypt");
exports.checkingResetPassword = async (req, res, next) => {
    try {
        const { oldPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            const error = new Error("Can not found user!");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
            const error = new Error("Password not match");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        req.body.email = user.email;
        next();
    } catch (error) {
        console.log(error);
        return res.status(error.status || 500).json({ error: error.message });
    }
};

exports.sendOtpToResetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await sendOtp(email);
        return res.json({
            message: "Đã gửi mã OTP, vui lòng kiểm tra email của bạn!",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
};

exports.confirmResetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const user = await User.findById(req.user.id).populate("otp");
        if (!otp || otp !== user.otp.code || user.otp.expiresAt < Date.now()) {
            return res
                .status(400)
                .json({ message: "OTP không hợp lệ hoặc đã hết hạn" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        return res.json({
            message: "Thay đổi mật khẩu thành công",
        });
    } catch (error) {
        console.log(error);
        return res.status(error.status || 500).json({ error: error.message });
    }
};
