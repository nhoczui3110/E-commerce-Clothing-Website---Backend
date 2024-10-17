const { Schema, model } = require("mongoose");

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
        enum: ["PayPal", "Stripe", "CreditCard"], // Enum cho phương thức thanh toán
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["pending", "complete", "failed"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = model("Payment", paymentSchema);
