const express = require("express");
const router = express.Router();

const productController = require("../controllers/product");
const { body } = require("express-validator");
const Product = require("../models/product");
const Category = require("../models/category");
const authorization = require("../middlewares/authorization");

// /api/products
router.get("/products", productController.getProducts);
router.post(
    "/products",

    [
        body("name")
            .trim()
            .isString()
            .notEmpty()
            .withMessage("Name is required"),
        body("slug")
            .trim()
            .isString()
            .notEmpty()
            .withMessage("Slug is required")
            .custom(async (value) => {
                const existingProduct = await Product.findOne({ slug: value });
                if (existingProduct) {
                    const error = new Error("Slug must be unique");
                    error.status = 403;
                    throw error;
                }
                return true;
            }),
        body("description").trim().optional().isString(),
        body("category")
            .trim()
            .notEmpty()
            .withMessage("Category is required")
            .custom(async (value) => {
                const existingCategory = await Category.findOne({
                    slug: value,
                });
                if (!existingCategory) {
                    const error = new Error("Category not exist!");
                    error.status = 403;
                    throw error;
                }
                return true;
            })
            .withMessage("Category must be a valid ObjectId"),
        body("variants").custom((variants) => {
            console.log(variants);
            variants = variants.map((variant) => {
                return JSON.parse(variant);
            });
            if (!variants.length) {
                throw new Error("At least one variant is required");
            }
            variants.forEach((variant, index) => {
                if (
                    !variant.colorName ||
                    typeof variant.colorName !== "string"
                ) {
                    throw new Error(
                        `Variant at index ${index} must have a valid colorName`
                    );
                }
                if (!Array.isArray(variant.size) || variant.size.length === 0) {
                    throw new Error(
                        `Variant at index ${index} must have a valid size array`
                    );
                }
                variant.size.forEach((size, sizeIndex) => {
                    if (typeof size !== "string") {
                        throw new Error(
                            `Size at index ${sizeIndex} in variant ${index} must have a valid sizeName`
                        );
                    }
                });
            });
            return true;
        }),
        body("price")
            .isNumeric()
            .withMessage("Price is required and must be a number")
            .notEmpty(),
    ],
    productController.postProducts
);
router.get("/products/:slug", productController.getProductDetail);
router.put("/products/:slug", productController.putProductDetail);
router.delete(
    "/products/:slug",
    authorization.verifyTokenAndAdmin,
    productController.deleteProduct
);
module.exports = router;
