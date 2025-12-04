const axios = require('axios');
const cheerio = require('cheerio');
const { decrypt } = require('../utils/encryption');

class HeskService {
  constructor() {
    this.sessions = new Map(); // Cache des sessions pour éviter de se reconnecter à chaque fois
  }

  /**
   * Se connecter à HESK et obtenir un cookie de session
   */
  async login(baseUrl, username, password) {
    try {
      const loginUrl = `${baseUrl}/admin/index.php`;

      // Première requête pour obtenir le formulaire et les cookies
      const initResponse = await axios.get(loginUrl, {
        maxRedirects: 5,
        validateStatus: () => true
      });

      // Extraction du token CSRF si présent
      const $ = cheerio.load(initResponse.data);
      const csrfToken = $('input[name="token"]').val();

      // Connexion
      const loginData = new URLSearchParams({
        user: username,
        pass: password,
        remember: 'CHECKED',
        a: 'do_login'
      });

      if (csrfToken) {
        loginData.append('token', csrfToken);
      }

      const loginResponse = await axios.post(loginUrl, loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': initResponse.headers['set-cookie']?.join('; ') || ''
        },
        maxRedirects: 0,
        validateStatus: () => true
      });

      // Récupérer les cookies de session
      const cookies = loginResponse.headers['set-cookie'];

      // Vérifier les messages d'erreur en anglais et français
      const hasError = loginResponse.data.includes('Wrong username or password') ||
                      loginResponse.data.includes('Nom d\'utilisateur ou mot de passe incorrect') ||
                      loginResponse.data.includes('Identifiant ou mot de passe incorrect') ||
                      loginResponse.data.includes('Mauvais nom d\'utilisateur ou mot de passe');

      if (!cookies || hasError) {
        throw new Error('Identifiants HESK invalides');
      }

      return cookies.join('; ');
    } catch (error) {
      throw new Error(`Erreur de connexion HESK: ${error.message}`);
    }
  }

  /**
   * Récupérer les tickets depuis HESK
   */
  async getTickets(baseUrl, username, encryptedPassword, filters = {}) {
    try {
      // Déchiffrer le mot de passe
      const password = decrypt(encryptedPassword);

      // Se connecter
      const sessionCookie = await this.login(baseUrl, username, password);

      // Récupérer la liste des tickets depuis admin_main.php
      const ticketsUrl = `${baseUrl}/admin/admin_main.php`;
      const response = await axios.get(ticketsUrl, {
        headers: {
          'Cookie': sessionCookie
        }
      });

      // Parser le HTML
      const $ = cheerio.load(response.data);
      const tickets = [];

      // Sélectionner le tableau des tickets (structure HESK française)
      $('table.ticket-list tbody tr').each((i, row) => {
        const $row = $(row);
        const cols = $row.find('td');

        if (cols.length === 0) return;

        // Extraire l'ID du ticket (colonne 2)
        const id = $(cols[1]).text().trim();

        // Extraire la date de mise à jour (colonne 3)
        const updated_at = $(cols[2]).text().trim();

        // Extraire le nom (colonne 4)
        const name = $(cols[3]).text().trim();

        // Extraire le sujet (colonne 5)
        const subjectLink = $(cols[4]).find('a.link');
        const subject = subjectLink.text().trim();

        // Extraire le statut (colonne 6)
        const statusSpan = $(cols[5]).find('span');
        const status = statusSpan.text().trim();

        // Extraire la salle (colonne 7)
        const room = $(cols[6]).text().trim();

        // Extraire la priorité (colonne 8)
        const priorityDiv = $(cols[7]).find('.dropdown.priority');
        const priorityValue = priorityDiv.attr('data-value');
        const priorityText = priorityDiv.find('.label span').text().trim();

        // Vérifier que nous avons au moins un ID
        if (!id) return;

        const ticket = {
          id: id,
          subject: subject || 'Sans sujet',
          status: status || 'Inconnu',
          priority: priorityText || 'Non définie',
          priority_value: priorityValue || 'unknown',
          category: '', // Pas directement visible dans le tableau
          room: room,
          name: name,
          updated_at: updated_at,
          created_at: '', // Pas directement visible dans le tableau
          owner: '' // Nécessiterait de parser plus en détail
        };

        // Appliquer les filtres
        let matches = true;

        if (filters.status && filters.status.length > 0) {
          // Filtrer sur le statut
          matches = matches && filters.status.some(s =>
            ticket.status.toLowerCase().includes(s.toLowerCase()) ||
            s.toLowerCase().includes(ticket.status.toLowerCase())
          );
        }

        if (filters.priority && filters.priority.length > 0) {
          // Filtrer sur la priorité
          matches = matches && filters.priority.some(p =>
            ticket.priority.toLowerCase().includes(p.toLowerCase()) ||
            p.toLowerCase().includes(ticket.priority.toLowerCase()) ||
            ticket.priority_value === p.toLowerCase()
          );
        }

        if (filters.room && filters.room.length > 0) {
          // Filtrer sur la salle
          matches = matches && filters.room.some(r =>
            ticket.room.toLowerCase().includes(r.toLowerCase())
          );
        }

        if (matches) {
          tickets.push(ticket);
        }
      });

      return tickets;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des tickets: ${error.message}`);
    }
  }

  /**
   * Tester la connexion HESK
   */
  async testConnection(baseUrl, username, password) {
    try {
      const sessionCookie = await this.login(baseUrl, username, password);

      // Vérifier qu'on peut accéder à la page d'admin
      const testResponse = await axios.get(`${baseUrl}/admin/admin_main.php`, {
        headers: {
          'Cookie': sessionCookie
        },
        maxRedirects: 5
      });

      if (testResponse.status === 200 && !testResponse.data.includes('login')) {
        return {
          success: true,
          message: 'Connexion HESK réussie'
        };
      } else {
        throw new Error('Impossible d\'accéder à l\'interface admin');
      }
    } catch (error) {
      return {
        success: false,
        message: 'Échec de la connexion',
        error: error.message
      };
    }
  }
}

module.exports = new HeskService();
