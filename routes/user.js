const express = require("express");
const router = express.Router();
const {
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUserOrders,
} = require("../controllers/user");
// Middleware để bảo vệ route yêu cầu token
const authorization = require("../middlewares/authorization");
router.post("/register", registerUser);
router.get("/profile", authorization.verifyToken, getUserProfile);
router.put("/profile", authorization.verifyToken, updateUserProfile);
router.get("/orders", authorization.verifyToken, getUserOrders);

module.exports = router;
