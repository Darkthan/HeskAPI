const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

/**
 * @swagger
 * /api/tickets/{uniqueId}:
 *   get:
 *     summary: Récupérer les tickets pour un écran
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: uniqueId
 *         required: true
 *         schema:
 *           type: string
 *         description: L'identifiant unique de l'écran
 *     responses:
 *       200:
 *         description: Liste des tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 screen:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     refresh_interval:
 *                       type: integer
 *                 tickets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *                 fetched_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Écran non trouvé
 */
router.get('/:uniqueId', ticketController.getTicketsByScreen);

module.exports = router;
