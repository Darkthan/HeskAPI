const API_URL = window.location.origin;
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Elements
const loginContainer = document.getElementById('login-container');
const adminContainer = document.getElementById('admin-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const usernameDisplay = document.getElementById('username-display');

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        showAdmin();
        loadInitialData();
    } else {
        showLogin();
    }

    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // HESK Config
    document.getElementById('hesk-config-form').addEventListener('submit', handleHeskConfigSubmit);
    document.getElementById('test-hesk-btn').addEventListener('click', handleTestHesk);

    // Screens
    document.getElementById('create-screen-btn').addEventListener('click', () => openScreenModal());
    document.getElementById('screen-form').addEventListener('submit', handleScreenSubmit);

    // Modal
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeScreenModal);
    });
}

// Auth
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showAdmin();
            loadInitialData();
        } else {
            showError(loginError, data.error || 'Erreur de connexion');
        }
    } catch (error) {
        showError(loginError, 'Erreur de connexion au serveur');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showLogin();
}

function showLogin() {
    loginContainer.style.display = 'block';
    adminContainer.style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    loginError.style.display = 'none';
}

function showAdmin() {
    loginContainer.style.display = 'none';
    adminContainer.style.display = 'block';
    if (currentUser) {
        usernameDisplay.textContent = currentUser.username;
    }
}

// Tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'hesk-config') {
        loadHeskConfig();
    } else if (tabName === 'screens') {
        loadScreens();
    }
}

// Initial Data Load
async function loadInitialData() {
    await loadHeskConfig();
    await loadScreens();
}

// HESK Config
async function loadHeskConfig() {
    try {
        const response = await fetchAPI('/api/hesk/config');
        const data = await response.json();

        const statusBox = document.getElementById('hesk-status');

        if (data.configured) {
            statusBox.className = 'status-box configured';
            statusBox.textContent = `✓ HESK configuré - URL: ${data.config.url} | Username: ${data.config.username}`;

            document.getElementById('hesk-url').value = data.config.url;
            document.getElementById('hesk-username').value = data.config.username;
        } else {
            statusBox.className = 'status-box not-configured';
            statusBox.textContent = '⚠ HESK non configuré - Veuillez saisir les informations ci-dessous';
        }
    } catch (error) {
        console.error('Erreur chargement config HESK:', error);
    }
}

async function handleHeskConfigSubmit(e) {
    e.preventDefault();

    const url = document.getElementById('hesk-url').value;
    const username = document.getElementById('hesk-username').value;
    const password = document.getElementById('hesk-password').value;

    try {
        const response = await fetchAPI('/api/hesk/config', {
            method: 'PUT',
            body: JSON.stringify({ url, username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('hesk-message', data.message, 'success');
            document.getElementById('hesk-password').value = '';
            await loadHeskConfig();
        } else {
            showMessage('hesk-message', data.error, 'error');
        }
    } catch (error) {
        showMessage('hesk-message', 'Erreur lors de la sauvegarde', 'error');
    }
}

async function handleTestHesk() {
    const url = document.getElementById('hesk-url').value;
    const username = document.getElementById('hesk-username').value;
    const password = document.getElementById('hesk-password').value;

    if (!url || !username || !password) {
        showMessage('hesk-message', 'Veuillez remplir tous les champs', 'error');
        return;
    }

    try {
        showMessage('hesk-message', 'Test en cours...', 'success');

        const response = await fetchAPI('/api/hesk/test', {
            method: 'POST',
            body: JSON.stringify({ url, username, password })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('hesk-message', '✓ ' + data.message, 'success');
        } else {
            showMessage('hesk-message', '✗ ' + data.message + (data.error ? ': ' + data.error : ''), 'error');
        }
    } catch (error) {
        showMessage('hesk-message', 'Erreur lors du test', 'error');
    }
}

// Screens
async function loadScreens() {
    try {
        const response = await fetchAPI('/api/screens');
        const screens = await response.json();

        const screensList = document.getElementById('screens-list');

        if (screens.length === 0) {
            screensList.innerHTML = '<p style="color: #999;">Aucun écran créé. Cliquez sur "Nouvel Écran" pour commencer.</p>';
            return;
        }

        screensList.innerHTML = screens.map(screen => `
            <div class="screen-card">
                <h3>${escapeHtml(screen.name)}</h3>
                <div class="screen-info">
                    <p><strong>Rafraîchissement:</strong> ${screen.refresh_interval}s</p>
                    <p><strong>Filtres:</strong></p>
                    <ul style="margin-left: 20px; font-size: 13px;">
                        ${screen.filters.status?.length ? `<li>Statuts: ${screen.filters.status.join(', ')}</li>` : ''}
                        ${screen.filters.category?.length ? `<li>Catégories: ${screen.filters.category.join(', ')}</li>` : ''}
                        ${screen.filters.priority?.length ? `<li>Priorités: ${screen.filters.priority.join(', ')}</li>` : ''}
                    </ul>
                </div>
                <div class="screen-url">
                    ${window.location.origin}/screen/${screen.unique_id}
                </div>
                <div class="screen-actions">
                    <button class="btn btn-link" onclick="openScreen('${screen.unique_id}')">Ouvrir</button>
                    <button class="btn btn-secondary" onclick="editScreen(${screen.id})">Modifier</button>
                    <button class="btn btn-danger" onclick="deleteScreen(${screen.id}, '${escapeHtml(screen.name)}')">Supprimer</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur chargement écrans:', error);
    }
}

function openScreenModal(screenId = null) {
    const modal = document.getElementById('screen-modal');
    const form = document.getElementById('screen-form');

    form.reset();
    document.getElementById('screen-id').value = '';
    document.getElementById('modal-title').textContent = 'Nouvel Écran';

    if (screenId) {
        loadScreenData(screenId);
        document.getElementById('modal-title').textContent = 'Modifier l\'Écran';
    }

    modal.classList.add('active');
}

function closeScreenModal() {
    document.getElementById('screen-modal').classList.remove('active');
}

async function loadScreenData(screenId) {
    try {
        const response = await fetchAPI(`/api/screens/${screenId}`);
        const screen = await response.json();

        document.getElementById('screen-id').value = screen.id;
        document.getElementById('screen-name').value = screen.name;
        document.getElementById('screen-refresh').value = screen.refresh_interval;
        document.getElementById('screen-status-filter').value = screen.filters.status?.join('\n') || '';
        document.getElementById('screen-category-filter').value = screen.filters.category?.join('\n') || '';
        document.getElementById('screen-priority-filter').value = screen.filters.priority?.join('\n') || '';
    } catch (error) {
        console.error('Erreur chargement écran:', error);
    }
}

async function handleScreenSubmit(e) {
    e.preventDefault();

    const screenId = document.getElementById('screen-id').value;
    const name = document.getElementById('screen-name').value;
    const refreshValue = document.getElementById('screen-refresh').value;
    const refresh_interval = refreshValue ? parseInt(refreshValue) : 60;

    const filters = {
        status: parseFilterList(document.getElementById('screen-status-filter').value),
        category: parseFilterList(document.getElementById('screen-category-filter').value),
        priority: parseFilterList(document.getElementById('screen-priority-filter').value)
    };

    console.log('Submitting screen:', { screenId, name, filters, refresh_interval });

    try {
        // Vérifier si screenId est vraiment défini (pas vide ni "undefined")
        const isEdit = screenId && screenId !== '' && screenId !== 'undefined';
        const url = isEdit ? `/api/screens/${screenId}` : '/api/screens';
        const method = isEdit ? 'PUT' : 'POST';

        console.log('Request:', method, url);

        const response = await fetchAPI(url, {
            method,
            body: JSON.stringify({ name, filters, refresh_interval })
        });

        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            closeScreenModal();
            await loadScreens();
            alert(data.message);
        } else {
            console.error('Error response:', data);
            alert(data.error || 'Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Exception during submit:', error);
        alert('Erreur lors de la sauvegarde: ' + error.message);
    }
}

function parseFilterList(text) {
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function openScreen(uniqueId) {
    window.open(`/screen/${uniqueId}`, '_blank');
}

async function editScreen(screenId) {
    openScreenModal(screenId);
}

async function deleteScreen(screenId, screenName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'écran "${screenName}" ?`)) {
        return;
    }

    try {
        const response = await fetchAPI(`/api/screens/${screenId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            await loadScreens();
            alert(data.message);
        } else {
            alert(data.error || 'Erreur lors de la suppression');
        }
    } catch (error) {
        alert('Erreur lors de la suppression');
    }
}

// Utilities
async function fetchAPI(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        ...options
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
        handleLogout();
        throw new Error('Non autorisé');
    }

    return response;
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
