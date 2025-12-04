require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || './data/database.sqlite';
const dbDir = path.dirname(dbPath);

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
  console.log('✅ Connecté à la base de données SQLite');
});

// Créer les tables
db.serialize(() => {
  // Table des utilisateurs admin
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erreur création table users:', err);
    else console.log('✅ Table users créée');
  });

  // Table de configuration HESK
  db.run(`
    CREATE TABLE IF NOT EXISTS hesk_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erreur création table hesk_config:', err);
    else console.log('✅ Table hesk_config créée');
  });

  // Table des écrans
  db.run(`
    CREATE TABLE IF NOT EXISTS screens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unique_id TEXT UNIQUE NOT NULL,
      filters TEXT NOT NULL,
      refresh_interval INTEGER DEFAULT 60,
      display_config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Erreur création table screens:', err);
    else console.log('✅ Table screens créée');
  });

  // Créer l'utilisateur admin par défaut
  const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';

  bcrypt.hash(defaultPassword, 10, (err, hash) => {
    if (err) {
      console.error('❌ Erreur hashage mot de passe:', err);
      db.close();
      return;
    }

    db.run(
      `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
      [defaultUsername, hash],
      function(err) {
        if (err) {
          console.error('❌ Erreur création utilisateur admin:', err);
        } else if (this.changes > 0) {
          console.log('✅ Utilisateur admin créé');
          console.log(`   Username: ${defaultUsername}`);
          console.log(`   Password: ${defaultPassword}`);
        } else {
          console.log('ℹ️  Utilisateur admin existe déjà');
        }

        // Fermer la base de données après l'insertion
        db.close((err) => {
          if (err) {
            console.error('❌ Erreur fermeture base de données:', err);
          } else {
            console.log('✅ Initialisation terminée');
          }
        });
      }
    );
  });
});
