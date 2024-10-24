const { validationResult } = require("express-validator");
const Category = require("../models/category");
const Product = require("../models/product");
const ImportOrder = require("../models/importOrder");
const Order = require("../models/order");
const fs = require("fs");
const { error } = require("console");

exports.getProducts = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const quantity = 12;
    const categorySlugs = req.query.category
        ? req.query.category.split(",")
        : [];
    const skip = (page - 1) * quantity;
    const minPrice = req.query.minPrice
        ? parseFloat(req.query.minPrice)
        : undefined;
    const maxPrice = req.query.maxPrice
        ? parseFloat(req.query.maxPrice)
        : undefined;
    // Nhận tham số sắp xếp
    const sortBy = req.query.sortBy || "name"; // Mặc định sắp xếp theo tên
    const order = req.query.order === "desc" ? -1 : 1; // Mặc định sắp xếp tăng dần (asc)

    // Nhận tham số tìm kiếm
    const search = req.query.search ? req.query.search.trim() : ""; // Lấy từ khóa tìm kiếm

    try {
        if (minPrice !== undefined && isNaN(minPrice)) {
            const error = new Error("minPrice must be a number");
            error.msg = error.message;
            error.status = 400;
            throw error;
        }

        if (maxPrice !== undefined && isNaN(maxPrice)) {
            const error = new Error("maxPrice must be a number");
            error.msg = error.message;
            error.status = 400;
            throw error;
        }

        if (minPrice < 0 || (maxPrice !== undefined && maxPrice < minPrice)) {
            const error = new Error("Invalid price range");
            error.msg = error.message;
            error.status = 400;
            throw error;
        }

        let categoryIds = [];
        if (categorySlugs.length > 0) {
            const categories = await Category.find({
                slug: { $in: categorySlugs },
            });
            if (categories.length === 0) {
                const error = new Error("No categories found");
                error.status = 404;
                error.msg = error.message;
                throw error;
            }
            categoryIds = categories.map((category) => category._id); // Extract category IDs
        }

        const query = {
            ...(categoryIds.length > 0
                ? { category: { $in: categoryIds } }
                : {}), // Filter by multiple categories
            isUsed: true, // Ensure the product is available
        };

        // Thêm điều kiện tìm kiếm theo từ khóa vào query
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } }, // Tìm kiếm theo tên (không phân biệt chữ hoa/chữ thường)
                { description: { $regex: search, $options: "i" } }, // Tìm kiếm theo mô tả
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter = {};
            if (minPrice !== undefined) {
                priceFilter.$gte = minPrice; // Add minimum price condition
            }
            if (maxPrice !== undefined) {
                priceFilter.$lte = maxPrice; // Add maximum price condition
            }
            query.price = priceFilter; // Assign combined price filter
        }

        // Sắp xếp dựa theo sortBy và order
        const sortOptions = {};
        sortOptions[sortBy] = order;

        let products = await Product.find(query)
            .populate("category")
            .sort(sortOptions) // Sắp xếp dựa trên tham số sortOptions
            .skip(skip)
            .limit(quantity);

        // Filter the variants to only include used ones
        products = products.map((product) => {
            product.variants = product.variants.filter(
                (variant) => variant.isUsed
            );
            return product;
        });

        const totalProducts = await Product.countDocuments(query); // Get total count
        const totalPages = Math.ceil(totalProducts / quantity); // Calculate total pages

        res.json({
            currentPage: page,
            totalPages,
            totalProducts,
            products,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.postProducts = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(403).json({ errors: errors.array() });
        return;
    }
    req.body.variants = req.body.variants.map((item, index) => {
        const temp = JSON.parse(item);
        temp.size = temp.size.map((item) => {
            return { sizeName: item, stock: 0 };
        });
        img = req.files[index];
        temp.imageUrl = "public/images/" + img.filename;
        return temp;
    });
    const category = await Category.findOne({
        slug: req.body.category,
    });
    req.body.category = category;
    try {
        const productData = new Product({
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description,
            price: +req.body.price,
            category: req.body.category,
            variants: req.body.variants,
        });
        await Product.create(productData);
    } catch (error) {
        throw error;
    }
    return res.status(201).json({ msg: "product created successfully" });
};

exports.getProductDetail = async (req, res, next) => {
    const slug = req.params.slug.trim();
    try {
        let product = await Product.findOne({ slug, isUsed: true }).populate(
            "category"
        );
        if (product) {
            product.variants = product.variants.filter(
                (variant) => variant.isUsed
            );
            return res.json({ product });
        }
        const error = new Error("Product not found!");
        error.status = 404;
        error.msg = error.message;
        throw error;
    } catch (error) {
        next(error);
    }
};

exports.putProductDetail = async (req, res, next) => {
    const slug = req.params.slug.trim();
    const updateData = req.body;
    const updateCategorySlug = updateData.category;
    try {
        const category = await Category.findOne({ slug: updateCategorySlug });

        if (!category) {
            const error = new Error("Category not found!");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        updateData.category = category._id;
        const product = await Product.findOne({ slug });

        if (product) {
            // Xóa ảnh của các biến thể bị loại
            const currentVariants = product.variants;
            const newVariants = updateData.variants.map((item) =>
                typeof item === "string" ? JSON.parse(item) : item
            );

            const removedVariants = currentVariants.filter(
                (currentVariant) =>
                    !newVariants.some(
                        (newVariant) =>
                            newVariant.colorName === currentVariant.colorName
                    )
            );

            if (removedVariants && removedVariants.length > 0) {
                for (const variant of removedVariants) {
                    fs.unlink(variant.imageUrl, (error) => {
                        if (error) {
                            console.error(
                                `Failed to remove image ${variant.imageUrl}:`,
                                error
                            );
                        }
                    });
                }
            }
            updateData.variants = newVariants.map((item, index) => {
                let temp = item;
                temp.size = temp.size.map((sizeItem) => ({
                    sizeName: sizeItem,
                    stock: 0,
                }));
                temp.colorName = item.colorName;
                const imgs = req.files;

                if (imgs.length > 0) {
                    let isFound = false;
                    imgs.forEach(async (img) => {
                        const match = img.originalname.match(/variant-(\d+)/);
                        const variantIndex = match ? +match[1] : null;
                        if (index === variantIndex) {
                            // Check if there is an old image and remove it
                            product.variants.forEach((variant) => {
                                if (
                                    variant.colorName === temp.colorName &&
                                    variant.imageUrl
                                ) {
                                    fs.unlink(variant.imageUrl, (err) => {
                                        if (err) {
                                            console.error(
                                                `Failed to remove image ${variant.imageUrl}:`,
                                                err
                                            );
                                        }
                                        console.log(
                                            `Removed image: ${variant.imageUrl}`
                                        );
                                    });
                                }
                            });

                            // Assign the new image URL
                            temp.imageUrl = "public/images/" + img.filename;
                            isFound = true;
                        }
                    });

                    if (!isFound) {
                        // If no new image found for this variant, use the old one
                        product.variants.forEach((variant) => {
                            if (variant.colorName === temp.colorName) {
                                temp.imageUrl = variant.imageUrl;
                            }
                        });
                    }
                } else {
                    // No new images provided, keep old ones
                    product.variants.forEach((variant) => {
                        if (variant.colorName === temp.colorName) {
                            temp.imageUrl = variant.imageUrl;
                        }
                    });
                }
                return temp;
            });

            // Cập nhật lại biến thể với hình ảnh mới

            // Cập nhật sản phẩm
            const updatedProduct = await Product.findOneAndUpdate(
                { slug },
                { $set: updateData },
                { new: true }
            );

            return res.status(200).json({
                msg: "Product updated successfully",
                product: updatedProduct,
            });
        }
        const error = new Error("Product not found!");
        error.status = 404;
        error.msg = error.message;
        throw error;
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    const slug = req.params.slug.trim();
    try {
        const product = await Product.findOne({ slug });
        const productId = product._id;
        if (!product) {
            const error = new Error("Product not found");
            error.status = 404;
            error.msg = error.message;
            throw error;
        }
        const orderWithProduct = await Order.find({
            "orderItems.product": productId,
        });
        const importOrderWithProduct = await ImportOrder.find({
            "orderItems.product": productId,
        });
        if (orderWithProduct.length > 0 || importOrderWithProduct.length > 0) {
            console.log(importOrderWithProduct);
            product.isUsed = false;
            const result = await product.save();
            return res.status(200).json({
                msg: "Delete was successful!",
            });
        }
        for (const variant of product.variants) {
            fs.unlink(variant.imageUrl, (error) => {
                console.error(
                    `Failed to remove image ${variant.imageUrl}:`,
                    error
                );
            });
            console.log(`Removed image: ${variant.imageUrl}`);
        }

        // Delete product from the database
        await Product.deleteOne({ slug });
        return res.status(200).json({
            msg: "Delete was successful!",
        });
    } catch (error) {
        next(error);
    }
};
