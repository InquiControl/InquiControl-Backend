const unitService = require("../services/unitService");


async function create(req, res) {

    try {

        const { property_id, name, status } = req.body;

        if (!property_id || !name) {
            return res.status(400).json({
                message: "property_id y name son obligatorios"
            });
        }

        const unit = await unitService.createUnit(
            Number(property_id),
            req.user.id,
            name,
            status
        );

        if (!unit) {
            return res.status(404).json({
                message: "Propiedad no encontrada"
            });
        }

        res.status(201).json({
            message: "Unidad creada correctamente",
            unit
        });

    } catch (error) {

        console.error("Error creando unidad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getByProperty(req, res) {

    try {

        const propertyId = Number(req.params.propertyId);

        if (!Number.isInteger(propertyId)) {
            return res.status(400).json({
                message: "ID de propiedad inválido"
            });
        }

        const units =
            await unitService.getUnitsByProperty(
                propertyId,
                req.user.id
            );

        if (units === null) {
            return res.status(404).json({
                message: "Propiedad no encontrada"
            });
        }

        res.json({
            units
        });

    } catch (error) {

        console.error("Error obteniendo unidades:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getOne(req, res) {

    try {

        const unitId = Number(req.params.id);

        const unit =
            await unitService.getUnitById(
                unitId,
                req.user.id
            );

        if (!unit) {
            return res.status(404).json({
                message: "Unidad no encontrada"
            });
        }

        res.json({
            unit
        });

    } catch (error) {

        console.error("Error obteniendo unidad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function update(req, res) {

    try {

        const unitId = Number(req.params.id);

        const { name, status } = req.body;

        if (!name || !status) {
            return res.status(400).json({
                message: "name y status son obligatorios"
            });
        }

        const unit =
            await unitService.updateUnit(
                unitId,
                req.user.id,
                name,
                status
            );

        if (!unit) {
            return res.status(404).json({
                message: "Unidad no encontrada"
            });
        }

        res.json({
            message: "Unidad actualizada correctamente",
            unit
        });

    } catch (error) {

        console.error("Error actualizando unidad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function remove(req, res) {

    try {

        const unitId = Number(req.params.id);

        const unit =
            await unitService.deleteUnit(
                unitId,
                req.user.id
            );

        if (!unit) {
            return res.status(404).json({
                message: "Unidad no encontrada"
            });
        }

        res.json({
            message: "Unidad eliminada correctamente"
        });

    } catch (error) {

        console.error("Error eliminando unidad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


module.exports = {
    create,
    getByProperty,
    getOne,
    update,
    remove
};