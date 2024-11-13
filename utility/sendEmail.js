const nodemailer = require("nodemailer");
require("dotenv").config();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail({ email, subject, text }) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: text,
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        const err = new Error("Gửi Email thất bại");
        err.message = error.message;
        throw err;
    }
}

module.exports = sendEmail;
