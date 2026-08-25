const express = require("express");

const router = express.Router();

const tenantController =
    require("../controllers/tenantController");

const authenticateToken =
    require("../middleware/authMiddleware");


router.post(
    "/",
    authenticateToken,
    tenantController.create
);


router.get(
    "/unit/:unitId",
    authenticateToken,
    tenantController.getByUnit
);


router.get(
    "/:id",
    authenticateToken,
    tenantController.getOne
);


router.put(
    "/:id",
    authenticateToken,
    tenantController.update
);


router.delete(
    "/:id",
    authenticateToken,
    tenantController.remove
);


module.exports = router;