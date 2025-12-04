const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screen.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * /api/screens:
 *   get:
 *     summary: Liste tous les écrans
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des écrans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Screen'
 */
router.get('/', authMiddleware, screenController.getAll);

/**
 * @swagger
 * /api/screens/{id}:
 *   get:
 *     summary: Récupérer un écran par ID
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'écran
 *       404:
 *         description: Écran non trouvé
 */
router.get('/:id', authMiddleware, screenController.getOne);

/**
 * @swagger
 * /api/screens/by-unique-id/{uniqueId}:
 *   get:
 *     summary: Récupérer un écran par son identifiant unique
 *     tags: [Screens]
 *     parameters:
 *       - in: path
 *         name: uniqueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Détails de l'écran
 *       404:
 *         description: Écran non trouvé
 */
router.get('/by-unique-id/:uniqueId', screenController.getByUniqueId);

/**
 * @swagger
 * /api/screens:
 *   post:
 *     summary: Créer un nouvel écran
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - filters
 *             properties:
 *               name:
 *                 type: string
 *               filters:
 *                 type: object
 *               refresh_interval:
 *                 type: integer
 *               display_config:
 *                 type: object
 *     responses:
 *       201:
 *         description: Écran créé
 */
router.post('/', authMiddleware, screenController.create);

/**
 * @swagger
 * /api/screens/{id}:
 *   put:
 *     summary: Mettre à jour un écran
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               filters:
 *                 type: object
 *               refresh_interval:
 *                 type: integer
 *               display_config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Écran mis à jour
 */
router.put('/:id', authMiddleware, screenController.update);

/**
 * @swagger
 * /api/screens/{id}:
 *   delete:
 *     summary: Supprimer un écran
 *     tags: [Screens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Écran supprimé
 */
router.delete('/:id', authMiddleware, screenController.delete);

module.exports = router;
