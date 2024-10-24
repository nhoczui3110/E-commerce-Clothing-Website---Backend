const express = require("express");
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
} = require("../controllers/cart");
const authorization = require("../middlewares/authorization");

router.get("/", authorization.verifyToken, getCart);
router.post("/", authorization.verifyToken, addToCart);
router.put("/:cartItemId", authorization.verifyToken, updateCartItem);
router.delete("/:cartItemId", authorization.verifyToken, removeFromCart);

module.exports = router;
