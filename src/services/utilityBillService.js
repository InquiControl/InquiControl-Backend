const { sql, poolPromise } = require("../config/database");


// =====================================================
// CREAR FACTURA
// =====================================================

async function createUtilityBill(
    userId,
    propertyId,
    type,
    period,
    consumption,
    totalAmount,
    dueDate,
    consumptionAmount,
    fixedCharge,
    additionalCharges,
    taxAmount,
    lateFee,
    previousReading,
    currentReading,
    meterCode,
    supplyNumber,
    provider
) {

    const pool = await poolPromise;


    // Verificar que la propiedad pertenece al usuario
    const propertyResult = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT id
            FROM Properties
            WHERE id = @property_id
              AND user_id = @user_id
        `);


    if (propertyResult.recordset.length === 0) {
        return null;
    }


    // Evitar duplicar factura del mismo periodo y servicio
    const existingResult = await pool.request()
        .input("property_id", sql.Int, propertyId)
        .input("type", sql.NVarChar(30), type)
        .input("period", sql.Char(7), period)
        .query(`
            SELECT id
            FROM UtilityBills
            WHERE property_id = @property_id
              AND type = @type
              AND period = @period
        `);


    if (existingResult.recordset.length > 0) {

        return {
            error: "ALREADY_EXISTS",
            id: existingResult.recordset[0].id
        };

    }


    const result = await pool.request()

        .input(
            "property_id",
            sql.Int,
            propertyId
        )

        .input(
            "type",
            sql.NVarChar(30),
            type
        )

        .input(
            "period",
            sql.Char(7),
            period
        )

        .input(
            "consumption",
            sql.Decimal(18, 3),
            consumption
        )

        .input(
            "total_amount",
            sql.Decimal(18, 2),
            totalAmount
        )

        .input(
            "due_date",
            sql.Date,
            dueDate || null
        )

        .input(
            "consumption_amount",
            sql.Decimal(18, 2),
            consumptionAmount || 0
        )

        .input(
            "fixed_charge",
            sql.Decimal(18, 2),
            fixedCharge || 0
        )

        .input(
            "additional_charges",
            sql.Decimal(18, 2),
            additionalCharges || 0
        )

        .input(
            "tax_amount",
            sql.Decimal(18, 2),
            taxAmount || 0
        )

        .input(
            "late_fee",
            sql.Decimal(18, 2),
            lateFee || 0
        )

        .input(
            "previous_reading",
            sql.Decimal(18, 3),
            previousReading || null
        )

        .input(
            "current_reading",
            sql.Decimal(18, 3),
            currentReading || null
        )

        .input(
            "meter_code",
            sql.NVarChar(100),
            meterCode || null
        )

        .input(
            "supply_number",
            sql.NVarChar(100),
            supplyNumber || null
        )

        .input(
            "provider",
            sql.NVarChar(100),
            provider || null
        )

        .query(`
            INSERT INTO UtilityBills (

                property_id,
                type,
                period,
                consumption,
                total_amount,
                due_date,
                created_at,
                consumption_amount,
                fixed_charge,
                additional_charges,
                tax_amount,
                late_fee,
                previous_reading,
                current_reading,
                meter_code,
                supply_number,
                provider

            )

            OUTPUT

                INSERTED.id,
                INSERTED.property_id,
                INSERTED.type,
                INSERTED.period,
                INSERTED.consumption,
                INSERTED.total_amount,
                INSERTED.due_date,
                INSERTED.created_at,
                INSERTED.consumption_amount,
                INSERTED.fixed_charge,
                INSERTED.additional_charges,
                INSERTED.tax_amount,
                INSERTED.late_fee,
                INSERTED.previous_reading,
                INSERTED.current_reading,
                INSERTED.meter_code,
                INSERTED.supply_number,
                INSERTED.provider

            VALUES (

                @property_id,
                @type,
                @period,
                @consumption,
                @total_amount,
                @due_date,
                SYSDATETIME(),
                @consumption_amount,
                @fixed_charge,
                @additional_charges,
                @tax_amount,
                @late_fee,
                @previous_reading,
                @current_reading,
                @meter_code,
                @supply_number,
                @provider

            )
        `);


    return result.recordset[0];

}


// =====================================================
// OBTENER TODAS LAS FACTURAS
// =====================================================

async function getUtilityBills(userId) {

    const pool = await poolPromise;


    const result = await pool.request()

        .input(
            "user_id",
            sql.Int,
            userId
        )

        .query(`
            SELECT

                ub.id,
                ub.property_id,
                ub.type,
                ub.period,
                ub.consumption,
                ub.total_amount,
                ub.due_date,
                ub.created_at,
                ub.consumption_amount,
                ub.fixed_charge,
                ub.additional_charges,
                ub.tax_amount,
                ub.late_fee,
                ub.previous_reading,
                ub.current_reading,
                ub.meter_code,
                ub.supply_number,
                ub.provider

            FROM UtilityBills ub

            INNER JOIN Properties p
                ON p.id = ub.property_id

            WHERE p.user_id = @user_id

            ORDER BY
                ub.id DESC
        `);


    return result.recordset;

}


// =====================================================
// OBTENER FACTURA POR ID
// =====================================================

async function getUtilityBillById(
    utilityBillId,
    userId
) {

    const pool = await poolPromise;


    const result = await pool.request()

        .input(
            "id",
            sql.Int,
            utilityBillId
        )

        .input(
            "user_id",
            sql.Int,
            userId
        )

        .query(`
            SELECT

                ub.id,
                ub.property_id,
                ub.type,
                ub.period,
                ub.consumption,
                ub.total_amount,
                ub.due_date,
                ub.created_at,
                ub.consumption_amount,
                ub.fixed_charge,
                ub.additional_charges,
                ub.tax_amount,
                ub.late_fee,
                ub.previous_reading,
                ub.current_reading,
                ub.meter_code,
                ub.supply_number,
                ub.provider

            FROM UtilityBills ub

            INNER JOIN Properties p
                ON p.id = ub.property_id

            WHERE ub.id = @id
              AND p.user_id = @user_id
        `);


    return result.recordset[0] || null;

}


module.exports = {

    createUtilityBill,

    getUtilityBills,

    getUtilityBillById

};