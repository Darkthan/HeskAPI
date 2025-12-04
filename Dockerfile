# Utiliser Node.js LTS comme image de base
FROM node:20-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances de production
RUN npm install --production --no-optional

# Copier le reste de l'application
COPY . .

# Créer le répertoire pour la base de données
RUN mkdir -p /app/data

# Copier le script d'entrypoint et le rendre exécutable
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Exposer le port de l'application
EXPOSE 3000

# Variable d'environnement pour indiquer qu'on est en production
ENV NODE_ENV=production

# Commande pour démarrer l'application (initialise la DB puis démarre le serveur)
CMD ["/app/docker-entrypoint.sh"]
