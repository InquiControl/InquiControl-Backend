const express = require("express");

const router = express.Router();

const unitController =
    require("../controllers/unitController");

const authenticateToken =
    require("../middleware/authMiddleware");


router.post(
    "/",
    authenticateToken,
    unitController.create
);


router.get(
    "/property/:propertyId",
    authenticateToken,
    unitController.getByProperty
);


router.get(
    "/:id",
    authenticateToken,
    unitController.getOne
);


router.put(
    "/:id",
    authenticateToken,
    unitController.update
);


router.delete(
    "/:id",
    authenticateToken,
    unitController.remove
);


module.exports = router;