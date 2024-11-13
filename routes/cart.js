const express = require("express");
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
} = require("../controllers/cart");
const authorization = require("../middlewares/authorization");

router.get("/cart", authorization.verifyToken, getCart);
router.post("/cart", authorization.verifyToken, addToCart);
router.put("/cart/:cartItemId", authorization.verifyToken, updateCartItem);
router.delete("/cart/:cartItemId", authorization.verifyToken, removeFromCart);

module.exports = router;
