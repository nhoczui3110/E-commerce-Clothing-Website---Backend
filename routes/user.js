const express = require("express");
const router = express.Router();
const {
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUserOrders,
    addNewAddress,
    setDefaultAddress,
    deleteAddress,
    updateAddress,
    getAddress,
    getRatings,
    ratingProduct,
} = require("../controllers/user");
// Middleware để bảo vệ route yêu cầu token
const authorization = require("../middlewares/authorization");
const { validateAddress } = require("../middlewares/validateAddress");
const {
    sendOtpToResetPassword,
    checkingResetPassword,
    confirmResetPassword,
} = require("../middlewares/resetPassword");
router.post("/users/register", registerUser);
router.get("/users/profile", authorization.verifyToken, getUserProfile);
router.put("/users/profile", authorization.verifyToken, updateUserProfile);
router.get("/users/orders", authorization.verifyToken, getUserOrders);
router.post(
    "/users/new-address",
    authorization.verifyToken,
    validateAddress,
    addNewAddress
);
router.get("/users/address", authorization.verifyToken, getAddress);
router.patch(
    "/users/address/set-default/:addressId",
    authorization.verifyToken,
    setDefaultAddress
);
router.delete(
    "/users/address/:addressId",
    authorization.verifyToken,
    deleteAddress
);
router.patch(
    "/users/address/:addressId",
    authorization.verifyToken,
    updateAddress
);

router.get("/users/get-ratings", authorization.verifyToken, getRatings);
router.post(
    "/users/rating-product/:productId",
    authorization.verifyToken,
    ratingProduct
);

router.post(
    "/users/request-change-password",
    authorization.verifyToken,
    checkingResetPassword,
    sendOtpToResetPassword
);

router.post(
    "/users/confirm-change-password",
    authorization.verifyToken,
    confirmResetPassword
);
module.exports = router;
