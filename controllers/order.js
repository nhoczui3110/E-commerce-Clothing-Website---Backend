const Order = require('../models/order');
const User = require('../models/user');

// POST /api/orders: Tạo đơn hàng mới từ giỏ hàng của người dùng (Yêu cầu token)
const createOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.product');
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Kiểm tra nếu giỏ hàng rỗng
    if (user.cart.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Tạo các item trong đơn hàng từ giỏ hàng
    const orderItems = user.cart.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      size: item.size,
      color: item.color,
      image: item.product.variants.find(variant => variant.colorName === item.color).imageUrl[0]
    }));

    // Tạo đơn hàng mới
    const newOrder = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress: req.body.shippingAddress,
      status: 'Pending',
      isPaid: false,
    });

    await newOrder.save();

    // Xóa giỏ hàng sau khi tạo đơn hàng
    user.cart = [];
    await user.save();

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi tạo đơn hàng', error: err.message });
  }
};

// GET /api/orders/:orderId: Lấy thông tin chi tiết của một đơn hàng cụ thể (Yêu cầu token)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('orderItems.product');
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về người dùng này' });
    }
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin đơn hàng', error: err.message });
  }
};

// GET /api/orders: Lấy danh sách tất cả đơn hàng của người dùng (Yêu cầu token)
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('orderItems.product');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng', error: err.message });
  }
};

// PUT /api/orders/:orderId: Cập nhật trạng thái đơn hàng (Chỉ dành cho admin)
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  
  try {
    // Kiểm tra vai trò admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Chỉ admin mới có quyền cập nhật trạng thái đơn hàng' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công', order });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng', error: err.message });
  }
};

// DELETE /api/orders/:orderId: Hủy đơn hàng (Yêu cầu token)
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại hoặc không thuộc về người dùng này' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng ở trạng thái Pending' });
    }

    await order.remove();
    res.status(200).json({ message: 'Đơn hàng đã được hủy thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi hủy đơn hàng', error: err.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
};
