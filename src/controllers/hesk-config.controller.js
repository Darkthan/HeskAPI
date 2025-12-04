const db = require('../database/db');
const { encrypt } = require('../utils/encryption');

class HeskConfigController {
  async getConfig(req, res) {
    try {
      const config = await db.get('SELECT id, url, username, created_at, updated_at FROM hesk_config ORDER BY id DESC LIMIT 1');

      if (!config) {
        return res.json({ configured: false });
      }

      res.json({
        configured: true,
        config: {
          id: config.id,
          url: config.url,
          username: config.username,
          created_at: config.created_at,
          updated_at: config.updated_at
        }
      });
    } catch (error) {
      console.error('Erreur récupération config:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de la configuration' });
    }
  }

  async updateConfig(req, res) {
    try {
      const { url, username, password } = req.body;

      if (!url || !username || !password) {
        return res.status(400).json({ error: 'URL, username et password requis' });
      }

      // Valider l'URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'URL invalide' });
      }

      // Chiffrer le mot de passe (réversible pour l'authentification HESK)
      const encryptedPassword = encrypt(password);

      // Vérifier si une config existe
      const existingConfig = await db.get('SELECT id FROM hesk_config ORDER BY id DESC LIMIT 1');

      if (existingConfig) {
        // Mettre à jour
        await db.run(
          'UPDATE hesk_config SET url = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [url, username, encryptedPassword, existingConfig.id]
        );

        res.json({
          message: 'Configuration HESK mise à jour',
          config: {
            id: existingConfig.id,
            url,
            username
          }
        });
      } else {
        // Créer
        const result = await db.run(
          'INSERT INTO hesk_config (url, username, password) VALUES (?, ?, ?)',
          [url, username, encryptedPassword]
        );

        res.json({
          message: 'Configuration HESK créée',
          config: {
            id: result.id,
            url,
            username
          }
        });
      }
    } catch (error) {
      console.error('Erreur mise à jour config:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
    }
  }

  async testConfig(req, res) {
    try {
      const { url, username, password } = req.body;

      if (!url || !username || !password) {
        return res.status(400).json({ error: 'URL, username et password requis' });
      }

      const heskService = require('../services/hesk.service');
      const result = await heskService.testConnection(url, username, password);

      res.json(result);
    } catch (error) {
      console.error('Erreur test config:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du test de connexion',
        details: error.message
      });
    }
  }
}

module.exports = new HeskConfigController();
