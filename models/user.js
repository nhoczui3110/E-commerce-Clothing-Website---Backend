const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    lastName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["Customer", "Admin"], // Enum cho vai trò người dùng
        default: "Customer",
    },
    address: [
        {
            lastName: {
                type: String,
                required: true,
            },
            firstName: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            isDefault: {
                type: Boolean,
                default: false,
            },
            city: {
                id: { type: String, required: true }, // Mã thành phố
                name: { type: String, required: true }, // Tên thành phố
            },
            district: {
                id: { type: String, required: true }, // Mã quận/huyện
                name: { type: String, required: true }, // Tên quận/huyện
            },
            ward: {
                id: { type: Number, required: true }, // Mã phường/xã
                name: { type: String, required: true }, // Tên phường/xã
            },
            street: { type: String },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    orderHistory: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    cart: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: { type: Number, required: true },
            size: { type: String, required: true }, // Kích cỡ đã chọn
            color: { type: String, required: true }, // Màu sắc đã chọn
        },
    ],
    gender: {
        type: Boolean,
        default: 0,
    },
    birthday: {
        type: Date,
    },
    ratings: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            isRated: {
                type: Boolean,
                default: false,
            },
            rating: { type: Number, min: 1, max: 5 }, // Đánh giá từ 1-5
            comment: {
                type: String,
            },
        },
    ],
    avatar: {
        type: String,
        default: "public/images/default-avatar.jpg",
    },
    otp: {
        code: String,
        expiresAt: Date,
    },
});

const User = model("User", userSchema);
module.exports = User;
