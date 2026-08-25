const tenantService = require("../services/tenantService");


async function create(req, res) {
    try {

        const {
            unit_id,
            name,
            lastname,
            dni,
            phone,
            start_date,
            end_date,
            status
        } = req.body;

        if (!unit_id || !name || !lastname || !start_date) {
            return res.status(400).json({
                message: "unit_id, name, lastname y start_date son obligatorios"
            });
        }

        const tenant = await tenantService.createTenant(
            Number(unit_id),
            req.user.id,
            name,
            lastname,
            dni,
            phone,
            start_date,
            end_date,
            status
        );

        if (!tenant) {
            return res.status(404).json({
                message: "Unidad no encontrada"
            });
        }

        res.status(201).json({
            message: "Inquilino creado correctamente",
            tenant
        });

    } catch (error) {

        console.error("Error creando inquilino:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getByUnit(req, res) {
    try {

        const unitId = Number(req.params.unitId);

        if (!Number.isInteger(unitId)) {
            return res.status(400).json({
                message: "ID de unidad inválido"
            });
        }

        const tenants = await tenantService.getTenantsByUnit(
            unitId,
            req.user.id
        );

        if (tenants === null) {
            return res.status(404).json({
                message: "Unidad no encontrada"
            });
        }

        res.json({
            tenants
        });

    } catch (error) {

        console.error("Error obteniendo inquilinos:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function getOne(req, res) {
    try {

        const tenantId = Number(req.params.id);

        if (!Number.isInteger(tenantId)) {
            return res.status(400).json({
                message: "ID de inquilino inválido"
            });
        }

        const tenant = await tenantService.getTenantById(
            tenantId,
            req.user.id
        );

        if (!tenant) {
            return res.status(404).json({
                message: "Inquilino no encontrado"
            });
        }

        res.json({
            tenant
        });

    } catch (error) {

        console.error("Error obteniendo inquilino:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function update(req, res) {
    try {

        const tenantId = Number(req.params.id);

        const {
            name,
            lastname,
            dni,
            phone,
            start_date,
            end_date,
            status
        } = req.body;

        if (!name || !lastname || !start_date || !status) {
            return res.status(400).json({
                message: "name, lastname, start_date y status son obligatorios"
            });
        }

        const tenant = await tenantService.updateTenant(
            tenantId,
            req.user.id,
            name,
            lastname,
            dni,
            phone,
            start_date,
            end_date,
            status
        );

        if (!tenant) {
            return res.status(404).json({
                message: "Inquilino no encontrado"
            });
        }

        res.json({
            message: "Inquilino actualizado correctamente",
            tenant
        });

    } catch (error) {

        console.error("Error actualizando inquilino:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


async function remove(req, res) {
    try {

        const tenantId = Number(req.params.id);

        if (!Number.isInteger(tenantId)) {
            return res.status(400).json({
                message: "ID de inquilino inválido"
            });
        }

        const tenant = await tenantService.deleteTenant(
            tenantId,
            req.user.id
        );

        if (!tenant) {
            return res.status(404).json({
                message: "Inquilino no encontrado"
            });
        }

        res.json({
            message: "Inquilino eliminado correctamente"
        });

    } catch (error) {

        console.error("Error eliminando inquilino:", error);

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


module.exports = {
    create,
    getByUnit,
    getOne,
    update,
    remove
};