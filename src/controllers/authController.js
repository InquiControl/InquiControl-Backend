const authService = require("../services/authService");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Nombre, correo y contraseña son obligatorios"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const user = await authService.registerUser(
            name,
            email,
            password
        );

        res.status(201).json({
            message: "Usuario registrado correctamente",
            user
        });

    } catch (error) {

        console.error("Error en register:", error.message);

        if (error.message.includes("ya está registrado")) {
            return res.status(409).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Correo y contraseña son obligatorios"
            });
        }

        const result = await authService.loginUser(
            email,
            password
        );

        res.json(result);

    } catch (error) {

        console.error("Error en login:", error.message);

        res.status(401).json({
            message: "Credenciales inválidas"
        });
    }
}


module.exports = {
    register,
    login
};