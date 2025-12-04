const crypto = require('crypto');

// Algorithme de chiffrement
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Obtenir la clé de chiffrement depuis les variables d'environnement
 * La clé doit faire 32 bytes pour AES-256
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY non définie dans les variables d\'environnement');
  }

  // Créer un hash SHA-256 de la clé pour obtenir exactement 32 bytes
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Chiffrer un texte avec AES-256-CBC
 * @param {string} text - Le texte à chiffrer
 * @returns {string} - Le texte chiffré au format: iv:encryptedData
 */
function encrypt(text) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Retourner l'IV et les données chiffrées séparés par ':'
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Erreur de chiffrement: ${error.message}`);
  }
}

/**
 * Déchiffrer un texte chiffré avec AES-256-CBC
 * @param {string} encryptedText - Le texte chiffré au format: iv:encryptedData
 * @returns {string} - Le texte déchiffré
 */
function decrypt(encryptedText) {
  try {
    const key = getEncryptionKey();

    // Séparer l'IV et les données chiffrées
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      throw new Error('Format de données chiffrées invalide');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Erreur de déchiffrement: ${error.message}`);
  }
}

module.exports = {
  encrypt,
  decrypt
};
