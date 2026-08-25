const express = require("express");

const router = express.Router();

const chargeController =
    require("../controllers/chargeController");

const authenticateToken =
    require("../middleware/authMiddleware");


// Generar cargos de una factura
router.post(
    "/generate/:utilityBillId",
    authenticateToken,
    chargeController.generate
);


// Obtener todos los cargos
router.get(
    "/",
    authenticateToken,
    chargeController.getAll
);


// Obtener un cargo por ID
router.get(
    "/:id",
    authenticateToken,
    chargeController.getOne
);


module.exports = router;