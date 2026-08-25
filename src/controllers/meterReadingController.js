const meterReadingService =
    require("../services/meterReadingService");


// =====================================================
// GET /api/meter-readings
// =====================================================

async function getAll(req, res) {
    try {

        const readings =
            await meterReadingService.getMeterReadings(
                req.user.id
            );

        res.json({
            meter_readings: readings
        });

    } catch (error) {

        console.error(
            "Error obteniendo lecturas:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


// =====================================================
// GET /api/meter-readings/:id
// =====================================================

async function getOne(req, res) {
    try {

        const readingId =
            Number(req.params.id);

        if (!Number.isInteger(readingId)) {
            return res.status(400).json({
                message: "ID de lectura inválido"
            });
        }

        const reading =
            await meterReadingService.getMeterReadingById(
                readingId,
                req.user.id
            );

        if (!reading) {
            return res.status(404).json({
                message: "Lectura no encontrada"
            });
        }

        res.json({
            meter_reading: reading
        });

    } catch (error) {

        console.error(
            "Error obteniendo lectura:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


// =====================================================
// GET /api/meter-readings/meter/:meterId
// =====================================================

async function getByMeter(req, res) {
    try {

        const meterId =
            Number(req.params.meterId);

        if (!Number.isInteger(meterId)) {
            return res.status(400).json({
                message: "ID de medidor inválido"
            });
        }

        const readings =
            await meterReadingService.getReadingsByMeter(
                meterId,
                req.user.id
            );

        if (readings === null) {
            return res.status(404).json({
                message: "Medidor no encontrado"
            });
        }

        res.json({
            meter_readings: readings
        });

    } catch (error) {

        console.error(
            "Error obteniendo lecturas del medidor:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


// =====================================================
// POST /api/meter-readings
// =====================================================

async function create(req, res) {
    try {

        const {
            meter_id,
            reading,
            reading_date,
            photo_url
        } = req.body;

        if (
            !meter_id ||
            reading === undefined ||
            reading === null ||
            !reading_date
        ) {
            return res.status(400).json({
                message:
                    "meter_id, reading y reading_date son obligatorios"
            });
        }

        const numericReading =
            Number(reading);

        if (
            !Number.isFinite(numericReading) ||
            numericReading < 0
        ) {
            return res.status(400).json({
                message:
                    "reading debe ser un número válido mayor o igual a 0"
            });
        }

        const result =
            await meterReadingService.createMeterReading(
                Number(meter_id),
                numericReading,
                reading_date,
                photo_url,
                req.user.id
            );

        if (!result) {
            return res.status(404).json({
                message: "Medidor no encontrado"
            });
        }

        res.status(201).json({
            message: "Lectura registrada correctamente",
            meter_reading: result
        });

    } catch (error) {

        console.error(
            "Error creando lectura:",
            error
        );

        if (
            error.message ===
            "La lectura no puede ser menor que la lectura anterior"
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


// =====================================================
// PUT /api/meter-readings/:id
// =====================================================

async function update(req, res) {
    try {

        const readingId =
            Number(req.params.id);

        if (!Number.isInteger(readingId)) {
            return res.status(400).json({
                message: "ID de lectura inválido"
            });
        }

        const {
            reading,
            reading_date,
            photo_url
        } = req.body;

        if (
            reading === undefined ||
            reading === null ||
            !reading_date
        ) {
            return res.status(400).json({
                message:
                    "reading y reading_date son obligatorios"
            });
        }

        const numericReading =
            Number(reading);

        if (
            !Number.isFinite(numericReading) ||
            numericReading < 0
        ) {
            return res.status(400).json({
                message:
                    "reading debe ser un número válido mayor o igual a 0"
            });
        }

        const result =
            await meterReadingService.updateMeterReading(
                readingId,
                numericReading,
                reading_date,
                photo_url,
                req.user.id
            );

        if (!result) {
            return res.status(404).json({
                message: "Lectura no encontrada"
            });
        }

        res.json({
            message: "Lectura actualizada correctamente",
            meter_reading: result
        });

    } catch (error) {

        console.error(
            "Error actualizando lectura:",
            error
        );

        if (
            error.message ===
            "La lectura no puede ser menor que la lectura anterior"
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


// =====================================================
// DELETE /api/meter-readings/:id
// =====================================================

async function remove(req, res) {
    try {

        const readingId =
            Number(req.params.id);

        if (!Number.isInteger(readingId)) {
            return res.status(400).json({
                message: "ID de lectura inválido"
            });
        }

        const result =
            await meterReadingService.deleteMeterReading(
                readingId,
                req.user.id
            );

        if (!result) {
            return res.status(404).json({
                message: "Lectura no encontrada"
            });
        }

        res.json({
            message: "Lectura eliminada correctamente"
        });

    } catch (error) {

        console.error(
            "Error eliminando lectura:",
            error
        );

        res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


module.exports = {
    getAll,
    getOne,
    getByMeter,
    create,
    update,
    remove
};