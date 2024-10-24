const express = require("express");
const { body } = require("express-validator");
const Category = require("../models/category");
const categoryController = require("../controllers/category");
const authorization = require("../middlewares/authorization");
const Product = require("../models/product");
const router = express.Router();

router.get("/category", categoryController.getCategories);

router.post(
    "/category",
    authorization.verifyTokenAndAdmin,
    [
        body("name")
            .trim()
            .isString()
            .notEmpty()
            .withMessage("Name is required")
            .custom(async (value) => {
                const nameCheck = await Category.findOne({ name: value });
                if (nameCheck) {
                    const error = new Error("Name must be unique");
                    error.status = 403;
                    throw error;
                }
                return true;
            }),
        body("slug")
            .trim()
            .isString()
            .notEmpty()
            .withMessage("Slug is required")
            .custom(async (value) => {
                const slugCheck = await Category.findOne({ slug: value });

                if (slugCheck) {
                    const error = new Error("Slug must be unique");
                    error.status = 403;
                    throw error;
                }
                return true;
            }),
    ],
    categoryController.postCategory
);

router.put(
    "/category/:slug",
    authorization.verifyTokenAndAdmin,
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
            .withMessage("Slug is required"),
    ],
    categoryController.putCategory
);

router.get("/category/:slug", categoryController.getCategory);
router.delete(
    "/category/:slug",
    authorization.verifyTokenAndAdmin,
    categoryController.deleteCategory
);
module.exports = router;
