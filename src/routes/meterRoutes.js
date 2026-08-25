const express = require("express");

const router = express.Router();

const meterController =
    require("../controllers/meterController");

const authenticateToken =
    require("../middleware/authMiddleware");


router.get(
    "/",
    authenticateToken,
    meterController.getAll
);


router.get(
    "/:id",
    authenticateToken,
    meterController.getOne
);


router.post(
    "/",
    authenticateToken,
    meterController.create
);


router.put(
    "/:id",
    authenticateToken,
    meterController.update
);


router.delete(
    "/:id",
    authenticateToken,
    meterController.remove
);


module.exports = router;