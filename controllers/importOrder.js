const ImportOrder = require('../models/importOrder');
const asyncHandler = require('express-async-handler');

// Lấy danh sách các đơn nhập hàng (Chỉ dành cho admin)
const getImportOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = 10; // Số lượng đơn nhập hàng trên mỗi trang
  const count = await ImportOrder.countDocuments({});
  const importOrders = await ImportOrder.find({})
    .populate('supplier', 'name') // Lấy thông tin nhà cung cấp
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  
  res.status(200).json({
    importOrders,
    page,
    pages: Math.ceil(count / pageSize),
  });
});

// Tạo một đơn nhập hàng mới (Chỉ dành cho admin)
const createImportOrder = asyncHandler(async (req, res) => {
  const { supplier, orderItems, totalCost } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'Không có sản phẩm để nhập hàng' });
  }

  const importOrder = new ImportOrder({
    supplier,
    orderItems,
    totalCost,
  });

  const createdImportOrder = await importOrder.save();
  res.status(201).json(createdImportOrder);
});

// Lấy thông tin chi tiết của một đơn nhập hàng (Chỉ dành cho admin)
const getImportOrderById = asyncHandler(async (req, res) => {
  const importOrder = await ImportOrder.findById(req.params.importOrderId)
    .populate('supplier', 'name')
    .populate('orderItems.product', 'name price');

  if (importOrder) {
    res.status(200).json(importOrder);
  } else {
    res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
  }
});

// Cập nhật thông tin đơn nhập hàng (Chỉ dành cho admin)
const updateImportOrder = asyncHandler(async (req, res) => {
  const importOrder = await ImportOrder.findById(req.params.importOrderId);

  if (importOrder) {
    importOrder.supplier = req.body.supplier || importOrder.supplier;
    importOrder.orderItems = req.body.orderItems || importOrder.orderItems;
    importOrder.totalCost = req.body.totalCost || importOrder.totalCost;

    const updatedImportOrder = await importOrder.save();
    res.status(200).json(updatedImportOrder);
  } else {
    res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
  }
});

// Xóa đơn nhập hàng (Chỉ dành cho admin)
const deleteImportOrder = asyncHandler(async (req, res) => {
  const importOrder = await ImportOrder.findById(req.params.importOrderId);

  if (importOrder) {
    await importOrder.remove();
    res.status(200).json({ message: 'Đơn nhập hàng đã được xóa' });
  } else {
    res.status(404).json({ message: 'Không tìm thấy đơn nhập hàng' });
  }
});

module.exports = {
  getImportOrders,
  createImportOrder,
  getImportOrderById,
  updateImportOrder,
  deleteImportOrder,
};
