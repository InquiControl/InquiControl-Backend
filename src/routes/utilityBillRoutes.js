const express = require("express");

const router = express.Router();

const utilityBillController =
    require("../controllers/utilityBillController");

const authenticateToken =
    require("../middleware/authMiddleware");


// Crear factura
router.post(
    "/",
    authenticateToken,
    utilityBillController.create
);


// Obtener todas las facturas
router.get(
    "/",
    authenticateToken,
    utilityBillController.getAll
);


// Obtener factura por ID
router.get(
    "/:id",
    authenticateToken,
    utilityBillController.getOne
);


module.exports = router;