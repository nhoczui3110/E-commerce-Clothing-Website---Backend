const User = require("../models/user");
const generateOTP = require("./otpGenerator");
const sendEmail = require("./sendEmail");
require("dotenv").config();
async function sendOtp(email) {
    try {
        const otp = generateOTP();
        console.log(email);
        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error("Không tìm thấy user");
            throw err;
        }
        user.otp.code = otp;
        user.otp.expiresAt =
            Date.now() + process.env.OTP_EXPIRATION * 60 * 1000;
        Promise.all([
            user.save(),
            sendEmail({
                email,
                subject: "Mã OTP đổi mật khẩu",
                text: `Mã OTP của bạn là: ${otp}`,
            }),
        ]);
    } catch (error) {
        throw error;
    }
}

module.exports = sendOtp;
