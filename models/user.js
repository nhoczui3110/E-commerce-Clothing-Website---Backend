const { Schema, model } = require("mongoose");

const userSchema = new Schema({
    name: {
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
    address: {
        type: String,
    },
    phone: {
        type: String,
    },
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
    ratings: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            rating: { type: Number, required: true, min: 1, max: 5 }, // Đánh giá từ 1-5
            comment: { type: String, required: true },
        },
    ],
});

const User = model("User", userSchema);
module.exports = User;
