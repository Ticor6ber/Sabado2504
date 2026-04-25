const express = require('express');
const cors = require('cors');

// 🔥 Swagger
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors({
    origin: "*"
}));
app.use(express.json());

/* =========================
   🔧 CONFIGURACIÓN SWAGGER
========================= */
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Calculadora de Productos',
            version: '1.0.0',
            description: 'Microservicio que calcula el valor final aplicando descuento antes del IVA'
        },
        servers: [
    {
        url: 'https://sabado2504.onrender.com'
    }
]
    },
    apis: ['./server.js']
};

const swaggerSpec = swaggerJsdoc(options);

// Ruta Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* =========================
   🔒 VALIDACIÓN
========================= */
const esNumeroValido = (valor) => {
    return typeof valor === 'number' && !isNaN(valor) && isFinite(valor);
};

/**
 * @swagger
 * /calcular:
 *   post:
 *     summary: Calcula el valor final de un producto
 *     description: Aplica primero descuento y luego IVA
 *     tags:
 *       - Productos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *               - costoBase
 *               - IVA
 *               - descuentos
 *             properties:
 *               codigo:
 *                 type: string
 *                 example: "A1"
 *               nombre:
 *                 type: string
 *                 example: "Laptop"
 *               costoBase:
 *                 type: number
 *                 example: 100000
 *               IVA:
 *                 type: number
 *                 example: 19
 *               descuentos:
 *                 type: number
 *                 example: 15
 *     responses:
 *       200:
 *         description: Cálculo exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigo:
 *                   type: string
 *                 nombre:
 *                   type: string
 *                 costoBase:
 *                   type: number
 *                 descuento:
 *                   type: object
 *                   properties:
 *                     porcentaje:
 *                       type: number
 *                     valor:
 *                       type: number
 *                 subtotal:
 *                   type: number
 *                 IVA:
 *                   type: object
 *                   properties:
 *                     porcentaje:
 *                       type: number
 *                     valor:
 *                       type: number
 *                 valorFinal:
 *                   type: number
 *       400:
 *         description: Error en los datos enviados
 */
app.post('/calcular', (req, res) => {
    const { codigo, nombre, costoBase, IVA, descuentos } = req.body;

    if (!codigo || !nombre) {
        return res.status(400).json({ error: 'Código y nombre son obligatorios' });
    }

    if (!esNumeroValido(costoBase) || !esNumeroValido(IVA) || !esNumeroValido(descuentos)) {
        return res.status(400).json({ error: 'Valores numéricos inválidos' });
    }

    if (IVA < 0 || descuentos < 0 || IVA > 100 || descuentos > 100) {
        return res.status(400).json({ error: 'IVA y descuentos deben estar entre 0 y 100' });
    }

    if (costoBase < 0) {
        return res.status(400).json({ error: 'El costo base no puede ser negativo' });
    }

    // 🧠 Cálculo correcto
    const valorDescuento = Number((costoBase * descuentos / 100).toFixed(2));
    const subtotal = Number((costoBase - valorDescuento).toFixed(2));
    const valorIVA = Number((subtotal * IVA / 100).toFixed(2));
    const valorFinal = Number((subtotal + valorIVA).toFixed(2));

    res.json({
        codigo,
        nombre,
        costoBase,
        descuento: {
            porcentaje: descuentos,
            valor: valorDescuento
        },
        subtotal,
        IVA: {
            porcentaje: IVA,
            valor: valorIVA
        },
        valorFinal
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Swagger en http://localhost:${PORT}/api-docs`);
});
