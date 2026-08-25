const { sql, poolPromise } = require("../config/database");

async function createProperty(userId, name, address) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .input("name", sql.NVarChar(100), name)
        .input("address", sql.NVarChar(255), address || null)
        .query(`
            INSERT INTO Properties (
                user_id,
                name,
                address,
                created_at
            )
            OUTPUT
                INSERTED.id,
                INSERTED.user_id,
                INSERTED.name,
                INSERTED.address,
                INSERTED.created_at
            VALUES (
                @user_id,
                @name,
                @address,
                SYSDATETIME()
            )
        `);

    return result.recordset[0];
}


async function getProperties(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                id,
                user_id,
                name,
                address,
                created_at
            FROM Properties
            WHERE user_id = @user_id
            ORDER BY id DESC
        `);

    return result.recordset;
}


async function getPropertyById(propertyId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                id,
                user_id,
                name,
                address,
                created_at
            FROM Properties
            WHERE id = @id
              AND user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function updateProperty(propertyId, userId, name, address) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .input("name", sql.NVarChar(100), name)
        .input("address", sql.NVarChar(255), address || null)
        .query(`
            UPDATE Properties
            SET
                name = @name,
                address = @address
            OUTPUT
                INSERTED.id,
                INSERTED.user_id,
                INSERTED.name,
                INSERTED.address,
                INSERTED.created_at
            WHERE id = @id
              AND user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function deleteProperty(propertyId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .query(`
            DELETE FROM Properties
            OUTPUT DELETED.id
            WHERE id = @id
              AND user_id = @user_id
        `);

    return result.recordset[0] || null;
}


module.exports = {
    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty
};