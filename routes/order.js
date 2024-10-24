const express = require("express");
const router = express.Router();
const {
    createOrder,
    getOrderById,
    getUserOrders,
    updateOrderStatus,
    cancelOrder,
} = require("../controllers/order");
const authorization = require("../middlewares/authorization");

// POST /api/orders: Tạo đơn hàng mới từ giỏ hàng của người dùng
router.post("/", authorization.verifyToken, createOrder);

// GET /api/orders/:orderId: Lấy thông tin chi tiết của một đơn hàng cụ thể
router.get("/:orderId", authorization.verifyToken, getOrderById);

// GET /api/orders: Lấy danh sách tất cả đơn hàng của người dùng
router.get("/", authorization.verifyToken, getUserOrders);

// PUT /api/orders/:orderId: Cập nhật trạng thái đơn hàng (Chỉ dành cho admin)
router.put("/:orderId", authorization.verifyTokenAndAdmin, updateOrderStatus);

// DELETE /api/orders/:orderId: Hủy đơn hàng
router.delete("/:orderId", authorization.verifyToken, cancelOrder);

module.exports = router;
