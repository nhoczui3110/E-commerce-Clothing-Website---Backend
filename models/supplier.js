const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const supplierSchema = new Schema({
    name: { type: String, required: true },
    contactInfo: {
        phone: { type: String },
        email: { type: String },
        address: {
            type: String,
        },
    },
    productsSupplied: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Supplier", supplierSchema);
