const express = require('express');
const router = express.Router();
const heskConfigController = require('../controllers/hesk-config.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/hesk/config:
 *   get:
 *     summary: Récupérer la configuration HESK
 *     tags: [HESK Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration HESK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HeskConfig'
 */
router.get('/config', authMiddleware, heskConfigController.getConfig);

/**
 * @swagger
 * /api/hesk/config:
 *   put:
 *     summary: Mettre à jour la configuration HESK
 *     tags: [HESK Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - username
 *               - password
 *             properties:
 *               url:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Configuration mise à jour
 */
router.put('/config', authMiddleware, heskConfigController.updateConfig);

/**
 * @swagger
 * /api/hesk/test:
 *   post:
 *     summary: Tester la connexion HESK
 *     tags: [HESK Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *               - username
 *               - password
 *             properties:
 *               url:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Résultat du test
 */
router.post('/test', authMiddleware, heskConfigController.testConfig);

module.exports = router;
