const express = require("express");
const router = express.Router();
const importOrderController = require("../controllers/importOrder");
router.get("/import-orders", importOrderController.getImportOrders);
router.get(
    "/import-orders/:importOrderId",
    importOrderController.getImportOrderById
);
router.post("/import-orders", importOrderController.createImportOrder);
router.patch(
    "/import-orders/:importOrderId",
    importOrderController.updateImportOrder
);
router.delete(
    "/import-orders/:importOrderId",
    importOrderController.deleteImportOrder
);
module.exports = router;
