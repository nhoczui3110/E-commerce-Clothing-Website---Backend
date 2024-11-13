const Order = require("../models/order");
const Payment = require("../models/payment");
const Product = require("../models/product");
const User = require("../models/user");

// POST /api/orders: Tạo đơn hàng mới từ giỏ hàng của người dùng (Yêu cầu token)
const createOrder = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("cart.product");
        if (!user) {
            return res
                .status(404)
                .json({ message: "Người dùng không tồn tại" });
        }

        // Kiểm tra nếu giỏ hàng rỗng
        if (user.cart.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống" });
        }

        // Khởi tạo tổng chi phí
        let totalCost = 0;
        const orderItems = [];

        // Kiểm tra và cập nhật tồn kho
        for (const item of user.cart) {
            const product = item.product;
            const variant = product.variants.find(
                (v) => v.colorName.trim() === item.color.trim()
            );

            if (!variant) {
                return res
                    .status(400)
                    .json({ message: "Màu sản phẩm không tồn tại" });
            }

            const sizeOption = variant.size.find(
                (s) => s.sizeName === item.size
            );

            if (!sizeOption) {
                return res
                    .status(400)
                    .json({ message: "Kích thước sản phẩm không tồn tại" });
            }

            // Kiểm tra tồn kho
            if (sizeOption.stock < item.quantity) {
                return res.status(400).json({
                    message: `Không đủ tồn kho cho sản phẩm ${product.name} với kích thước ${item.size} và màu ${item.color}`,
                });
            }

            // Chuẩn bị thông tin đơn hàng và tính tổng chi phí
            const itemCost = item.quantity * product.price;
            totalCost += itemCost;

            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                price: product.price,
                size: item.size,
                color: item.color,
                imageUrl: variant.imageUrl,
            });
        }

        // Tạo đơn hàng mới với tổng chi phí
        const newOrder = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress: req.body.shippingAddress,
            status: "Waiting",
            isPaid: false,
            totalCost,
            shippingFee: req.body.shippingFee,
            shippingAddress: req.body.shippingAddress,
        });
        const newPayment = new Payment({
            user: req.user.id,
            order: newOrder._id,
            paymentMethod: req.body.paymentMethod, // Phương thức thanh toán
        });

        await newPayment.save();
        newOrder.payment = newPayment;
        await newOrder.save();

        // Trừ tồn kho cho từng sản phẩm trong giỏ hàng
        for (const item of user.cart) {
            const product = await Product.findById(item.product._id);
            const variant = product.variants.find(
                (v) => v.colorName.trim() === item.color.trim()
            );

            const sizeOption = variant.size.find(
                (s) => s.sizeName === item.size
            );

            // Cập nhật tồn kho
            sizeOption.stock -= item.quantity;
            await product.save();
        }

        // Xóa giỏ hàng sau khi tạo đơn hàng
        user.cart = [];
        await user.save();

        res.status(201).json(newOrder);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Lỗi khi tạo đơn hàng",
            error: err.message,
        });
    }
};

// GET /api/orders/:orderId: Lấy thông tin chi tiết của một đơn hàng cụ thể (Yêu cầu token)
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate("user")
            .populate("orderItems.product")
            .populate("payment"); // Thêm dòng này để populate thông tin payment

        if (!order) {
            return res.status(404).json({
                message:
                    "Đơn hàng không tồn tại hoặc không thuộc về người dùng này",
            });
        }

        res.status(200).json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Lỗi khi lấy thông tin đơn hàng",
        });
    }
};

// GET /api/orders: Lấy danh sách tất cả đơn hàng của người dùng (Yêu cầu token)
const getUserOrders = async (req, res) => {
    try {
        const status = req.query.status || null;
        console.log(status);
        let query = {};
        query.user = req.user.id;
        if (status) {
            query.status = status;
        }
        const orders = await Order.find(query)
            .sort({ orderDate: -1 })
            .populate("orderItems.product");
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi lấy danh sách đơn hàng",
            error: err.message,
        });
    }
};

const getOrders = async (req, res, next) => {
    try {
        const status = req.query.status || null;

        const fromDate = req.query.fromDate
            ? new Date(req.query.fromDate)
            : null;
        const toDate = req.query.toDate ? new Date(req.query.toDate) : null;
        const sortBy = req.query.sortBy || "orderDate";
        const order = req.query.order === "desc" ? -1 : 1;
        let query = {};

        if (status) query.status = status;
        if (fromDate && !isNaN(fromDate)) query.orderDate = { $gte: fromDate };
        if (toDate && !isNaN(toDate))
            query.orderDate = { ...query.orderDate, $lte: toDate };

        const quantity = 10;
        const page = parseInt(req.query.page) || 1;

        const skip = (page - 1) * quantity;

        const [orders, totalOrders] = await Promise.all([
            Order.find(query)
                .sort({ [sortBy]: order })
                .skip(skip)
                .limit(quantity)
                .populate("orderItems.product"),
            Order.countDocuments(query),
        ]);

        const totalPages = Math.ceil(totalOrders / quantity);
        return res.json({
            orders,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// PUT /api/orders/:orderId: Cập nhật trạng thái đơn hàng (Chỉ dành cho admin)
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    try {
        // Kiểm tra vai trò admin
        if (req.user.role !== "Admin") {
            return res.status(403).json({
                message: "Chỉ admin mới có quyền cập nhật trạng thái đơn hàng",
            });
        }

        const order = await Order.findById(req.params.orderId).populate(
            "payment user"
        );
        if (!order) {
            return res.status(404).json({ message: "Đơn hàng không tồn tại" });
        }
        if (order.status === "Cancelled" && status !== "Cancelled") {
            await reduceStockByOrderId(order._id);
        }
        order.status = status;
        if (order.status === "Delivered") {
            order.deliveryDate = new Date();
            order.isPaid = true;
            console.log(order);
            const user = order.user;
            order.orderItems.forEach((orderItem) => {
                let rating = {
                    product: orderItem.product,
                    isRated: false,
                };
                let isRated = user.ratings.some((r) => {
                    console.log(r.product, rating.product);
                    return r.product.toString() === rating.product.toString();
                });
                console.log(isRated);
                if (!isRated) {
                    user.ratings.push(rating);
                }
            });
            const payment = await Payment.findById(order.payment._id);
            payment.paidAt = new Date();
            await Promise.all([order.save(), payment.save(), user.save()]);
        } else if (order.status === "Cancelled") {
            await Promise.all([order.save(), reStockProductByOrder(order._id)]);
        } else {
            await order.save();
        }
        res.status(200).json({
            message: "Cập nhật trạng thái đơn hàng thành công",
            order,
        });
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi cập nhật trạng thái đơn hàng",
            error: err.message,
        });
    }
};

// DELETE /api/orders/:orderId: Hủy đơn hàng (Yêu cầu token)
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order || order.user.toString() !== req.user.id) {
            return res.status(404).json({
                message:
                    "Đơn hàng không tồn tại hoặc không thuộc về người dùng này",
            });
        }

        if (order.status !== "Pending" && order.status !== "Waiting") {
            return res.status(400).json({
                message:
                    "Chỉ có thể hủy đơn hàng ở trạng thái Pending, Waiting",
            });
        }

        await order.remove();
        res.status(200).json({ message: "Đơn hàng đã được hủy thành công" });
    } catch (err) {
        res.status(500).json({
            message: "Lỗi khi hủy đơn hàng",
            error: err.message,
        });
    }
};

const reStockProductByOrder = async (orderId) => {
    try {
        // Tìm đơn hàng theo orderId
        const order = await Order.findById(orderId).populate(
            "orderItems.product"
        );

        if (!order) {
            console.log("Đơn hàng không tồn tại");
            return; // Kết thúc hàm nếu không tìm thấy đơn hàng
        }

        // Khôi phục tồn kho cho từng sản phẩm trong đơn hàng
        for (const item of order.orderItems) {
            const product = item.product;
            const variant = product.variants.find(
                (v) => v.colorName.trim() === item.color.trim()
            );

            if (variant) {
                const sizeOption = variant.size.find(
                    (s) => s.sizeName === item.size
                );

                if (sizeOption) {
                    // Khôi phục tồn kho
                    sizeOption.stock += item.quantity;
                    await product.save(); // Lưu sản phẩm sau khi cập nhật tồn kho
                }
            }
        }

        // Xóa đơn hàng
        order.status = "Cancelled";
        await order.save();

        console.log("Khôi phục tồn kho và giỏ hàng thành công.");
    } catch (err) {
        console.error("Lỗi khi khôi phục tồn kho hoặc xóa đơn hàng:", err);
        throw new Error(
            "Lỗi khi xử lý giao dịch không thành công: " + err.message
        );
    }
};

const restoreCart = async (orderId) => {
    const order = await Order.findById(orderId).populate("orderItems.product");
    const user = await User.findById(order.user);
    if (user) {
        // Thêm lại các sản phẩm vào giỏ hàng
        for (const item of order.orderItems) {
            const product = item.product;
            const variant = product.variants.find(
                (v) => v.colorName.trim() === item.color.trim()
            );

            if (variant) {
                user.cart.push({
                    product: product._id,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color,
                });
            }
        }
        await user.save(); // Lưu lại giỏ hàng đã cập nhật
    }
};

const reduceStockByOrderId = async (orderId) => {
    try {
        // Tìm đơn hàng dựa trên orderId và lấy thông tin các sản phẩm trong đơn hàng
        const order = await Order.findById(orderId).populate(
            "orderItems.product"
        );

        if (!order) {
            throw new Error("Đơn hàng không tồn tại");
        }

        // Duyệt qua từng sản phẩm trong đơn hàng để giảm tồn kho
        for (const item of order.orderItems) {
            const product = item.product;
            const variant = product.variants.find(
                (v) => v.colorName.trim() === item.color.trim()
            );

            if (!variant) {
                throw new Error(`Không tìm thấy màu sản phẩm ${item.color}`);
            }

            const sizeOption = variant.size.find(
                (s) => s.sizeName === item.size
            );

            if (!sizeOption) {
                throw new Error(
                    `Không tìm thấy kích thước sản phẩm ${item.size}`
                );
            }

            // Kiểm tra tồn kho trước khi trừ
            if (sizeOption.stock < item.quantity) {
                throw new Error(
                    `Không đủ tồn kho cho sản phẩm ${product.name} với kích thước ${item.size} và màu ${item.color}`
                );
            }

            // Trừ tồn kho
            sizeOption.stock -= item.quantity;
            await product.save(); // Lưu thay đổi của sản phẩm
        }
        console.log("Tồn kho đã được cập nhật thành công.");
    } catch (error) {
        console.error("Lỗi khi trừ tồn kho:", error.message);
        throw error; // Ném lỗi để xử lý ở nơi gọi hàm, nếu cần
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    cancelOrder,
    getOrders,
    reStockProductByOrder,
    reduceStockByOrderId,
    restoreCart,
};
