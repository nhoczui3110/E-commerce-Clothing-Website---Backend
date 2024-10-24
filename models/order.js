const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    size: {
        type: String,
    },
    color: {
        type: String,
    },
    image: {
        type: String,
    },
});

// Tạo schema cho đơn hàng
const orderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User", // Liên kết với người dùng
        required: true,
    },
    orderItems: [orderItemSchema], // Mảng chứa các sản phẩm trong đơn hàng
    shippingAddress: { type: String },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled"], // Trạng thái đơn hàng
        default: "Pending",
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    paidAt: {
        type: Date,
    },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
