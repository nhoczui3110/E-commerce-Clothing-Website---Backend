const { validationResult } = require("express-validator");
const Category = require("../models/category");
const Product = require("../models/product");

exports.postCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(403).json({ errors: errors.array() });
        return;
    }
    const { name, slug } = req.body;
    try {
        await Category.create({ name, slug });
        return res.json({ msg: "Created Category Success" });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        return res.json({ categories });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.putCategory = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(403).json({ errors: errors.array() });
        return;
    }

    const { name, slug } = req.body;

    try {
        // Find the category to be updated
        const existingCategory = await Category.findOne({
            slug: req.params.slug,
        });

        if (!existingCategory) {
            const error = new Error("Category not found");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }

        const conflictingCategory = await Category.findOne({
            $or: [{ name }, { slug }],
            _id: { $ne: existingCategory._id }, // Exclude the current category from the check
        });

        if (conflictingCategory) {
            return res.status(409).json({
                message: "Name or slug already exists in another category",
            });
        }

        const updateData = { name, slug };
        const updatedCategory = await Category.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: updateData },
            { new: true }
        );

        return res.json({ category: updatedCategory });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        const slug = req.params.slug.trim();
        const category = await Category.findOne({ slug });

        if (!category) {
            const error = new Error("Category not found");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        const product = await Product.findOne({ category: category._id });
        if (product) {
            const error = new Error(
                "Cannot delete category that has associated products."
            );
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        await Category.deleteOne({ slug });
        return res.json({ category });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.getCategory = async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const category = await Category.findOne({ slug });
        if (!category) {
            const error = new Error("Category not found");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        return res.json({ category });
    } catch (error) {
        console.log(error);
        next(error);
    }
};
