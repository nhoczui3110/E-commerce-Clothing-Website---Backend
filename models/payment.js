const { Schema, model, default: mongoose } = require("mongoose");

const paymentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["VNPAY", "ByCash"], // Enum cho phương thức thanh toán
    },
    paidAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
