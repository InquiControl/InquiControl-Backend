const paymentService = require("../services/paymentService");


async function create(req, res) {
    try {

        const {
            charge_id,
            amount,
            payment_date,
            notes
        } = req.body;

        if (
            charge_id === undefined ||
            amount === undefined ||
            !payment_date
        ) {
            return res.status(400).json({
                message: "charge_id, amount y payment_date son obligatorios"
            });
        }

        const chargeId = Number(charge_id);
        const paymentAmount = Number(amount);

        if (!Number.isInteger(chargeId)) {
            return res.status(400).json({
                message: "charge_id inválido"
            });
        }

        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
            return res.status(400).json({
                message: "amount debe ser un número mayor que 0"
            });
        }

        const result = await paymentService.createPayment(
            chargeId,
            paymentAmount,
            payment_date,
            notes,
            req.user.id
        );

        if (!result) {
            return res.status(404).json({
                message: "Cargo no encontrado"
            });
        }

        return res.status(201).json({
            message: "Pago registrado correctamente",
            ...result
        });

    } catch (error) {

        console.error("Error registrando pago:", error);

        if (
            error.message &&
            (
                error.message.includes("excede el saldo") ||
                error.message.includes("mayor que 0")
            )
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getAll(req, res) {
    try {

        const payments = await paymentService.getPayments(
            req.user.id
        );

        res.json({
            payments
        });

    } catch (error) {

        console.error("Error obteniendo pagos:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getOne(req, res) {
    try {

        const paymentId = Number(req.params.id);

        if (!Number.isInteger(paymentId)) {
            return res.status(400).json({
                message: "ID de pago inválido"
            });
        }

        const payment =
            await paymentService.getPaymentById(
                paymentId,
                req.user.id
            );

        if (!payment) {
            return res.status(404).json({
                message: "Pago no encontrado"
            });
        }

        res.json({
            payment
        });

    } catch (error) {

        console.error("Error obteniendo pago:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


module.exports = {
    create,
    getAll,
    getOne
};