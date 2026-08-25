const express = require("express");

const router = express.Router();

const meterReadingController =
    require("../controllers/meterReadingController");

const authenticateToken =
    require("../middleware/authMiddleware");


// Todas las lecturas
router.get(
    "/",
    authenticateToken,
    meterReadingController.getAll
);


// Lecturas de un medidor
router.get(
    "/meter/:meterId",
    authenticateToken,
    meterReadingController.getByMeter
);


// Una lectura específica
router.get(
    "/:id",
    authenticateToken,
    meterReadingController.getOne
);


// Crear lectura
router.post(
    "/",
    authenticateToken,
    meterReadingController.create
);


// Actualizar lectura
router.put(
    "/:id",
    authenticateToken,
    meterReadingController.update
);


// Eliminar lectura
router.delete(
    "/:id",
    authenticateToken,
    meterReadingController.remove
);


module.exports = router;