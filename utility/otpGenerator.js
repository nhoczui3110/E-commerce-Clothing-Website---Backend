function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Kết quả sẽ là số từ 1000 đến 9999
}

module.exports = generateOTP;
