const propertyService = require("../services/propertyService");


async function create(req, res) {

    try {

        const { name, address } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "El nombre de la propiedad es obligatorio"
            });
        }

        const property = await propertyService.createProperty(
            req.user.id,
            name,
            address
        );

        res.status(201).json({
            message: "Propiedad creada correctamente",
            property
        });

    } catch (error) {

        console.error("Error creando propiedad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getAll(req, res) {

    try {

        const properties = await propertyService.getProperties(
            req.user.id
        );

        res.json({
            properties
        });

    } catch (error) {

        console.error("Error obteniendo propiedades:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getOne(req, res) {

    try {

        const propertyId = Number(req.params.id);

        if (!Number.isInteger(propertyId)) {
            return res.status(400).json({
                message: "ID de propiedad inválido"
            });
        }

        const property =
            await propertyService.getPropertyById(
                propertyId,
                req.user.id
            );

        if (!property) {
            return res.status(404).json({
                message: "Propiedad no encontrada"
            });
        }

        res.json({
            property
        });

    } catch (error) {

        console.error("Error obteniendo propiedad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function update(req, res) {

    try {

        const propertyId = Number(req.params.id);

        const { name, address } = req.body;

        if (!Number.isInteger(propertyId)) {
            return res.status(400).json({
                message: "ID de propiedad inválido"
            });
        }

        if (!name) {
            return res.status(400).json({
                message: "El nombre es obligatorio"
            });
        }

        const property =
            await propertyService.updateProperty(
                propertyId,
                req.user.id,
                name,
                address
            );

        if (!property) {
            return res.status(404).json({
                message: "Propiedad no encontrada"
            });
        }

        res.json({
            message: "Propiedad actualizada correctamente",
            property
        });

    } catch (error) {

        console.error("Error actualizando propiedad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function remove(req, res) {

    try {

        const propertyId = Number(req.params.id);

        if (!Number.isInteger(propertyId)) {
            return res.status(400).json({
                message: "ID de propiedad inválido"
            });
        }

        const property =
            await propertyService.deleteProperty(
                propertyId,
                req.user.id
            );

        if (!property) {
            return res.status(404).json({
                message: "Propiedad no encontrada"
            });
        }

        res.json({
            message: "Propiedad eliminada correctamente"
        });

    } catch (error) {

        console.error("Error eliminando propiedad:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


module.exports = {
    create,
    getAll,
    getOne,
    update,
    remove
};