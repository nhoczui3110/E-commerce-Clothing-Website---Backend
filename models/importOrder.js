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
const importOrderSchema = new Schema({
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    orderItems: [orderItemSchema],
    totalCost: { type: Number, required: true },
    receivedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ImportOrder", importOrderSchema);
