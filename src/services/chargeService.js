const { sql, poolPromise } = require("../config/database");


async function generateCharges(utilityBillId, userId) {

    const pool = await poolPromise;


    // =====================================================
    // 1. OBTENER FACTURA Y VALIDAR PROPIETARIO
    // =====================================================

    const billResult = await pool.request()
        .input("utility_bill_id", sql.Int, utilityBillId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                ub.id,
                ub.property_id,
                ub.type,
                ub.period,
                ub.consumption,
                ub.total_amount
            FROM UtilityBills ub
            INNER JOIN Properties p
                ON p.id = ub.property_id
            WHERE ub.id = @utility_bill_id
              AND p.user_id = @user_id
        `);


    if (billResult.recordset.length === 0) {

        return {
            error: "NOT_FOUND"
        };

    }


    const bill = billResult.recordset[0];


    // =====================================================
    // 2. VALIDAR DATOS DE LA FACTURA
    // =====================================================

    const generalConsumption =
        Number(bill.consumption);

    const totalAmount =
        Number(bill.total_amount);


    if (generalConsumption <= 0) {

        return {
            error: "INVALID_CONSUMPTION"
        };

    }


    if (totalAmount <= 0) {

        return {
            error: "INVALID_AMOUNT"
        };

    }


    // =====================================================
    // 3. EVITAR DUPLICAR CHARGES
    // =====================================================

    const existingResult = await pool.request()
        .input(
            "utility_bill_id",
            sql.Int,
            utilityBillId
        )
        .query(`
            SELECT COUNT(*) AS total
            FROM Charges
            WHERE utility_bill_id = @utility_bill_id
        `);


    if (existingResult.recordset[0].total > 0) {

        return {
            error: "ALREADY_GENERATED"
        };

    }


    // =====================================================
    // 4. OBTENER MEDIDORES INTERNOS
    // =====================================================

    const metersResult = await pool.request()
        .input(
            "property_id",
            sql.Int,
            bill.property_id
        )
        .input(
            "type",
            sql.NVarChar(30),
            bill.type
        )
        .query(`
            SELECT
                m.id AS meter_id,
                m.unit_id,
                m.type,
                m.code,
                m.measurement_unit
            FROM Meters m
            WHERE m.property_id = @property_id
              AND m.type = @type
              AND m.is_shared = 0
              AND m.unit_id IS NOT NULL
        `);


    if (metersResult.recordset.length === 0) {

        return {
            error: "NO_METERS"
        };

    }


    // =====================================================
    // 5. OBTENER INQUILINOS ACTIVOS
    // =====================================================

    const tenantsResult = await pool.request()
        .input(
            "property_id",
            sql.Int,
            bill.property_id
        )
        .query(`
            SELECT
                t.id AS tenant_id,
                t.unit_id,
                t.name,
                t.lastname
            FROM Tenants t
            INNER JOIN Units u
                ON u.id = t.unit_id
            WHERE u.property_id = @property_id
              AND t.status = 'ACTIVE'
        `);


    if (tenantsResult.recordset.length === 0) {

        return {
            error: "NO_TENANTS"
        };

    }


    // =====================================================
    // 6. CALCULAR CONSUMO DE CADA MEDIDOR
    // =====================================================

    const readings = [];


    for (const meter of metersResult.recordset) {

        const readingResult = await pool.request()
            .input(
                "meter_id",
                sql.Int,
                meter.meter_id
            )
            .query(`
                SELECT TOP 2
                    reading,
                    reading_date
                FROM MeterReadings
                WHERE meter_id = @meter_id
                ORDER BY reading_date DESC, id DESC
            `);


        if (readingResult.recordset.length < 2) {

            continue;

        }


        const currentReading =
            Number(
                readingResult.recordset[0].reading
            );


        const previousReading =
            Number(
                readingResult.recordset[1].reading
            );


        const consumption =
            currentReading - previousReading;


        if (consumption < 0) {

            return {
                error: "INVALID_READING",
                meter_id: meter.meter_id
            };

        }


        const tenant =
            tenantsResult.recordset.find(
                t => t.unit_id === meter.unit_id
            );


        if (!tenant) {

            continue;

        }


        readings.push({

            meter_id: meter.meter_id,

            unit_id: meter.unit_id,

            tenant_id: tenant.tenant_id,

            tenant_name:
                `${tenant.name} ${tenant.lastname}`,

            consumption

        });

    }


    if (readings.length === 0) {

        return {
            error: "NO_VALID_READINGS"
        };

    }


    // =====================================================
    // 7. VALIDAR QUE LA SUMA INTERNA COINCIDA
    // =====================================================

    const internalConsumption =
        readings.reduce(
            (total, item) =>
                total + item.consumption,
            0
        );


    if (
        Math.abs(
            internalConsumption -
            generalConsumption
        ) > 0.01
    ) {

        return {

            error:
                "CONSUMPTION_MISMATCH",

            generalConsumption,

            internalConsumption

        };

    }


    // =====================================================
    // 8. CREAR CHARGES
    // =====================================================

    const transaction =
        new sql.Transaction(pool);


    try {

        await transaction.begin();


        const charges = [];


        for (const item of readings) {


            const amount =

                (
                    item.consumption /
                    generalConsumption
                )
                *
                totalAmount;


            const roundedAmount =

                Math.round(
                    amount * 100
                ) / 100;


            const request =
                new sql.Request(transaction);


            request.input(
                "tenant_id",
                sql.Int,
                item.tenant_id
            );


            request.input(
                "utility_bill_id",
                sql.Int,
                utilityBillId
            );


            request.input(
                "amount",
                sql.Decimal(18, 2),
                roundedAmount
            );


            request.input(
                "calculation_method",
                sql.NVarChar(30),
                "PROPORTIONAL"
            );


            request.input(
                "status",
                sql.NVarChar(20),
                "PENDING"
            );


            const result =
                await request.query(`

                    INSERT INTO Charges (

                        tenant_id,

                        utility_bill_id,

                        amount,

                        calculation_method,

                        status,

                        created_at

                    )

                    OUTPUT

                        INSERTED.id,

                        INSERTED.tenant_id,

                        INSERTED.utility_bill_id,

                        INSERTED.amount,

                        INSERTED.calculation_method,

                        INSERTED.status,

                        INSERTED.created_at

                    VALUES (

                        @tenant_id,

                        @utility_bill_id,

                        @amount,

                        @calculation_method,

                        @status,

                        SYSDATETIME()

                    )

                `);


            charges.push(
                result.recordset[0]
            );

        }


        await transaction.commit();


        return {

            success: true,

            utility_bill: bill,

            general_consumption:
                generalConsumption,

            internal_consumption:
                internalConsumption,

            charges

        };


    } catch (error) {


        try {

            await transaction.rollback();

        } catch (rollbackError) {

            console.error(
                "Error haciendo rollback:",
                rollbackError
            );

        }


        throw error;

    }

}


// =====================================================
// OBTENER TODOS LOS CHARGES
// =====================================================

async function getCharges(userId) {

    const pool = await poolPromise;


    const result =
        await pool.request()

            .input(
                "user_id",
                sql.Int,
                userId
            )

            .query(`

                SELECT

                    c.id,

                    c.tenant_id,

                    CONCAT(
                        t.name,
                        ' ',
                        t.lastname
                    ) AS tenant_name,

                    c.utility_bill_id,

                    ub.type AS service,

                    ub.period,

                    c.amount,

                    c.calculation_method,

                    c.status,

                    c.created_at

                FROM Charges c

                INNER JOIN Tenants t
                    ON t.id = c.tenant_id

                INNER JOIN Units u
                    ON u.id = t.unit_id

                INNER JOIN Properties p
                    ON p.id = u.property_id

                INNER JOIN UtilityBills ub
                    ON ub.id =
                    c.utility_bill_id

                WHERE p.user_id = @user_id

                ORDER BY c.id DESC

            `);


    return result.recordset;

}


// =====================================================
// OBTENER CHARGE POR ID
// =====================================================

async function getChargeById(
    chargeId,
    userId
) {

    const pool =
        await poolPromise;


    const result =
        await pool.request()

            .input(
                "charge_id",
                sql.Int,
                chargeId
            )

            .input(
                "user_id",
                sql.Int,
                userId
            )

            .query(`

                SELECT

                    c.id,

                    c.tenant_id,

                    CONCAT(
                        t.name,
                        ' ',
                        t.lastname
                    ) AS tenant_name,

                    c.utility_bill_id,

                    ub.type AS service,

                    ub.period,

                    c.amount,

                    c.calculation_method,

                    c.status,

                    c.created_at

                FROM Charges c

                INNER JOIN Tenants t
                    ON t.id = c.tenant_id

                INNER JOIN Units u
                    ON u.id = t.unit_id

                INNER JOIN Properties p
                    ON p.id = u.property_id

                INNER JOIN UtilityBills ub
                    ON ub.id =
                    c.utility_bill_id

                WHERE c.id = @charge_id

                  AND p.user_id =
                      @user_id

            `);


    return result.recordset[0] || null;

}


module.exports = {

    generateCharges,

    getCharges,

    getChargeById

};