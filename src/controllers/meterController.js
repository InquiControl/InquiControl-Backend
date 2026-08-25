const meterService = require("../services/meterService");


async function getAll(req, res) {
    try {

        const meters = await meterService.getMeters(
            req.user.id
        );

        res.json({
            meters
        });

    } catch (error) {

        console.error("Error obteniendo medidores:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getOne(req, res) {
    try {

        const meterId = Number(req.params.id);

        if (!Number.isInteger(meterId)) {
            return res.status(400).json({
                message: "ID de medidor inválido"
            });
        }

        const meter = await meterService.getMeterById(
            meterId,
            req.user.id
        );

        if (!meter) {
            return res.status(404).json({
                message: "Medidor no encontrado"
            });
        }

        res.json({
            meter
        });

    } catch (error) {

        console.error("Error obteniendo medidor:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function create(req, res) {
    try {

        const {
            property_id,
            unit_id,
            type,
            code,
            measurement_unit,
            is_shared,
            provider
        } = req.body;

        if (
            !property_id ||
            !type ||
            !code ||
            !measurement_unit
        ) {
            return res.status(400).json({
                message:
                    "property_id, type, code y measurement_unit son obligatorios"
            });
        }

        const meter = await meterService.createMeter(
            Number(property_id),
            unit_id !== undefined && unit_id !== null
                ? Number(unit_id)
                : null,
            type,
            code,
            measurement_unit,
            is_shared,
            provider,
            req.user.id
        );

        if (!meter) {
            return res.status(404).json({
                message: "Propiedad no encontrada"
            });
        }

        res.status(201).json({
            message: "Medidor creado correctamente",
            meter
        });

    } catch (error) {

        console.error("Error creando medidor:", error);

        if (
            error.message ===
            "La unidad no pertenece a la propiedad"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function update(req, res) {
    try {

        const meterId = Number(req.params.id);

        if (!Number.isInteger(meterId)) {
            return res.status(400).json({
                message: "ID de medidor inválido"
            });
        }

        const {
            property_id,
            unit_id,
            type,
            code,
            measurement_unit,
            is_shared,
            provider
        } = req.body;

        if (
            !property_id ||
            !type ||
            !code ||
            !measurement_unit
        ) {
            return res.status(400).json({
                message:
                    "property_id, type, code y measurement_unit son obligatorios"
            });
        }

        const meter = await meterService.updateMeter(
            meterId,
            Number(property_id),
            unit_id !== undefined && unit_id !== null
                ? Number(unit_id)
                : null,
            type,
            code,
            measurement_unit,
            is_shared,
            provider,
            req.user.id
        );

        if (!meter) {
            return res.status(404).json({
                message: "Medidor no encontrado"
            });
        }

        res.json({
            message: "Medidor actualizado correctamente",
            meter
        });

    } catch (error) {

        console.error("Error actualizando medidor:", error);

        if (
            error.message ===
            "La unidad no pertenece a la propiedad"
        ) {
            return res.status(400).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function remove(req, res) {
    try {

        const meterId = Number(req.params.id);

        if (!Number.isInteger(meterId)) {
            return res.status(400).json({
                message: "ID de medidor inválido"
            });
        }

        const meter = await meterService.deleteMeter(
            meterId,
            req.user.id
        );

        if (!meter) {
            return res.status(404).json({
                message: "Medidor no encontrado"
            });
        }

        res.json({
            message: "Medidor eliminado correctamente"
        });

    } catch (error) {

        console.error("Error eliminando medidor:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


module.exports = {
    getAll,
    getOne,
    create,
    update,
    remove
};