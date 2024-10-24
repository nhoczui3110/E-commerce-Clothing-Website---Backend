const express = require("express");
const { body } = require("express-validator");
const auth = require("../controllers/auth");

const router = express.Router();

router.post(
    "/login",
    [
        body("email")
            .trim()
            .notEmpty()
            .isEmail()
            .withMessage("Email is not valid"),
        body("password")
            .trim()
            .notEmpty()
            .isString()
            .withMessage("Password is not valid"),
    ],
    auth.login
);

router.post("/logout", auth.logout);

module.exports = router;
