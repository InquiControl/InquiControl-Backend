const { sql, poolPromise } = require("../config/database");


// =====================================================
// Verificar que el medidor pertenece a una propiedad
// del usuario autenticado
// =====================================================

async function meterBelongsToUser(meterId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT m.id
            FROM Meters m
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE m.id = @meter_id
              AND p.user_id = @user_id
        `);

    return result.recordset.length > 0;
}


// =====================================================
// Obtener todas las lecturas
// =====================================================

async function getMeterReadings(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                mr.id,
                mr.meter_id,
                m.property_id,
                m.unit_id,
                m.type,
                m.code,
                m.measurement_unit,
                m.provider,
                mr.reading,
                mr.reading_date,
                mr.photo_url,
                mr.created_at
            FROM MeterReadings mr
            INNER JOIN Meters m
                ON m.id = mr.meter_id
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE p.user_id = @user_id
            ORDER BY mr.reading_date DESC, mr.id DESC
        `);

    return result.recordset;
}


// =====================================================
// Obtener una lectura por ID
// =====================================================

async function getMeterReadingById(readingId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("reading_id", sql.Int, readingId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                mr.id,
                mr.meter_id,
                m.property_id,
                m.unit_id,
                m.type,
                m.code,
                m.measurement_unit,
                m.provider,
                mr.reading,
                mr.reading_date,
                mr.photo_url,
                mr.created_at
            FROM MeterReadings mr
            INNER JOIN Meters m
                ON m.id = mr.meter_id
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE mr.id = @reading_id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


// =====================================================
// Obtener lecturas de un medidor
// =====================================================

async function getReadingsByMeter(meterId, userId) {
    const belongs = await meterBelongsToUser(
        meterId,
        userId
    );

    if (!belongs) {
        return null;
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .query(`
            SELECT
                id,
                meter_id,
                reading,
                reading_date,
                photo_url,
                created_at
            FROM MeterReadings
            WHERE meter_id = @meter_id
            ORDER BY reading_date DESC, id DESC
        `);

    return result.recordset;
}


// =====================================================
// Obtener última lectura de un medidor
// =====================================================

async function getLastReading(meterId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .query(`
            SELECT TOP 1
                id,
                meter_id,
                reading,
                reading_date,
                photo_url,
                created_at
            FROM MeterReadings
            WHERE meter_id = @meter_id
            ORDER BY reading_date DESC, id DESC
        `);

    return result.recordset[0] || null;
}


// =====================================================
// Crear lectura
// =====================================================

async function createMeterReading(
    meterId,
    reading,
    readingDate,
    photoUrl,
    userId
) {
    const belongs = await meterBelongsToUser(
        meterId,
        userId
    );

    if (!belongs) {
        return null;
    }

    // Obtener la última lectura
    const previousReading = await getLastReading(
        meterId
    );

    // Evitar que una lectura sea menor que la anterior
    if (
        previousReading &&
        Number(reading) < Number(previousReading.reading)
    ) {
        throw new Error(
            "La lectura no puede ser menor que la lectura anterior"
        );
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("meter_id", sql.Int, meterId)
        .input("reading", sql.Decimal(18, 3), reading)
        .input("reading_date", sql.Date, readingDate)
        .input(
            "photo_url",
            sql.NVarChar(500),
            photoUrl || null
        )
        .query(`
            INSERT INTO MeterReadings (
                meter_id,
                reading,
                reading_date,
                photo_url,
                created_at
            )
            OUTPUT
                INSERTED.id,
                INSERTED.meter_id,
                INSERTED.reading,
                INSERTED.reading_date,
                INSERTED.photo_url,
                INSERTED.created_at
            VALUES (
                @meter_id,
                @reading,
                @reading_date,
                @photo_url,
                SYSDATETIME()
            )
        `);

    const createdReading = result.recordset[0];

    // Calcular consumo
    const previousValue = previousReading
        ? Number(previousReading.reading)
        : null;

    const currentValue = Number(
        createdReading.reading
    );

    const consumption = previousValue !== null
        ? currentValue - previousValue
        : null;

    return {
        ...createdReading,
        previous_reading: previousValue,
        consumption
    };
}


// =====================================================
// Actualizar lectura
// =====================================================

async function updateMeterReading(
    readingId,
    reading,
    readingDate,
    photoUrl,
    userId
) {
    const existing = await getMeterReadingById(
        readingId,
        userId
    );

    if (!existing) {
        return null;
    }

    const pool = await poolPromise;

    // Buscar lectura anterior a la que estamos editando
    const previousResult = await pool.request()
        .input("meter_id", sql.Int, existing.meter_id)
        .input("reading_date", sql.Date, readingDate)
        .input("reading_id", sql.Int, readingId)
        .query(`
            SELECT TOP 1
                id,
                reading,
                reading_date
            FROM MeterReadings
            WHERE meter_id = @meter_id
              AND (
                    reading_date < @reading_date
                    OR (
                        reading_date = @reading_date
                        AND id < @reading_id
                    )
              )
            ORDER BY reading_date DESC, id DESC
        `);

    const previousReading =
        previousResult.recordset[0] || null;

    if (
        previousReading &&
        Number(reading) < Number(previousReading.reading)
    ) {
        throw new Error(
            "La lectura no puede ser menor que la lectura anterior"
        );
    }

    const result = await pool.request()
        .input("id", sql.Int, readingId)
        .input("reading", sql.Decimal(18, 3), reading)
        .input("reading_date", sql.Date, readingDate)
        .input(
            "photo_url",
            sql.NVarChar(500),
            photoUrl || null
        )
        .input("user_id", sql.Int, userId)
        .query(`
            UPDATE mr
            SET
                mr.reading = @reading,
                mr.reading_date = @reading_date,
                mr.photo_url = @photo_url
            OUTPUT
                INSERTED.id,
                INSERTED.meter_id,
                INSERTED.reading,
                INSERTED.reading_date,
                INSERTED.photo_url,
                INSERTED.created_at
            FROM MeterReadings mr
            INNER JOIN Meters m
                ON m.id = mr.meter_id
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE mr.id = @id
              AND p.user_id = @user_id
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    const updatedReading = result.recordset[0];

    const previousValue = previousReading
        ? Number(previousReading.reading)
        : null;

    const currentValue = Number(
        updatedReading.reading
    );

    const consumption = previousValue !== null
        ? currentValue - previousValue
        : null;

    return {
        ...updatedReading,
        previous_reading: previousValue,
        consumption
    };
}


// =====================================================
// Eliminar lectura
// =====================================================

async function deleteMeterReading(
    readingId,
    userId
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("id", sql.Int, readingId)
        .input("user_id", sql.Int, userId)
        .query(`
            DELETE mr
            OUTPUT DELETED.id
            FROM MeterReadings mr
            INNER JOIN Meters m
                ON m.id = mr.meter_id
            INNER JOIN Properties p
                ON p.id = m.property_id
            WHERE mr.id = @id
              AND p.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


module.exports = {
    getMeterReadings,
    getMeterReadingById,
    getReadingsByMeter,
    createMeterReading,
    updateMeterReading,
    deleteMeterReading
};