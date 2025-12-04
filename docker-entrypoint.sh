#!/bin/sh
set -e

echo "🔧 Initialisation de la base de données..."
node /app/src/database/init.js

echo "🔄 Migration de la base de données..."
node /app/src/database/migrate-add-dark-mode.js

echo "🚀 Démarrage du serveur..."
exec node /app/src/server.js
