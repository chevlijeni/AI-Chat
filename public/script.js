const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatHistoryList = document.getElementById('chatHistoryList');
const newChatBtn = document.getElementById('newChatBtn');
const logoutBtn = document.getElementById('logoutBtn');

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
                window.location.href = '/auth/logout';
            }
        });
    });
}

let messages = [];
let currentSessionId = null;

const INITIAL_SYSTEM_MESSAGE = { id: 0, role: 'system', content: 'You are Jeni AI, a helpful and friendly AI assistant created by Jeni.' };
const INITIAL_AI_GREETING = { id: -1, role: 'ai', content: 'Hello! I\'m Jeni AI. How can I help you today?' };

async function init() {
    try {
        const authRes = await fetch('/auth/status');
        const authData = await authRes.json();

        if (!authData.authenticated) {
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
        const res = await fetch('/api/history/sessions');
        const data = await res.json();

        chatHistoryList.innerHTML = '';

        if (data.sessions && data.sessions.length > 0) {
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
            await fetch(`/api/history/${sessionId}`, { method: 'DELETE' });
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
        const res = await fetch('/api/chat/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Chat' })
        });
        const data = await res.json();
        if (data.sessionId) {
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
        const res = await fetch(`/api/history/${sessionId}`);
        const data = await res.json();

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
        const response = await fetch(`/api/chat/${currentSessionId}/edit/${messageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newContent })
        });
        const data = await response.json();
        hideTypingIndicator();

        if (response.ok && data.fullHistory) {
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
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: text }], sessionId: currentSessionId })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (response.ok && data.fullHistory) {
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
