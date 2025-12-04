require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './data/database.sqlite';

console.log('📦 Migration: Ajout du champ dark_mode à la table screens');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
    process.exit(1);
  }
  console.log('✅ Connecté à la base de données SQLite');
});

// Ajouter la colonne dark_mode si elle n'existe pas
db.run(`
  ALTER TABLE screens ADD COLUMN dark_mode INTEGER DEFAULT 0
`, (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️  La colonne dark_mode existe déjà');
    } else {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', err);
    }
  } else {
    console.log('✅ Colonne dark_mode ajoutée avec succès');
  }

  db.close((err) => {
    if (err) {
      console.error('❌ Erreur fermeture base de données:', err);
    } else {
      console.log('✅ Migration terminée');
    }
  });
});
