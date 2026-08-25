const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Token de acceso requerido"
            });
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                message: "Formato de token inválido"
            });
        }

        const token = parts[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            id: decoded.userId,
            email: decoded.email
        };

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Token inválido o expirado"
        });
    }
}

module.exports = authenticateToken;