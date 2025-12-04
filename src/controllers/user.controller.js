const db = require('../database/db');
const bcrypt = require('bcryptjs');

class UserController {
  /**
   * Récupérer tous les utilisateurs (sans les mots de passe)
   */
  async getUsers(req, res) {
    try {
      const users = await db.all('SELECT id, username, created_at FROM users ORDER BY created_at DESC');
      res.json({ users });
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  }

  /**
   * Créer un nouvel utilisateur
   */
  async createUser(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username et password requis' });
      }

      // Vérifier que le username n'existe pas déjà
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUser) {
        return res.status(409).json({ error: 'Cet utilisateur existe déjà' });
      }

      // Valider la complexité du mot de passe
      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const result = await db.run(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [username, hashedPassword]
      );

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        user: {
          id: result.lastID,
          username
        }
      });
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
  }

  /**
   * Modifier le mot de passe d'un utilisateur
   */
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Nouveau mot de passe requis' });
      }

      // Valider la complexité du mot de passe
      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
      }

      // Vérifier que l'utilisateur existe
      const user = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mettre à jour le mot de passe
      await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

      res.json({
        message: 'Mot de passe modifié avec succès',
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Erreur modification mot de passe:', error);
      res.status(500).json({ error: 'Erreur lors de la modification du mot de passe' });
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Vérifier que l'utilisateur existe
      const user = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Empêcher la suppression si c'est le dernier utilisateur
      const userCount = await db.get('SELECT COUNT(*) as count FROM users');
      if (userCount.count <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier utilisateur' });
      }

      // Empêcher un utilisateur de se supprimer lui-même
      if (req.user && req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      // Supprimer l'utilisateur
      await db.run('DELETE FROM users WHERE id = ?', [id]);

      res.json({
        message: 'Utilisateur supprimé avec succès',
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  }
}

module.exports = new UserController();
