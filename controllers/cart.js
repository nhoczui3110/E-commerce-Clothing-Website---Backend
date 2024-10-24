const User = require("../models/user");
const Product = require("../models/product");

// GET /api/cart: Lấy giỏ hàng của người dùng (Yêu cầu token)
const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("cart.product");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        res.status(200).json(user.cart);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi lấy giỏ hàng",
            error: err.message,
        });
    }
};

// POST /api/cart: Thêm sản phẩm vào giỏ hàng (Yêu cầu token)
const addToCart = async (req, res) => {
    const { productId, quantity, size, color } = req.body;

    try {
        const user = await User.findById(req.user.id);
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        const existingItemIndex = user.cart.findIndex(
            (item) =>
                item.product.toString() === productId &&
                item.size === size &&
                item.color === color
        );

        if (existingItemIndex >= 0) {
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            user.cart.push({ product: productId, quantity, size, color });
        }

        await user.save();
        res.status(200).json(user.cart);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi thêm sản phẩm vào giỏ hàng",
            error: err.message,
        });
    }
};

// PUT /api/cart/:cartItemId: Cập nhật số lượng sản phẩm trong giỏ hàng (Yêu cầu token)
const updateCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    try {
        const user = await User.findById(req.user.id);

        const cartItem = user.cart.id(cartItemId);
        if (!cartItem) {
            return res
                .status(404)
                .json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
        }

        cartItem.quantity = quantity;
        await user.save();

        res.status(200).json(user.cart);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi cập nhật giỏ hàng",
            error: err.message,
        });
    }
};

// DELETE /api/cart/:cartItemId: Xóa sản phẩm khỏi giỏ hàng (Yêu cầu token)
const removeFromCart = async (req, res) => {
    const { cartItemId } = req.params;

    try {
        const user = await User.findById(req.user.id);

        const cartItem = user.cart.id(cartItemId);
        if (!cartItem) {
            return res
                .status(404)
                .json({ message: "Sản phẩm không tồn tại trong giỏ hàng" });
        }

        cartItem.remove();
        await user.save();

        res.status(200).json(user.cart);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng",
            error: err.message,
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
};
