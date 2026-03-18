const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const chatHistoryList = document.getElementById('chatHistoryList');
const newChatBtn = document.getElementById('newChatBtn');

let chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
let activeSessionId = localStorage.getItem('activeSessionId') || null;
let messages = [];

const INITIAL_SYSTEM_MESSAGE = { role: 'system', content: 'You are Jeni AI, a helpful and friendly AI assistant created by Jeni.' };
const INITIAL_AI_GREETING = { role: 'ai', content: 'Hello! I\'m Jeni AI. How can I help you today?' };

function init() {
    if (chatSessions.length === 0) {
        createNewSession();
    } else {
        if (!activeSessionId || !chatSessions.find(s => s.id === activeSessionId)) {
            activeSessionId = chatSessions[0].id;
        }
        loadSession(activeSessionId);
    }
    renderSidebar();
}

function createNewSession() {
    const newSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: [INITIAL_SYSTEM_MESSAGE, INITIAL_AI_GREETING],
        createdAt: new Date().toISOString()
    };
    chatSessions.unshift(newSession);
    activeSessionId = newSession.id;
    messages = [...newSession.messages]; // Reset the global messages array for the new session
    saveToLocalStorage();
    loadSession(activeSessionId);
    renderSidebar();
}

function loadSession(id) {
    activeSessionId = id;
    localStorage.setItem('activeSessionId', id);
    const session = chatSessions.find(s => s.id === id);
    if (!session) return;

    messages = [...session.messages];
    chatWindow.innerHTML = '';

    // Render all messages except the hidden system prompt
    messages.forEach(msg => {
        if (msg.role !== 'system') {
            addMessageToDOM(msg.content, msg.role);
        }
    });
}

function saveToLocalStorage() {
    const session = chatSessions.find(s => s.id === activeSessionId);
    if (session) {
        session.messages = [...messages];
        // Auto-generate title from first user message if title is 'New Chat'
        const firstUserMsg = messages.find(m => m.role === 'user');
        if (firstUserMsg && session.title === 'New Chat') {
            session.title = firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
        }
    }
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
    localStorage.setItem('activeSessionId', activeSessionId);
}

function renderSidebar() {
    chatHistoryList.innerHTML = '';
    chatSessions.forEach(session => {
        const li = document.createElement('li');
        li.classList.add('history-item');
        if (session.id === activeSessionId) li.classList.add('active');
        const titleSpan = document.createElement('span');
        titleSpan.classList.add('history-title-text');
        titleSpan.textContent = session.title;
        li.appendChild(titleSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-chat-btn');
        deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
        deleteBtn.title = 'Delete Chat';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(session.id);
        });

        li.appendChild(deleteBtn);
        li.addEventListener('click', () => {
            loadSession(session.id);
            renderSidebar();
            if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-open')) {
                // Mobile layout support logic if implemented
                document.body.classList.remove('sidebar-open');
            }
        });
        chatHistoryList.appendChild(li);
    });
}

function deleteSession(id) {
    chatSessions = chatSessions.filter(s => s.id !== id);
    if (chatSessions.length === 0) {
        createNewSession();
    } else {
        if (activeSessionId === id) {
            loadSession(chatSessions[0].id);
        }
        localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
        renderSidebar();
    }
}

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Handle Shift+Enter for newline, Enter to send
userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
});

function addMessageToDOM(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);

    const wrapperDiv = document.createElement('div');
    wrapperDiv.classList.add('message-wrapper');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');

    if (role === 'ai' && typeof marked !== 'undefined') {
        contentDiv.innerHTML = marked.parse(content);
    } else {
        contentDiv.textContent = content; // User text is escaped
    }

    wrapperDiv.appendChild(contentDiv);
    messageDiv.appendChild(wrapperDiv);
    chatWindow.appendChild(messageDiv);

    chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: 'smooth'
    });
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

newChatBtn.addEventListener('click', () => {
    createNewSession();
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI & history
    addMessageToDOM(text, 'user');
    messages.push({ role: 'user', content: text });
    saveToLocalStorage();
    renderSidebar(); // Need to render in case title changed

    userInput.value = '';
    userInput.style.height = 'auto';

    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (response.ok && data.message) {
            addMessageToDOM(data.message.content, 'ai');
            messages.push(data.message);
            saveToLocalStorage();
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

// Initialize App
init();
