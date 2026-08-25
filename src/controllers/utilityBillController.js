const utilityBillService = require("../services/utilityBillService");


// =====================================================
// CREAR FACTURA
// =====================================================

async function create(req, res) {

    try {

        const {
            property_id,
            type,
            period,
            consumption,
            total_amount,
            due_date,
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
        } = req.body;


        // Validaciones básicas

        if (
            !property_id ||
            !type ||
            !period ||
            consumption === undefined ||
            total_amount === undefined
        ) {

            return res.status(400).json({

                message:
                    "property_id, type, period, consumption y total_amount son obligatorios"

            });

        }


        const result =
            await utilityBillService.createUtilityBill(

                req.user.id,

                Number(property_id),

                type,

                period,

                Number(consumption),

                Number(total_amount),

                due_date,

                Number(consumption_amount || 0),

                Number(fixed_charge || 0),

                Number(additional_charges || 0),

                Number(tax_amount || 0),

                Number(late_fee || 0),

                previous_reading !== undefined &&
                previous_reading !== null
                    ? Number(previous_reading)
                    : null,

                current_reading !== undefined &&
                current_reading !== null
                    ? Number(current_reading)
                    : null,

                meter_code,

                supply_number,

                provider

            );


        if (result === null) {

            return res.status(404).json({

                message:
                    "Propiedad no encontrada"

            });

        }


        if (result.error === "ALREADY_EXISTS") {

            return res.status(409).json({

                message:
                    "Ya existe una factura para este servicio y periodo",

                utility_bill_id:
                    result.id

            });

        }


        return res.status(201).json({

            message:
                "Factura creada correctamente",

            utility_bill:
                result

        });

    } catch (error) {

        console.error(
            "Error creando factura:",
            error
        );


        return res.status(500).json({

            message:
                "Error interno del servidor"

        });

    }

}


// =====================================================
// OBTENER TODAS LAS FACTURAS
// =====================================================

async function getAll(req, res) {

    try {

        const utilityBills =
            await utilityBillService.getUtilityBills(
                req.user.id
            );


        return res.json({

            utility_bills:
                utilityBills

        });

    } catch (error) {

        console.error(
            "Error obteniendo facturas:",
            error
        );


        return res.status(500).json({

            message:
                "Error interno del servidor"

        });

    }

}


// =====================================================
// OBTENER FACTURA POR ID
// =====================================================

async function getOne(req, res) {

    try {

        const utilityBillId =
            Number(req.params.id);


        if (!Number.isInteger(utilityBillId)) {

            return res.status(400).json({

                message:
                    "ID de factura inválido"

            });

        }


        const utilityBill =
            await utilityBillService.getUtilityBillById(

                utilityBillId,

                req.user.id

            );


        if (!utilityBill) {

            return res.status(404).json({

                message:
                    "Factura no encontrada"

            });

        }


        return res.json({

            utility_bill:
                utilityBill

        });

    } catch (error) {

        console.error(
            "Error obteniendo factura:",
            error
        );


        return res.status(500).json({

            message:
                "Error interno del servidor"

        });

    }

}


module.exports = {

    create,

    getAll,

    getOne

};