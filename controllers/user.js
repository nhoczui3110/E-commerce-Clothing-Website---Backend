const User = require("../models/user");
const Order = require("../models/order"); // Để lấy thông tin lịch sử đơn hàng
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { validationResult } = require("express-validator");
const Product = require("../models/product");
// POST /api/users/register: Đăng ký tài khoản người dùng mới
const registerUser = async (req, res) => {
    const {
        lastName,
        firstName,
        email,
        password,
        address,
        phone,
        gender,
        birthday,
    } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            lastName,
            firstName,
            email,
            password: hashedPassword,
            phone,
            address,
            gender,
            birthday: new Date(birthday),
            address: [],
        });

        await newUser.save();

        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi đăng ký tài khoản",
            error: err.message,
        });
    }
};

// GET /api/users/profile: Lấy thông tin cá nhân của người dùng (Yêu cầu token)
const getUserProfile = async (req, res) => {
    try {
        console.log(req.user);
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi lấy thông tin người dùng",
            error: err.message,
        });
    }
};

// PUT /api/users/profile: Cập nhật thông tin cá nhân của người dùng (Yêu cầu token)
const updateUserProfile = async (req, res) => {
    console.log(req.files.length);
    const { lastName, firstName, gender, phone, birthday } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        user.lastName = lastName || user.lastName;
        user.firstName = firstName || user.firstName;
        user.gender = +gender || user.gender;
        user.phone = phone || user.phone;
        user.birthday = birthday ? new Date(birthday) : user.birthday;
        if (req.files.length > 0) {
            if (user.avatar !== "public/images/default-avatar.jpg") {
                fs.unlink(user.avatar, (err) => {
                    if (err) {
                        console.error("Lỗi khi xóa ảnh cũ:", err);
                    }
                });
            }
            user.avatar = "public/images/" + req.files[0]?.filename;
        }
        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi cập nhật thông tin người dùng",
            error: err.message,
        });
    }
};

// GET /api/users/orders: Lấy lịch sử đơn hàng của người dùng (Yêu cầu token)
const getUserOrders = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("orderHistory");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        res.status(200).json(user.orderHistory);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi lấy lịch sử đơn hàng",
            error: err.message,
        });
    }
};

const addNewAddress = async (req, res) => {
    // Kiểm tra kết quả của quá trình xác thực

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res
            .status(400)
            .json({ message: "Dữ liệu không hợp lệ", errors: errors.array() });
    }
    try {
        const newAddress = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }
        console.log(user.address);
        user.address.push(newAddress);
        await user.save();

        res.status(200).json({
            message: "Địa chỉ đã được thêm thành công",
            user,
        });
    } catch (error) {
        console.error("Lỗi khi thêm địa chỉ:", error);
        res.status(500).json({
            message: "Đã xảy ra lỗi khi thêm địa chỉ",
            error,
        });
    }
};
const setDefaultAddress = async (req, res) => {
    try {
        // Tìm người dùng theo userId
        const user = await User.findById(req.user.id);

        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        // Cập nhật địa chỉ mặc định
        const addressToUpdate = user.address.id(req.params.addressId);

        if (!addressToUpdate) {
            throw new Error("Address not found");
        }

        // Đặt địa chỉ này là mặc định
        user.address.forEach((address) => {
            address.isDefault = false; // Đặt tất cả các địa chỉ khác thành không mặc định
        });
        addressToUpdate.isDefault = true; // Đặt địa chỉ cụ thể thành mặc định

        // Lưu lại thay đổi
        await user.save();

        return res.json({
            message: "Default address updated successfully",
            address: user.address,
        });
    } catch (error) {
        return res.status(404).json({ error: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        // Tìm người dùng theo userId
        const user = await User.findById(req.user.id);

        if (!user) {
            const error = new Error("User not found");
            error.msg = error.message;
            error.status = 400;
            throw error;
        }
        console.log(req.params.addressId);
        // Tìm địa chỉ cần xóa theo addressId
        const addressIndex = user.address.findIndex(
            (addr) => addr._id.toString() === req.params.addressId
        );
        if (addressIndex === -1) {
            const error = new Error("Address not found");
            error.msg = error.message;
            error.status = 400;
            throw error;
        }

        // Kiểm tra nếu địa chỉ cần xóa là địa chỉ mặc định
        const isDefault = user.address[addressIndex].isDefault;

        // Xóa địa chỉ
        user.address.splice(addressIndex, 1);

        // Nếu địa chỉ xóa là địa chỉ mặc định, thiết lập một địa chỉ khác làm mặc định
        if (isDefault) {
            // Tìm địa chỉ đầu tiên không phải là mặc định
            const newDefaultAddress = user.address.find(
                (addr) => !addr.isDefault
            );
            if (newDefaultAddress) {
                newDefaultAddress.isDefault = true; // Đặt địa chỉ này làm mặc định
            }
        }

        // Lưu lại thay đổi
        await user.save();

        return res.json({
            message: "Address deleted successfully",
            address: user.address,
        });
    } catch (error) {
        console.log(error);
        res.json(400).json({ error });
    }
};

const updateAddress = async (req, res, next) => {
    try {
        // Tìm người dùng theo userId
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Tìm địa chỉ theo addressId
        const address = user.address.id(req.params.addressId);
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Cập nhật thông tin địa chỉ
        address.firstName =
            req.body.firstName !== undefined
                ? req.body.firstName
                : address.firstName;
        address.lastName =
            req.body.lastName !== undefined
                ? req.body.lastName
                : address.lastName;
        address.phone =
            req.body.phone !== undefined ? req.body.phone : address.phone;
        address.city =
            req.body.city !== undefined ? req.body.city : address.city;
        address.district =
            req.body.district !== undefined
                ? req.body.district
                : address.district;
        address.ward =
            req.body.ward !== undefined ? req.body.ward : address.ward;
        address.street =
            req.body.street !== undefined ? req.body.street : address.street;
        address.isDefault =
            req.body.isDefault !== undefined
                ? req.body.isDefault
                : address.isDefault;

        // Lưu lại thay đổi
        await user.save();

        return res.json({
            message: "Address updated successfully",
            address: address, // Trả về địa chỉ cụ thể đã cập nhật
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const getAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const address = user.address;
        return res.status(200).json({ address }); // Sửa ở đây
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};

const getRatings = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: "ratings.product",
            populate: {
                path: "category",
            },
        });
        const isRated = req.query.isRated ? true : false;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const ratings = user.ratings.filter(
            (rating) => rating.isRated === isRated
        );
        return res.json(ratings);
    } catch (error) {
        console.error("Error fetching ratings:", error); // Ghi lại lỗi
        return res.status(500).json({ error: "Internal server error" });
    }
};

const ratingProduct = async (req, res) => {
    try {
        const rating = req.body.rating;
        const comment = req.body.comment;
        const productId = req.params.productId;
        if (!rating || !comment || !productId) {
            return res.status(400).json({ error: "Yêu cầu rating, comment" });
        }
        const [user, product] = await Promise.all([
            User.findById(req.user.id),
            Product.findById(productId),
        ]);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        const ratingIndex = user.ratings.findIndex((rating) => {
            return rating.product.toString() === productId;
        });
        const productReviewIndex = product.reviews.findIndex(
            (review) => review.user.toString() === user._id.toString()
        );
        if (ratingIndex === -1) {
            return res.status(400).json({
                error: "Người dùng không có quyền đánh giá sản phẩm này",
            });
        }

        user.ratings[ratingIndex].isRated = true;
        user.ratings[ratingIndex].rating = rating;
        user.ratings[ratingIndex].comment = comment;
        if (productReviewIndex !== -1) {
            // Ghi đè đánh giá cũ
            product.reviews[productReviewIndex].rating = rating;
            product.reviews[productReviewIndex].comment = comment;
        } else {
            // Thêm mới nếu chưa có đánh giá
            product.reviews.push({
                user: user._id,
                rating,
                comment,
            });
        }
        const totalRatings = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
        );
        product.averageRating = totalRatings / product.reviews.length;
        await Promise.all([user.save(), product.save()]);
        res.json({ message: "Đánh giá sản phẩm thành công" });
    } catch (error) {
        console.error("Error fetching ratings:", error); // Ghi lại lỗi
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    addNewAddress,
    setDefaultAddress,
    deleteAddress,
    updateAddress,
    getAddress,
    getRatings,
    ratingProduct,
};
