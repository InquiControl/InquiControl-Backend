const express = require("express");

const router = express.Router();

const propertyController =
    require("../controllers/propertyController");

const authenticateToken =
    require("../middleware/authMiddleware");


router.post(
    "/",
    authenticateToken,
    propertyController.create
);


router.get(
    "/",
    authenticateToken,
    propertyController.getAll
);


router.get(
    "/:id",
    authenticateToken,
    propertyController.getOne
);


router.put(
    "/:id",
    authenticateToken,
    propertyController.update
);


router.delete(
    "/:id",
    authenticateToken,
    propertyController.remove
);


module.exports = router;