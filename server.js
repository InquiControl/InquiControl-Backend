require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { poolPromise } = require("./src/config/database");

const authRoutes = require("./src/routes/authRoutes");

const propertyRoutes =require("./src/routes/propertyRoutes");

const unitRoutes = require("./src/routes/unitRoutes");

const tenantRoutes = require("./src/routes/tenantRoutes");

const paymentRoutes = require("./src/routes/paymentRoutes");

const chargeRoutes = require("./src/routes/chargeRoutes");

const utilityBillRoutes = require("./src/routes/utilityBillRoutes");

const meterRoutes = require("./src/routes/meterRoutes");

const meterReadingRoutes = require("./src/routes/meterReadingRoutes");

const app = express();


const PORT = process.env.PORT || 3000;


// Middlewares
app.use(cors());

app.use(express.json());


// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/charges", chargeRoutes);
app.use("/api/utility-bills", utilityBillRoutes);
app.use("/api/meters", meterRoutes);
app.use("/api/meter-readings", meterReadingRoutes);
// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        application: "InquiControl API"
    });
});


// Iniciar servidor
async function startServer() {

    try {

        await poolPromise;

        app.listen(PORT, () => {
            console.log(
                `InquiControl API ejecutándose en http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            " No se pudo iniciar el servidor:",
            error
        );

        process.exit(1);
    }
}

startServer();