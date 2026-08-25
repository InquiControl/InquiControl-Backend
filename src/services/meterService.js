const { sql, poolPromise } = require("../config/database");


async function getMeters(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                m.id,
                m.property_id,
                m.unit_id,
                m.type,
                m.code,
                m.measurement_unit,
                m.is_shared,
                m.created_at,
                m.provider
            FROM Meters m
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE p.user_id = @user_id
            ORDER BY m.id ASC
        `);

    return result.recordset;
}


async function getMeterById(meterId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                m.id,
                m.property_id,
                m.unit_id,
                m.type,
                m.code,
                m.measurement_unit,
                m.is_shared,
                m.created_at,
                m.provider
            FROM Meters m
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE m.id = @meter_id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function createMeter(
    propertyId,
    unitId,
    type,
    code,
    measurementUnit,
    isShared,
    provider,
    userId
) {
    const pool = await poolPromise;

    // Verificar que la propiedad pertenece al usuario
    const property = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT id
            FROM Properties
            WHERE id = @property_id
              AND user_id = @user_id
        `);

    if (property.recordset.length === 0) {
        return null;
    }

    // Si se especificó una unidad, verificar que pertenece
    // a la propiedad
    if (unitId !== null && unitId !== undefined) {

        const unit = await pool.request()
            .input("unit_id", sql.Int, unitId)
            .input("property_id", sql.Int, propertyId)
            .query(`
                SELECT id
                FROM Units
                WHERE id = @unit_id
                  AND property_id = @property_id
            `);

        if (unit.recordset.length === 0) {
            throw new Error("La unidad no pertenece a la propiedad");
        }
    }

    const result = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input(
            "unit_id",
            sql.Int,
            unitId || null
        )
        .input("type", sql.NVarChar(50), type)
        .input("code", sql.NVarChar(100), code)
        .input(
            "measurement_unit",
            sql.NVarChar(20),
            measurementUnit
        )
        .input(
            "is_shared",
            sql.Bit,
            isShared ? 1 : 0
        )
        .input(
            "provider",
            sql.NVarChar(100),
            provider || null
        )
        .query(`
            INSERT INTO Meters (
                property_id,
                unit_id,
                type,
                code,
                measurement_unit,
                is_shared,
                created_at,
                provider
            )
            OUTPUT
                INSERTED.id,
                INSERTED.property_id,
                INSERTED.unit_id,
                INSERTED.type,
                INSERTED.code,
                INSERTED.measurement_unit,
                INSERTED.is_shared,
                INSERTED.created_at,
                INSERTED.provider
            VALUES (
                @property_id,
                @unit_id,
                @type,
                @code,
                @measurement_unit,
                @is_shared,
                SYSDATETIME(),
                @provider
            )
        `);

    return result.recordset[0];
}


async function updateMeter(
    meterId,
    propertyId,
    unitId,
    type,
    code,
    measurementUnit,
    isShared,
    provider,
    userId
) {
    const pool = await poolPromise;

    // Verificar propiedad
    const property = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT id
            FROM Properties
            WHERE id = @property_id
              AND user_id = @user_id
        `);

    if (property.recordset.length === 0) {
        return null;
    }

    // Verificar unidad
    if (unitId !== null && unitId !== undefined) {

        const unit = await pool.request()
            .input("unit_id", sql.Int, unitId)
            .input("property_id", sql.Int, propertyId)
            .query(`
                SELECT id
                FROM Units
                WHERE id = @unit_id
                  AND property_id = @property_id
            `);

        if (unit.recordset.length === 0) {
            throw new Error("La unidad no pertenece a la propiedad");
        }
    }

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .input("property_id", sql.Int, propertyId)
        .input("unit_id", sql.Int, unitId || null)
        .input("type", sql.NVarChar(50), type)
        .input("code", sql.NVarChar(100), code)
        .input(
            "measurement_unit",
            sql.NVarChar(20),
            measurementUnit
        )
        .input(
            "is_shared",
            sql.Bit,
            isShared ? 1 : 0
        )
        .input(
            "provider",
            sql.NVarChar(100),
            provider || null
        )
        .input("user_id", sql.Int, userId)
        .query(`
            UPDATE m
            SET
                m.property_id = @property_id,
                m.unit_id = @unit_id,
                m.type = @type,
                m.code = @code,
                m.measurement_unit = @measurement_unit,
                m.is_shared = @is_shared,
                m.provider = @provider
            OUTPUT
                INSERTED.id,
                INSERTED.property_id,
                INSERTED.unit_id,
                INSERTED.type,
                INSERTED.code,
                INSERTED.measurement_unit,
                INSERTED.is_shared,
                INSERTED.created_at,
                INSERTED.provider
            FROM Meters m
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE m.id = @meter_id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


async function deleteMeter(meterId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .input("user_id", sql.Int, userId)
        .query(`
            DELETE m
            OUTPUT DELETED.id
            FROM Meters m
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE m.id = @meter_id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


module.exports = {
    getMeters,
    getMeterById,
    createMeter,
    updateMeter,
    deleteMeter
};