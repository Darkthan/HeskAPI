const API_URL = window.location.origin;
let screenConfig = null;
let refreshInterval = null;
let countdownInterval = null;
let secondsUntilRefresh = 0;

// Get unique ID from URL
const urlPath = window.location.pathname;
const uniqueId = urlPath.split('/').pop();

// Elements
const loadingEl = document.getElementById('loading');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');
const screenContainer = document.getElementById('screen-container');
const screenTitle = document.getElementById('screen-title');
const ticketCount = document.getElementById('ticket-count');
const lastUpdate = document.getElementById('last-update');
const refreshCountdown = document.getElementById('refresh-countdown');
const ticketsContainer = document.getElementById('tickets-container');
const filtersBar = document.getElementById('filters-bar');

// Init
document.addEventListener('DOMContentLoaded', async () => {
    await loadScreen();
});

async function loadScreen() {
    try {
        // Charger la configuration de l'écran
        const screenResponse = await fetch(`${API_URL}/api/screens/by-unique-id/${uniqueId}`);

        if (!screenResponse.ok) {
            throw new Error('Écran non trouvé');
        }

        screenConfig = await screenResponse.json();

        // Mettre à jour le titre
        screenTitle.textContent = screenConfig.name;
        document.title = screenConfig.name;

        // Afficher les filtres actifs
        displayFilters();

        // Charger les tickets
        await loadTickets();

        // Configurer le rafraîchissement automatique
        secondsUntilRefresh = screenConfig.refresh_interval;
        startRefreshCountdown();

        refreshInterval = setInterval(() => {
            loadTickets();
            secondsUntilRefresh = screenConfig.refresh_interval;
        }, screenConfig.refresh_interval * 1000);

        // Afficher l'écran
        loadingEl.style.display = 'none';
        screenContainer.style.display = 'block';

    } catch (error) {
        showError(error.message || 'Erreur lors du chargement de l\'écran');
    }
}

async function loadTickets() {
    try {
        const response = await fetch(`${API_URL}/api/tickets/${uniqueId}`);

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des tickets');
        }

        const data = await response.json();

        displayTickets(data.tickets);
        updateLastUpdate(data.fetched_at);

    } catch (error) {
        console.error('Erreur chargement tickets:', error);
        showError('Erreur lors du chargement des tickets');
    }
}

function displayFilters() {
    if (!screenConfig || !screenConfig.filters) return;

    const filters = screenConfig.filters;
    let html = '<div class="filter-label">Filtres actifs:</div>';

    if (filters.status?.length > 0) {
        html += '<div class="filter-group">';
        html += '<span class="filter-label">Statuts:</span>';
        filters.status.forEach(status => {
            html += `<span class="filter-tag">${escapeHtml(status)}</span>`;
        });
        html += '</div>';
    }

    if (filters.category?.length > 0) {
        html += '<div class="filter-group">';
        html += '<span class="filter-label">Catégories:</span>';
        filters.category.forEach(cat => {
            html += `<span class="filter-tag">${escapeHtml(cat)}</span>`;
        });
        html += '</div>';
    }

    if (filters.priority?.length > 0) {
        html += '<div class="filter-group">';
        html += '<span class="filter-label">Priorités:</span>';
        filters.priority.forEach(pri => {
            html += `<span class="filter-tag">${escapeHtml(pri)}</span>`;
        });
        html += '</div>';
    }

    filtersBar.innerHTML = html;
}

function displayTickets(tickets) {
    ticketCount.textContent = `${tickets.length} ticket${tickets.length > 1 ? 's' : ''}`;

    if (tickets.length === 0) {
        ticketsContainer.innerHTML = `
            <div class="empty-state">
                <h2>Aucun ticket</h2>
                <p>Il n'y a aucun ticket correspondant aux filtres actuels.</p>
            </div>
        `;
        return;
    }

    ticketsContainer.innerHTML = tickets.map(ticket => {
        const priorityClass = getPriorityClass(ticket.priority);
        const statusClass = getStatusClass(ticket.status);

        return `
            <div class="ticket-card ${priorityClass}">
                <div class="ticket-header">
                    <span class="ticket-id">#${escapeHtml(ticket.id)}</span>
                    <span class="ticket-status ${statusClass}">${escapeHtml(ticket.status)}</span>
                </div>
                <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
                <div class="ticket-meta">
                    <span class="ticket-meta-label">Catégorie:</span>
                    <span class="ticket-meta-value">
                        <span class="ticket-category">${escapeHtml(ticket.category)}</span>
                    </span>

                    <span class="ticket-meta-label">Priorité:</span>
                    <span class="ticket-meta-value">
                        <span class="ticket-priority ${getPriorityClass(ticket.priority)}">${escapeHtml(ticket.priority)}</span>
                    </span>

                    ${ticket.owner ? `
                        <span class="ticket-meta-label">Assigné à:</span>
                        <span class="ticket-meta-value">${escapeHtml(ticket.owner)}</span>
                    ` : ''}
                </div>
                <div class="ticket-dates">
                    <span>Créé: ${escapeHtml(ticket.created_at)}</span>
                    <span>MAJ: ${escapeHtml(ticket.updated_at)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateLastUpdate(timestamp) {
    const date = new Date(timestamp);
    lastUpdate.textContent = `Dernière mise à jour: ${date.toLocaleTimeString('fr-FR')}`;
}

function startRefreshCountdown() {
    countdownInterval = setInterval(() => {
        secondsUntilRefresh--;

        if (secondsUntilRefresh <= 0) {
            refreshCountdown.textContent = 'Rafraîchissement...';
        } else {
            refreshCountdown.textContent = `Prochain rafraîchissement dans ${secondsUntilRefresh}s`;
        }
    }, 1000);
}

function getPriorityClass(priority) {
    const p = priority.toLowerCase();
    if (p.includes('high') || p.includes('haute') || p.includes('élevé')) return 'priority-high';
    if (p.includes('medium') || p.includes('moyenne') || p.includes('moyen')) return 'priority-medium';
    if (p.includes('low') || p.includes('basse') || p.includes('faible')) return 'priority-low';
    return '';
}

function getStatusClass(status) {
    const s = status.toLowerCase();
    if (s.includes('open') || s.includes('ouvert') || s.includes('new')) return 'open';
    if (s.includes('resolved') || s.includes('résolu')) return 'resolved';
    if (s.includes('progress') || s.includes('cours')) return 'in-progress';
    if (s.includes('closed') || s.includes('fermé')) return 'closed';
    return 'open';
}

function showError(message) {
    loadingEl.style.display = 'none';
    screenContainer.style.display = 'none';
    errorContainer.style.display = 'flex';
    errorText.textContent = message;

    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (countdownInterval) clearInterval(countdownInterval);
});
