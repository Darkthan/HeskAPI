const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');

class AuthController {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username et password requis' });
      }

      const user = await db.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Mots de passe requis' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      }

      const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

      const validPassword = await bcrypt.compare(currentPassword, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );

      res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({ error: 'Erreur lors du changement de mot de passe' });
    }
  }
}

module.exports = new AuthController();
