const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

class ScreenController {
  async getAll(req, res) {
    try {
      const screens = await db.all('SELECT * FROM screens ORDER BY created_at DESC');

      const formattedScreens = screens.map(screen => ({
        ...screen,
        filters: JSON.parse(screen.filters),
        display_config: screen.display_config ? JSON.parse(screen.display_config) : null
      }));

      res.json(formattedScreens);
    } catch (error) {
      console.error('Erreur récupération écrans:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des écrans' });
    }
  }

  async getOne(req, res) {
    try {
      const { id } = req.params;
      const screen = await db.get('SELECT * FROM screens WHERE id = ?', [id]);

      if (!screen) {
        return res.status(404).json({ error: 'Écran non trouvé' });
      }

      res.json({
        ...screen,
        filters: JSON.parse(screen.filters),
        display_config: screen.display_config ? JSON.parse(screen.display_config) : null
      });
    } catch (error) {
      console.error('Erreur récupération écran:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'écran' });
    }
  }

  async getByUniqueId(req, res) {
    try {
      const { uniqueId } = req.params;
      const screen = await db.get('SELECT * FROM screens WHERE unique_id = ?', [uniqueId]);

      if (!screen) {
        return res.status(404).json({ error: 'Écran non trouvé' });
      }

      res.json({
        ...screen,
        filters: JSON.parse(screen.filters),
        display_config: screen.display_config ? JSON.parse(screen.display_config) : null
      });
    } catch (error) {
      console.error('Erreur récupération écran:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'écran' });
    }
  }

  async create(req, res) {
    try {
      const { name, filters, refresh_interval, display_config, dark_mode } = req.body;

      if (!name || !filters) {
        return res.status(400).json({ error: 'Nom et filtres requis' });
      }

      // Générer un identifiant unique
      const uniqueId = uuidv4().replace(/-/g, '').substring(0, 16);

      const result = await db.run(
        'INSERT INTO screens (name, unique_id, filters, refresh_interval, display_config, dark_mode) VALUES (?, ?, ?, ?, ?, ?)',
        [
          name,
          uniqueId,
          JSON.stringify(filters),
          refresh_interval || 60,
          display_config ? JSON.stringify(display_config) : null,
          dark_mode || 0
        ]
      );

      const screen = await db.get('SELECT * FROM screens WHERE id = ?', [result.id]);

      res.status(201).json({
        message: 'Écran créé avec succès',
        screen: {
          ...screen,
          filters: JSON.parse(screen.filters),
          display_config: screen.display_config ? JSON.parse(screen.display_config) : null,
          url: `${req.protocol}://${req.get('host')}/screen/${uniqueId}`
        }
      });
    } catch (error) {
      console.error('Erreur création écran:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'écran' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, filters, refresh_interval, display_config, dark_mode } = req.body;

      const screen = await db.get('SELECT * FROM screens WHERE id = ?', [id]);

      if (!screen) {
        return res.status(404).json({ error: 'Écran non trouvé' });
      }

      await db.run(
        'UPDATE screens SET name = ?, filters = ?, refresh_interval = ?, display_config = ?, dark_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          name || screen.name,
          filters ? JSON.stringify(filters) : screen.filters,
          refresh_interval !== undefined ? refresh_interval : screen.refresh_interval,
          display_config ? JSON.stringify(display_config) : screen.display_config,
          dark_mode !== undefined ? dark_mode : screen.dark_mode,
          id
        ]
      );

      const updatedScreen = await db.get('SELECT * FROM screens WHERE id = ?', [id]);

      res.json({
        message: 'Écran mis à jour avec succès',
        screen: {
          ...updatedScreen,
          filters: JSON.parse(updatedScreen.filters),
          display_config: updatedScreen.display_config ? JSON.parse(updatedScreen.display_config) : null
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour écran:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'écran' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      const screen = await db.get('SELECT * FROM screens WHERE id = ?', [id]);

      if (!screen) {
        return res.status(404).json({ error: 'Écran non trouvé' });
      }

      await db.run('DELETE FROM screens WHERE id = ?', [id]);

      res.json({ message: 'Écran supprimé avec succès' });
    } catch (error) {
      console.error('Erreur suppression écran:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'écran' });
    }
  }
}

module.exports = new ScreenController();
