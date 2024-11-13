const { body } = require("express-validator");

// Xác thực cho từng trường trong địa chỉ
const validateAddress = [
    body("lastName")
        .notEmpty()
        .withMessage('Trường "lastName" không được để trống')
        .isString()
        .withMessage('Trường "lastName" phải là chuỗi ký tự'),

    body("firstName")
        .notEmpty()
        .withMessage('Trường "firstName" không được để trống')
        .isString()
        .withMessage('Trường "firstName" phải là chuỗi ký tự'),

    body("phone")
        .notEmpty()
        .withMessage('Trường "phone" không được để trống')
        .isString()
        .withMessage('Trường "phone" phải là chuỗi ký tự')
        .isLength({ min: 10, max: 15 }) // Giới hạn độ dài hợp lệ cho số điện thoại
        .withMessage('Trường "phone" phải có độ dài từ 10 đến 15 ký tự'),

    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage('Trường "isDefault" phải là giá trị Boolean'),

    body("city.id")
        .notEmpty()
        .withMessage('Trường "city.id" không được để trống')
        .isString()
        .withMessage('Trường "city.id" phải là chuỗi ký tự'),

    body("city.name")
        .notEmpty()
        .withMessage('Trường "city.name" không được để trống')
        .isString()
        .withMessage('Trường "city.name" phải là chuỗi ký tự'),

    body("district.id")
        .notEmpty()
        .withMessage('Trường "district.id" không được để trống')
        .isString()
        .withMessage('Trường "district.id" phải là chuỗi ký tự'),

    body("district.name")
        .notEmpty()
        .withMessage('Trường "district.name" không được để trống')
        .isString()
        .withMessage('Trường "district.name" phải là chuỗi ký tự'),

    body("ward.id")
        .notEmpty()
        .withMessage('Trường "ward.id" không được để trống')
        .isNumeric()
        .withMessage('Trường "ward.id" phải là số'),

    body("ward.name")
        .notEmpty()
        .withMessage('Trường "ward.name" không được để trống')
        .isString()
        .withMessage('Trường "ward.name" phải là chuỗi ký tự'),

    body("street")
        .optional()
        .isString()
        .withMessage('Trường "street" phải là chuỗi ký tự nếu được cung cấp'),
];

module.exports = {
    validateAddress,
};
