const chargeService = require("../services/chargeService");


// =====================================================
// GENERAR CHARGES
// =====================================================

async function generate(req, res) {

    try {

        const utilityBillId =
            Number(req.params.utilityBillId);


        if (!Number.isInteger(utilityBillId)) {

            return res.status(400).json({
                message: "ID de factura inválido"
            });

        }


        const result =
            await chargeService.generateCharges(
                utilityBillId,
                req.user.id
            );


        if (result.error === "NOT_FOUND") {

            return res.status(404).json({
                message: "Factura no encontrada"
            });

        }


        if (result.error === "INVALID_CONSUMPTION") {

            return res.status(400).json({
                message:
                    "El consumo de la factura no es válido"
            });

        }


        if (result.error === "INVALID_AMOUNT") {

            return res.status(400).json({
                message:
                    "El monto total de la factura no es válido"
            });

        }


        if (result.error === "ALREADY_GENERATED") {

            return res.status(409).json({
                message:
                    "Los cargos de esta factura ya fueron generados"
            });

        }


        if (result.error === "NO_METERS") {

            return res.status(404).json({
                message:
                    "No se encontraron medidores internos"
            });

        }


        if (result.error === "NO_TENANTS") {

            return res.status(404).json({
                message:
                    "No se encontraron inquilinos activos"
            });

        }


        if (result.error === "NO_VALID_READINGS") {

            return res.status(400).json({
                message:
                    "No existen suficientes lecturas para calcular el consumo"
            });

        }


        if (result.error === "INVALID_READING") {

            return res.status(400).json({
                message:
                    "Una lectura del medidor es inválida",
                meter_id: result.meter_id
            });

        }


        if (result.error === "CONSUMPTION_MISMATCH") {

            return res.status(400).json({

                message:
                    "El consumo de los medidores internos no coincide con la factura",

                general_consumption:
                    result.generalConsumption,

                internal_consumption:
                    result.internalConsumption

            });

        }


        return res.status(201).json({

            message:
                "Cargos generados correctamente",

            utility_bill:
                result.utility_bill,

            general_consumption:
                result.general_consumption,

            internal_consumption:
                result.internal_consumption,

            charges:
                result.charges

        });


    } catch (error) {

        console.error(
            "Error generando cargos:",
            error
        );


        return res.status(500).json({

            message:
                "Error interno del servidor"

        });

    }

}


// =====================================================
// LISTAR CHARGES
// =====================================================

async function getAll(req, res) {

    try {

        const charges =
            await chargeService.getCharges(
                req.user.id
            );


        return res.json({
            charges
        });


    } catch (error) {

        console.error(
            "Error obteniendo cargos:",
            error
        );


        return res.status(500).json({

            message:
                "Error interno del servidor"

        });

    }

}


// =====================================================
// OBTENER CHARGE POR ID
// =====================================================

async function getOne(req, res) {

    try {

        const chargeId =
            Number(req.params.id);


        if (!Number.isInteger(chargeId)) {

            return res.status(400).json({

                message:
                    "ID de cargo inválido"

            });

        }


        const charge =
            await chargeService.getChargeById(
                chargeId,
                req.user.id
            );


        if (!charge) {

            return res.status(404).json({

                message:
                    "Cargo no encontrado"

            });

        }


        return res.json({

            charge

        });


    } catch (error) {

        console.error(
            "Error obteniendo cargo:",
            error
        );


        return res.status(500).json({

            message:
                "Error interno del servidor"

        });

    }

}


module.exports = {

    generate,

    getAll,

    getOne

};