const express = require("express");

const router = express.Router();

const paymentController =
    require("../controllers/paymentController");

const authenticateToken =
    require("../middleware/authMiddleware");


router.post(
    "/",
    authenticateToken,
    paymentController.create
);


router.get(
    "/",
    authenticateToken,
    paymentController.getAll
);


router.get(
    "/:id",
    authenticateToken,
    paymentController.getOne
);


module.exports = router;