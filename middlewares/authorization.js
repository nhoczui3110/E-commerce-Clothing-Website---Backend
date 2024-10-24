const jwt = require("jsonwebtoken");

exports.verifyTokenAndAdmin = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res
            .status(401)
            .json({ msg: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded; // Attach user payload to the    request
        // Check if the user has the role of admin
        if (req.user.role !== "Admin") {
            return res.status(403).json({ msg: "Access denied. Admins only." });
        }

        // If everything is good, allow the request to proceed
        next();
    } catch (error) {
        return res.status(400).json({ message: "Invalid token." });
    }
};

exports.verifyToken = (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
        return res
            .status(401)
            .json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded; // Attach user payload to the    request
        next();
    } catch (error) {
        return res.status(400).json({ error: "Invalid token." });
    }
};
