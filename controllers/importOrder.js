const { default: mongoose } = require("mongoose");
const ImportOrder = require("../models/importOrder");
const Product = require("../models/product");

// Lấy danh sách các đơn nhập hàng (Chỉ dành cho admin)
const getImportOrders = async (req, res) => {
    const page = Number(req.query.page) || 1;
    const pageSize = 10; // Số lượng đơn nhập hàng trên mỗi trang
    const sortBy = req.query.sortBy || "receivedAt";
    const order = req.query.order === "desc" ? -1 : 1;
    const status = req.query.status;

    // Lấy các tham số từ ngày
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
    const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

    // Tạo điều kiện truy vấn
    const filter = {};
    if (fromDate) {
        filter.createdAt = { $gte: fromDate }; // Lớn hơn hoặc bằng fromDate
    }
    if (toDate) {
        filter.createdAt = { ...filter.createdAt, $lte: toDate }; // Nhỏ hơn hoặc bằng toDate
    }
    if (status) {
        filter.status = status;
    }
    // Tính toán tổng số tài liệu
    const count = await ImportOrder.countDocuments(filter);

    // Truy vấn các đơn nhập hàng
    const importOrders = await ImportOrder.find(filter)
        .populate("orderItems.product")
        .sort({ [sortBy]: order })
        .skip(pageSize * (page - 1))
        .limit(pageSize);

    res.status(200).json({
        importOrders,
        currentPage: page,
        totalPages: Math.ceil(count / pageSize),
    });
};

// Tạo một đơn nhập hàng mới (Chỉ dành cho admin)
const createImportOrder = async (req, res) => {
    const { orderItems, totalCost } = req.body;

    if (!orderItems || orderItems.length === 0) {
        return res
            .status(400)
            .json({ message: "Không có sản phẩm để nhập hàng" });
    }

    const importOrder = new ImportOrder({
        orderItems,
        totalCost,
    });

    const createdImportOrder = await importOrder.save();
    res.status(201).json(createdImportOrder);
};

// Lấy thông tin chi tiết của một đơn nhập hàng (Chỉ dành cho admin)
const getImportOrderById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.importOrderId)) {
            return res.status(400).json({ message: "ID không hợp lệ" });
        }
        const importOrder = await ImportOrder.findById(
            req.params.importOrderId
        );

        if (importOrder) {
            res.status(200).json(importOrder);
        } else {
            res.status(404).json({ message: "Không tìm thấy đơn nhập hàng" });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Cập nhật thông tin đơn nhập hàng (Chỉ dành cho admin)
const updateImportOrder = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.importOrderId)) {
            return res.status(400).json({ message: "ID không hợp lệ" });
        }
        const importOrder = await ImportOrder.findById(
            req.params.importOrderId
        );
        if (!importOrder) {
            return res
                .status(404)
                .json({ message: "Không tìm thấy đơn nhập hàng" });
        }

        // Nếu status đã là "Complete", không cho phép chỉnh sửa
        if (importOrder.status === "Complete") {
            return res.status(400).json({
                message: "Không thể chỉnh sửa đơn hàng đã hoàn thành",
            });
        }

        // Cập nhật các trường của đơn hàng nếu status chưa là "Complete"
        importOrder.supplier = req.body.supplier || importOrder.supplier;
        importOrder.orderItems = req.body.orderItems || importOrder.orderItems;
        importOrder.totalCost = req.body.totalCost || importOrder.totalCost;
        importOrder.status = req.body.status || importOrder.status;

        // Kiểm tra nếu status được cập nhật thành "Complete"
        if (req.body.status === "Complete") {
            importOrder.receivedAt = new Date();
            for (const item of importOrder.orderItems) {
                const product = await Product.findById(item.product);
                if (product) {
                    // Tìm màu sắc phù hợp trong product's variants
                    const variant = product.variants.find(
                        (variant) => variant.colorName === item.color
                    );
                    if (variant) {
                        // Tìm kích cỡ phù hợp trong màu sắc
                        const size = variant.size.find(
                            (s) => s.sizeName === item.size
                        );
                        if (size) {
                            // Cập nhật stock của kích cỡ đó
                            size.stock += item.quantity;
                        }
                    }
                    await product.save(); // Lưu cập nhật trong product
                }
            }
        }

        // Lưu cập nhật trong đơn hàng
        const updatedImportOrder = await importOrder.save();
        res.status(200).json(updatedImportOrder);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// Xóa đơn nhập hàng (Chỉ dành cho admin)
const deleteImportOrder = async (req, res) => {
    const importOrder = await ImportOrder.findById(req.params.importOrderId);

    if (importOrder) {
        await importOrder.remove();
        res.status(200).json({ message: "Đơn nhập hàng đã được xóa" });
    } else {
        res.status(404).json({ message: "Không tìm thấy đơn nhập hàng" });
    }
};

module.exports = {
    getImportOrders,
    createImportOrder,
    getImportOrderById,
    updateImportOrder,
    deleteImportOrder,
};
