const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatHistoryList = document.getElementById('chatHistoryList');
const newChatBtn = document.getElementById('newChatBtn');
const logoutBtn = document.getElementById('logoutBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// ⚙️ Configuration: Set this if your backend is on a different URL (e.g. Render Web Service)
// If hosted on Render Static Sites, change this to your Render Web Service URL.
const API_BASE_URL = ""; // Leave empty for same-origin relative paths

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Are you sure?',
            text: "You are about to log out of Jeni AI.",
            icon: 'warning',
            showCancelButton: true,
            background: 'rgba(10, 11, 30, 0.9)',
            color: '#fff',
            confirmButtonColor: '#ff7675',
            cancelButtonColor: '#6c5ce7',
            confirmButtonText: 'Yes, log out!'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('jeni_jwt_token');
                window.location.href = '/';
            }
        });
    });
}

let messages = [];
let currentSessionId = null;
let userToken = localStorage.getItem('jeni_jwt_token');

// 🔒 Client-Side Encryption Helpers
const ENCRYPTION_SECRET = "super_secret_encryption_key_112233"; // MUST MATCH .env

function encrypt(text) {
    const key = CryptoJS.SHA256(ENCRYPTION_SECRET);
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return iv.toString(CryptoJS.enc.Base64) + ":" + encrypted.toString();
}

function decrypt(cipherText) {
    try {
        const parts = cipherText.split(':');
        const iv = CryptoJS.enc.Base64.parse(parts[0]);
        const key = CryptoJS.SHA256(ENCRYPTION_SECRET);
        const encrypted = parts[1];
        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error("Decryption error", e);
        return null;
    }
}

/**
 * Enhanced fetch to handle encryption and JWT
 */
async function secureFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (userToken) {
        options.headers['Authorization'] = `Bearer ${userToken}`;
    }

    // Encrypt outgoing body
    if (options.body && typeof options.body === 'string') {
        const encryptedBody = encrypt(options.body);
        options.body = JSON.stringify({ data: encryptedBody });
        options.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(API_BASE_URL + url, options);

    // Decrypt incoming response
    const json = await response.json();
    if (json && json.data && typeof json.data === 'string' && response.ok) {
        const decryptedData = decrypt(json.data);
        return { ok: response.ok, status: response.status, data: JSON.parse(decryptedData) };
    }

    return { ok: response.ok, status: response.status, data: json };
}

// Check for token in URL (after Google callback)
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');
if (tokenFromUrl) {
    userToken = tokenFromUrl;
    localStorage.setItem('jeni_jwt_token', userToken);
    window.history.replaceState({}, document.title, "/");
}

const INITIAL_SYSTEM_MESSAGE = { id: 0, role: 'system', content: 'You are Jeni AI, a helpful and friendly AI assistant created by Jeni.' };
const INITIAL_AI_GREETING = { id: -1, role: 'ai', content: 'Hello! I\'m Jeni AI. How can I help you today?' };

async function waitForBackend() {
    const loaderStatus = document.getElementById('loaderStatus');
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds for Render free tier cold start

    while (attempts < maxAttempts) {
        try {
            // Using a simple fetch to check if backend is alive
            const res = await fetch(API_BASE_URL + '/auth/status');
            if (res.status !== 502 && res.status !== 503 && res.status !== 504) {
                return true;
            }
        } catch (e) {
            // Network error usually means it's still starting
        }
        attempts++;
        if (attempts === 5) loaderStatus.textContent = "Waking up AI engine...";
        if (attempts === 15) loaderStatus.textContent = "Almost there, preparing environment...";
        if (attempts === 30) loaderStatus.textContent = "Still working on it... Render's free tier can be slow.";

        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
}

function hideLoader() {
    const loader = document.getElementById('initialLoader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => loader.style.display = 'none', 800);
    }
}

async function init() {
    try {
        // 🚀 Step 1: Wait for backend to be ready
        const isReady = await waitForBackend();
        if (!isReady) {
            document.getElementById('loaderStatus').textContent = "Connection timed out. Please refresh.";
            return;
        }

        // 🚀 Step 2: Proceed with normal Auth init
        const authRes = await secureFetch('/auth/status');
        const authData = authRes.data;

        // 🚀 Step 3: Hide loader once we have the data
        hideLoader();

        if (!authData || !authData.authenticated) {
            document.getElementById('loginOverlay').style.display = 'flex';
            document.getElementById('chatForm').style.pointerEvents = 'none';
            document.getElementById('chatForm').style.opacity = '0.5';

            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.style.display = 'none';
            return;
        }

        // Logged in
        document.getElementById('userProfile').style.display = 'flex';
        document.getElementById('connectionStatus').style.display = 'none';
        document.getElementById('userName').textContent = authData.user.display_name;
        if (authData.user.avatar_url) {
            document.getElementById('userAvatar').src = authData.user.avatar_url;
        }

        await loadSidebarSessions();

    } catch (err) {
        console.error("Auth init error:", err);
    }
}

async function loadSidebarSessions() {
    try {
        const res = await secureFetch('/api/history/sessions');
        const data = res.data;

        chatHistoryList.innerHTML = '';
        if (!data || !data.sessions) {
            createNewSession();
            return;
        }

        if (data.sessions.length > 0) {
            data.sessions.forEach(session => {
                const li = document.createElement('li');
                li.classList.add('history-item');
                if (session.id === currentSessionId) {
                    li.classList.add('active');
                }

                li.innerHTML = `
                    <span class="history-title-text">${escapeHtml(session.title)}</span>
                    <button class="delete-chat-btn" title="Delete Chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                `;

                li.querySelector('.history-title-text').addEventListener('click', () => loadSession(session.id));
                li.querySelector('.delete-chat-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                });

                chatHistoryList.appendChild(li);
            });

            const savedSessionId = localStorage.getItem('jeni_active_session');
            const targetId = savedSessionId ? parseInt(savedSessionId) : null;

            if (!currentSessionId || !data.sessions.find(s => s.id === currentSessionId)) {
                if (targetId && data.sessions.find(s => s.id === targetId)) {
                    loadSession(targetId);
                } else {
                    loadSession(data.sessions[0].id);
                }
            }
        } else {
            createNewSession();
        }
    } catch (error) {
        console.error("Error loading sessions:", error);
    }
}

async function deleteSession(sessionId) {
    const result = await Swal.fire({
        title: 'Delete Chat?',
        text: "This chat history will be permanently deleted.",
        icon: 'warning',
        showCancelButton: true,
        background: 'rgba(10, 11, 30, 0.9)',
        color: '#fff',
        confirmButtonColor: '#ff7675',
        cancelButtonColor: '#6c5ce7',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await secureFetch(`/api/history/${sessionId}`, { method: 'DELETE' });
            if (currentSessionId === sessionId) {
                currentSessionId = null;
                localStorage.removeItem('jeni_active_session');
            }
            loadSidebarSessions();
        } catch (error) {
            console.error("Error deleting session:", error);
        }
    }
}

async function createNewSession() {
    try {
        const res = await secureFetch('/api/chat/session', {
            method: 'POST',
            body: JSON.stringify({ title: 'New Chat' })
        });
        const data = res.data;
        if (data && data.sessionId) {
            currentSessionId = data.sessionId;
            localStorage.setItem('jeni_active_session', currentSessionId);
            messages = [INITIAL_SYSTEM_MESSAGE];
            renderMessages();
            loadSidebarSessions();
        }
    } catch (error) {
        console.error("Error creating session:", error);
    }
}

newChatBtn.addEventListener('click', () => {
    const hasUserMessages = messages.some(m => m.role === 'user');
    if (hasUserMessages) {
        createNewSession();
    } else {
        messages = [INITIAL_SYSTEM_MESSAGE];
        renderMessages();
    }
});

async function loadSession(sessionId) {
    if (currentSessionId === sessionId && messages.length > 1) return;
    currentSessionId = sessionId;
    localStorage.setItem('jeni_active_session', currentSessionId);

    try {
        const res = await secureFetch(`/api/history/${sessionId}`);
        const data = res.data;

        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });
        loadSidebarSessions();

        if (data.history && data.history.length > 0) {
            messages = data.history;
        } else {
            messages = [INITIAL_SYSTEM_MESSAGE];
        }
        renderMessages();
    } catch (error) {
        console.error("Error loading session history:", error);
    }
}

function renderMessages() {
    chatWindow.innerHTML = '';
    let hasVisibleMessage = false;
    messages.forEach((msg) => {
        if (msg.role !== 'system') {
            hasVisibleMessage = true;
            addMessageToDOMFast(msg.content, msg.role, msg.id);
        }
    });

    if (!hasVisibleMessage) {
        hasVisibleMessage = true;
        addMessageToDOMFast(INITIAL_AI_GREETING.content, INITIAL_AI_GREETING.role, INITIAL_AI_GREETING.id);
    }

    chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'auto' });
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function addMessageToDOMFast(content, role, id = null) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    if (id) messageDiv.dataset.id = id;

    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('message-wrapper');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (role === 'ai' && typeof marked !== 'undefined') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.textContent = content;
    }

    wrapperDiv.appendChild(contentDiv);

    if (role === 'user' && id) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-message-btn';
        editBtn.title = 'Edit and Resend';
        editBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;

        editBtn.addEventListener('click', () => {
            wrapperDiv.classList.add('editing');
            contentDiv.style.display = 'none';
            editBtn.style.display = 'none';

            const editContainer = document.createElement('div');
            editContainer.className = 'edit-container';

            const textarea = document.createElement('textarea');
            textarea.className = 'edit-textarea';
            textarea.value = content;

            const actions = document.createElement('div');
            actions.className = 'edit-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'edit-cancel-btn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => {
                wrapperDiv.classList.remove('editing');
                editContainer.remove();
                contentDiv.style.display = 'block';
                editBtn.style.display = '';
            };

            const submitBtn = document.createElement('button');
            submitBtn.className = 'edit-submit-btn';
            submitBtn.textContent = 'Save & Submit';
            submitBtn.onclick = () => {
                const newText = textarea.value.trim();
                if (newText) {
                    editContainer.remove();
                    submitEdit(id, newText);
                }
            };

            actions.appendChild(cancelBtn);
            actions.appendChild(submitBtn);
            editContainer.appendChild(textarea);
            editContainer.appendChild(actions);
            wrapperDiv.appendChild(editContainer);

            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });

        wrapperDiv.appendChild(editBtn);
    }

    messageDiv.appendChild(wrapperDiv);
    chatWindow.appendChild(messageDiv);
}

function addMessageToDOM(content, role) {
    addMessageToDOMFast(content, role, null);
    chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: 'smooth'
    });
}

async function submitEdit(messageId, newContent) {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex !== -1) {
        messages = messages.slice(0, msgIndex);
    }
    messages.push({ id: messageId, role: 'user', content: newContent });
    renderMessages();

    showTypingIndicator();
    try {
        const res = await secureFetch(`/api/chat/${currentSessionId}/edit/${messageId}`, {
            method: 'PUT',
            body: JSON.stringify({ newContent })
        });
        const data = res.data;
        hideTypingIndicator();

        if (res.ok && data.fullHistory) {
            messages = data.fullHistory;
            renderMessages();
            loadSidebarSessions();
        } else {
            addMessageToDOM(data.error || 'Failed to edit message', 'ai');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        hideTypingIndicator();
        addMessageToDOM('Failed to connect to the server.', 'ai');
    }
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'ai', 'typing-indicator-wrapper');
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="message-wrapper">
            <div class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
    chatWindow.appendChild(indicator);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    if (!currentSessionId) {
        await createNewSession();
    }

    addMessageToDOM(text, 'user');

    userInput.value = '';
    userInput.style.height = 'auto';

    showTypingIndicator();

    try {
        const res = await secureFetch('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ messages: [{ role: 'user', content: text }], sessionId: currentSessionId })
        });

        const data = res.data;
        hideTypingIndicator();

        if (res.ok && data.fullHistory) {
            messages = data.fullHistory;
            renderMessages();

            if (messages.filter(m => m.role === 'user').length === 1) {
                loadSidebarSessions();
            }
        } else {
            const errorText = data.error || 'Sorry, I encountered an error.';
            addMessageToDOM(errorText, 'ai');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        hideTypingIndicator();
        addMessageToDOM('Failed to connect to the server.', 'ai');
    }
});

init();
