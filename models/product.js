const { Schema, model } = require("mongoose");

const sizeSchema = new Schema({
    sizeName: { type: String, required: true },
    stock: { type: Number, required: true },
});

const variantSchema = new Schema({
    colorName: {
        type: String,
        required: true,
    },
    size: [sizeSchema],
    imageUrl: { type: String },
    isUsed: { type: Boolean, default: true },
});

const productSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: Schema.Types.ObjectId, required: true, ref: "Category" }, // Ví dụ: "Áo", "Quần", "Phụ kiện"
    variants: [variantSchema],
    price: {
        type: Number,
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
    views: {
        type: Number,
        default: 0,
    },
    isUsed: { type: Boolean, default: true },
    reviews: [
        {
            user: { type: Schema.Types.ObjectId, ref: "User" },
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: { type: String },
        },
    ],
    averageRating: { type: Number, default: 0 },
});
const Product = model("Product", productSchema);
module.exports = Product;
