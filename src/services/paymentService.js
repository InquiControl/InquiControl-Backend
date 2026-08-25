const { sql, poolPromise } = require("../config/database");


async function createPayment(
    chargeId,
    amount,
    paymentDate,
    notes,
    userId
) {
    const pool = await poolPromise;

    // 1. Verificar que el cargo pertenece a una propiedad del usuario
    const chargeResult = await pool.request()
        .input("charge_id", sql.Int, chargeId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                c.id,
                c.tenant_id,
                c.utility_bill_id,
                c.amount AS charge_amount,
                c.status
            FROM Charges c
            INNER JOIN Tenants t
                ON t.id = c.tenant_id
            INNER JOIN Units u
                ON u.id = t.unit_id
            INNER JOIN Properties p
                ON p.id = u.property_id
            WHERE c.id = @charge_id
              AND p.user_id = @user_id
        `);

    if (chargeResult.recordset.length === 0) {
        return null;
    }

    const charge = chargeResult.recordset[0];

    // 2. Obtener cuánto se ha pagado anteriormente
    const paidResult = await pool.request()
        .input("charge_id", sql.Int, chargeId)
        .query(`
            SELECT
                ISNULL(SUM(amount), 0) AS total_paid
            FROM Payments
            WHERE charge_id = @charge_id
        `);

    const previousPaid = Number(
        paidResult.recordset[0].total_paid
    );

    const paymentAmount = Number(amount);

    // 3. Verificar que el pago no exceda el saldo
    const remainingBeforePayment =
        Number(charge.charge_amount) - previousPaid;

    if (paymentAmount <= 0) {
        throw new Error("El monto del pago debe ser mayor que 0");
    }

    if (paymentAmount > remainingBeforePayment) {
        throw new Error(
            `El pago excede el saldo pendiente de S/${remainingBeforePayment.toFixed(2)}`
        );
    }

    // 4. Registrar el pago
    const paymentResult = await pool.request()
        .input("charge_id", sql.Int, chargeId)
        .input("amount", sql.Decimal(18, 2), paymentAmount)
        .input("payment_date", sql.Date, paymentDate)
        .input("notes", sql.NVarChar(255), notes || null)
        .query(`
            INSERT INTO Payments (
                charge_id,
                amount,
                payment_date,
                notes,
                created_at
            )
            OUTPUT
                INSERTED.id,
                INSERTED.charge_id,
                INSERTED.amount,
                INSERTED.payment_date,
                INSERTED.notes,
                INSERTED.created_at
            VALUES (
                @charge_id,
                @amount,
                @payment_date,
                @notes,
                SYSDATETIME()
            )
        `);

    // 5. Calcular el total pagado después del nuevo pago
    const newTotalPaid =
        previousPaid + paymentAmount;

    const chargeAmount =
        Number(charge.charge_amount);

    let newStatus = "PENDING";

    if (newTotalPaid >= chargeAmount) {
        newStatus = "PAID";
    } else if (newTotalPaid > 0) {
        newStatus = "PARTIAL";
    }

    // 6. Actualizar estado del cargo
    await pool.request()
        .input("charge_id", sql.Int, chargeId)
        .input("status", sql.NVarChar(20), newStatus)
        .query(`
            UPDATE Charges
            SET status = @status
            WHERE id = @charge_id
        `);

    return {
        payment: paymentResult.recordset[0],
        charge: {
            id: charge.id,
            amount: chargeAmount,
            paid: Number(newTotalPaid.toFixed(2)),
            remaining: Number(
                Math.max(
                    chargeAmount - newTotalPaid,
                    0
                ).toFixed(2)
            ),
            status: newStatus
        }
    };
}


async function getPayments(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                p.id,
                p.charge_id,
                p.amount,
                p.payment_date,
                p.notes,
                p.created_at,

                c.tenant_id,
                CONCAT(
                    t.name,
                    ' ',
                    t.lastname
                ) AS tenant_name,

                ub.type AS service,
                c.amount AS charge_amount,
                c.status AS charge_status

            FROM Payments p

            INNER JOIN Charges c
                ON c.id = p.charge_id

            INNER JOIN Tenants t
                ON t.id = c.tenant_id

            INNER JOIN Units u
                ON u.id = t.unit_id

            INNER JOIN Properties pr
                ON pr.id = u.property_id

            INNER JOIN UtilityBills ub
                ON ub.id = c.utility_bill_id

            WHERE pr.user_id = @user_id

            ORDER BY p.id DESC
        `);

    return result.recordset;
}


async function getPaymentById(paymentId, userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("payment_id", sql.Int, paymentId)
        .input("user_id", sql.Int, userId)
        .query(`
            SELECT
                p.id,
                p.charge_id,
                p.amount,
                p.payment_date,
                p.notes,
                p.created_at,

                c.tenant_id,
                CONCAT(
                    t.name,
                    ' ',
                    t.lastname
                ) AS tenant_name,

                ub.type AS service,
                c.amount AS charge_amount,
                c.status AS charge_status

            FROM Payments p

            INNER JOIN Charges c
                ON c.id = p.charge_id

            INNER JOIN Tenants t
                ON t.id = c.tenant_id

            INNER JOIN Units u
                ON u.id = t.unit_id

            INNER JOIN Properties pr
                ON pr.id = u.property_id

            INNER JOIN UtilityBills ub
                ON ub.id = c.utility_bill_id

            WHERE p.id = @payment_id
              AND pr.user_id = @user_id
        `);

    return result.recordset[0] || null;
}


module.exports = {
    createPayment,
    getPayments,
    getPaymentById
};