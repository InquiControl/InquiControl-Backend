const { sql, poolPromise } = require("../config/database");

async function unitBelongsToUser(unitId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("unit_id", sql.Int, unitId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT u.id
            FROM Units u
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE u.id = @unit_id
              AND p.user_id = @user_id
        `);

    return result.recordset.length > 0;
}


async function createTenant(
    unitId,
    userId,
    name,
    lastname,
    dni,
    phone,
    startDate,
    endDate,
    status
) {
    const belongs = await unitBelongsToUser(unitId, userId);

    if (!belongs) {
        return null;
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("unit_id", sql.Int, unitId)
        .input("name", sql.NVarChar(100), name)
        .input("lastname", sql.NVarChar(100), lastname)
        .input("dni", sql.NVarChar(20), dni || null)
        .input("phone", sql.NVarChar(20), phone || null)
        .input("start_date", sql.Date, startDate)
        .input("end_date", sql.Date, endDate || null)
        .input("status", sql.NVarChar(20), status || "ACTIVE")
        .query(`
            INSERT INTO Tenants (
                unit_id,
                name,
                lastname,
                dni,
                phone,
                start_date,
                end_date,
                status,
                created_at
            )
            OUTPUT
                INSERTED.id,
                INSERTED.unit_id,
                INSERTED.name,
                INSERTED.lastname,
                INSERTED.dni,
                INSERTED.phone,
                INSERTED.start_date,
                INSERTED.end_date,
                INSERTED.status,
                INSERTED.created_at
            VALUES (
                @unit_id,
                @name,
                @lastname,
                @dni,
                @phone,
                @start_date,
                @end_date,
                @status,
                SYSDATETIME()
            )
        `);

    return result.recordset[0];
}


async function getTenantsByUnit(unitId, userId) {
    const belongs = await unitBelongsToUser(unitId, userId);

    if (!belongs) {
        return null;
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("unit_id", sql.Int, unitId)
        .query(`
            SELECT
                id,
                unit_id,
                name,
                lastname,
                dni,
                phone,
                start_date,
                end_date,
                status,
                created_at
            FROM Tenants
            WHERE unit_id = @unit_id
            ORDER BY id DESC
        `);

    return result.recordset;
}


async function getTenantById(tenantId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, tenantId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                t.id,
                t.unit_id,
                t.name,
                t.lastname,
                t.dni,
                t.phone,
                t.start_date,
                t.end_date,
                t.status,
                t.created_at
            FROM Tenants t
            INNER JOIN Units u
                ON u.id = t.unit_id
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE t.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function updateTenant(
    tenantId,
    userId,
    name,
    lastname,
    dni,
    phone,
    startDate,
    endDate,
    status
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, tenantId)
        .input("user_id", sql.Int, userId)
        .input("name", sql.NVarChar(100), name)
        .input("lastname", sql.NVarChar(100), lastname)
        .input("dni", sql.NVarChar(20), dni || null)
        .input("phone", sql.NVarChar(20), phone || null)
        .input("start_date", sql.Date, startDate)
        .input("end_date", sql.Date, endDate || null)
        .input("status", sql.NVarChar(20), status)
        .query(`
            UPDATE t
            SET
                t.name = @name,
                t.lastname = @lastname,
                t.dni = @dni,
                t.phone = @phone,
                t.start_date = @start_date,
                t.end_date = @end_date,
                t.status = @status
            OUTPUT
                INSERTED.id,
                INSERTED.unit_id,
                INSERTED.name,
                INSERTED.lastname,
                INSERTED.dni,
                INSERTED.phone,
                INSERTED.start_date,
                INSERTED.end_date,
                INSERTED.status,
                INSERTED.created_at
            FROM Tenants t
            INNER JOIN Units u
                ON u.id = t.unit_id
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE t.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function deleteTenant(tenantId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, tenantId)
        .input("user_id", sql.Int, userId)
        .query(`
            DELETE t
            OUTPUT DELETED.id
            FROM Tenants t
            INNER JOIN Units u
                ON u.id = t.unit_id
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE t.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


module.exports = {
    createTenant,
    getTenantsByUnit,
    getTenantById,
    updateTenant,
    deleteTenant
};