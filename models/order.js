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
    imageUrl: {
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
    payment: {
        type: Schema.Types.ObjectId,
        ref: "Payment",
    },
    transactionCode: {
        type: Schema.Types.ObjectId,
    },
    orderItems: [orderItemSchema], // Mảng chứa các sản phẩm trong đơn hàng
    shippingAddress: {
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
    orderDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ["Waiting", "Pending", "Shipped", "Delivered", "Cancelled"], // Trạng thái đơn hàng
        default: "Waiting",
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    deliveryDate: {
        type: Date,
    },
    totalCost: {
        type: Number,
        required: true,
    },
    shippingFee: {
        type: Number,
        required: true,
    },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
