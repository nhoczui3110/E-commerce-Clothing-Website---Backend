const express = require("express");
const router = express.Router();
const {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    cancelOrder,
    getOrders,
} = require("../controllers/order");
const authorization = require("../middlewares/authorization");

// POST /api/orders: Tạo đơn hàng mới từ giỏ hàng của người dùng
router.post("/orders", authorization.verifyToken, createOrder);

// GET /api/orders/:orderId: Lấy thông tin chi tiết của một đơn hàng cụ thể
router.get("/orders/:orderId", authorization.verifyToken, getOrderById);

router.get("/orders-admin", authorization.verifyTokenAndAdmin, getOrders);

// GET /api/orders: Lấy danh sách tất cả đơn hàng của người dùng
router.get("/orders", authorization.verifyToken, getUserOrders);

// PUT /api/orders/:orderId: Cập nhật trạng thái đơn hàng (Chỉ dành cho admin)
router.put(
    "/orders/:orderId",
    authorization.verifyTokenAndAdmin,
    updateOrderStatus
);

// DELETE /api/orders/:orderId: Hủy đơn hàng
router.delete("/orders/:orderId", authorization.verifyToken, cancelOrder);

module.exports = router;
