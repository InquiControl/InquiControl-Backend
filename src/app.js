const express = require("express");
const cors = require("cors");

const { poolPromise } = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const unitRoutes = require("./routes/unitRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const meterRoutes = require("./src/routes/meterRoutes");
const meterReadingRoutes = require("./src/routes/meterReadingRoutes");
const app = express();

app.use(cors());
app.use(express.json());


// ================================
// RUTA PRINCIPAL
// ================================

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        application: "InquiControl API"
    });
});


// ================================
// HEALTH CHECK DE BASE DE DATOS
// ================================

app.get("/health/database", async (req, res) => {

    try {

        const pool = await poolPromise;

        const result = await pool
            .request()
            .query("SELECT DB_NAME() AS databaseName");

        res.json({
            status: "connected",
            database: result.recordset[0].databaseName
        });

    } catch (error) {

        console.error("Error verificando base de datos:", error);

        res.status(500).json({
            status: "error",
            message: "No se pudo conectar a la base de datos"
        });

    }

});


// ================================
// RUTAS DE LA API
// ================================

app.use("/api/auth", authRoutes);

app.use("/api/properties", propertyRoutes);

app.use("/api/units", unitRoutes);

app.use("/api/tenants", tenantRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/meters", meterRoutes);

app.use("/api/meter-readings", meterReadingRoutes);

module.exports = app;
