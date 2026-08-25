const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../config/database");

async function registerUser(name, email, password) {
    const pool = await poolPromise;

    // Comprobar si el correo ya existe
    const existingUser = await pool.request()
        .input("email", sql.NVarChar(150), email)
        .query(`
            SELECT Id
            FROM Users
            WHERE email = @email
        `);

    if (existingUser.recordset.length > 0) {
        throw new Error("El correo electrónico ya está registrado");
    }

    // Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const result = await pool.request()
        .input("name", sql.NVarChar(100), name)
        .input("email", sql.NVarChar(150), email)
        .input("password_hash", sql.NVarChar(255), passwordHash)
        .query(`
            INSERT INTO Users (
                name,
                email,
                password_hash,
                created_at
            )
            OUTPUT INSERTED.Id, INSERTED.name, INSERTED.email
            VALUES (
                @name,
                @email,
                @password_hash,
                SYSDATETIME()
            )
        `);

    return result.recordset[0];
}


async function loginUser(email, password) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("email", sql.NVarChar(150), email)
        .query(`
            SELECT
                Id,
                name,
                email,
                password_hash
            FROM Users
            WHERE email = @email
        `);

    if (result.recordset.length === 0) {
        throw new Error("Credenciales inválidas");
    }

    const user = result.recordset[0];

    const passwordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!passwordValid) {
        throw new Error("Credenciales inválidas");
    }

    const token = jwt.sign(
        {
            userId: user.Id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "2h"
        }
    );

    return {
        token,
        user: {
            id: user.Id,
            name: user.name,
            email: user.email
        }
    };
}


module.exports = {
    registerUser,
    loginUser
};