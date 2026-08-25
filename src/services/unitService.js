const { sql, poolPromise } = require("../config/database");


async function propertyBelongsToUser(propertyId, userId) {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT id
            FROM Properties
            WHERE id = @property_id
              AND user_id = @user_id
        `);

    return result.recordset.length > 0;
}


async function createUnit(propertyId, userId, name, status) {

    const belongs =
        await propertyBelongsToUser(propertyId, userId);

    if (!belongs) {
        return null;
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input("name", sql.NVarChar(100), name)
        .input("status", sql.NVarChar(20), status || "AVAILABLE")
        .query(`
            INSERT INTO Units (
                property_id,
                name,
                status,
                created_at
            )
            OUTPUT
                INSERTED.id,
                INSERTED.property_id,
                INSERTED.name,
                INSERTED.status,
                INSERTED.created_at
            VALUES (
                @property_id,
                @name,
                @status,
                SYSDATETIME()
            )
        `);

    return result.recordset[0];
}


async function getUnitsByProperty(propertyId, userId) {

    const belongs =
        await propertyBelongsToUser(propertyId, userId);

    if (!belongs) {
        return null;
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .query(`
            SELECT
                id,
                property_id,
                name,
                status,
                created_at
            FROM Units
            WHERE property_id = @property_id
            ORDER BY id ASC
        `);

    return result.recordset;
}


async function getUnitById(unitId, userId) {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, unitId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                u.id,
                u.property_id,
                u.name,
                u.status,
                u.created_at
            FROM Units u
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE u.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function updateUnit(unitId, userId, name, status) {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, unitId)
        .input("user_id", sql.Int, userId)
        .input("name", sql.NVarChar(100), name)
        .input("status", sql.NVarChar(20), status)
        .query(`
            UPDATE u
            SET
                u.name = @name,
                u.status = @status
            OUTPUT
                INSERTED.id,
                INSERTED.property_id,
                INSERTED.name,
                INSERTED.status,
                INSERTED.created_at
            FROM Units u
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE u.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function deleteUnit(unitId, userId) {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, unitId)
        .input("user_id", sql.Int, userId)
        .query(`
            DELETE u
            OUTPUT DELETED.id
            FROM Units u
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE u.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


module.exports = {
    createUnit,
    getUnitsByProperty,
    getUnitById,
    updateUnit,
    deleteUnit
};