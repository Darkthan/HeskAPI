const db = require('../database/db');
const heskService = require('../services/hesk.service');

class TicketController {
  async getTicketsByScreen(req, res) {
    try {
      const { uniqueId } = req.params;

      // Récupérer la configuration de l'écran
      const screen = await db.get('SELECT * FROM screens WHERE unique_id = ?', [uniqueId]);

      if (!screen) {
        return res.status(404).json({ error: 'Écran non trouvé' });
      }

      // Récupérer la configuration HESK
      const heskConfig = await db.get('SELECT * FROM hesk_config ORDER BY id DESC LIMIT 1');

      if (!heskConfig) {
        return res.status(503).json({ error: 'Configuration HESK non trouvée' });
      }

      // Récupérer les tickets depuis HESK
      const filters = JSON.parse(screen.filters);
      const tickets = await heskService.getTickets(
        heskConfig.url,
        heskConfig.username,
        heskConfig.password,
        filters
      );

      res.json({
        screen: {
          name: screen.name,
          refresh_interval: screen.refresh_interval,
          display_config: screen.display_config ? JSON.parse(screen.display_config) : null
        },
        tickets,
        fetched_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur récupération tickets:', error);
      res.status(500).json({
        error: 'Erreur lors de la récupération des tickets',
        details: error.message
      });
    }
  }
}

module.exports = new TicketController();
