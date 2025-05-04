// DOM Elements
const authContainer = document.getElementById('authContainer');
const chatContainer = document.getElementById('chatContainer');
const authForm = document.getElementById('authForm');
const usernameInput = document.getElementById('username');
const phoneNumberInput = document.getElementById('phoneNumber');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const authButton = document.getElementById('authButton');
const toggleAuth = document.getElementById('toggleAuth');
const currentUserDisplay = document.getElementById('currentUser');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const themeToggle = document.getElementById('themeToggle');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL

// App State
let isLoginMode = true;
let currentUser = null;
let currentTheme = 'light';

// Initialize the app
async function init() {
    updateAuthUI();
    checkSavedTheme();
    
    // Check if token exists (user logged in)
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await fetchUserData(token);
            await loadMessages();
            showChat();
        } catch (err) {
            console.error('Authentication error:', err);
            localStorage.removeItem('token');
        }
    }
}

// Check saved theme from localStorage
function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Set theme
function setTheme(theme) {
    currentTheme = theme;
    document.body.className = `${theme}-theme`;
    localStorage.setItem('theme', theme);
    
    // Update toggle button
    if (themeToggle) {
        themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// Toggle theme
function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update user preference in backend
    if (currentUser) {
        fetch(`${API_BASE_URL}/user/theme`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ theme: newTheme })
        }).catch(err => console.error('Failed to update theme:', err));
    }
}

// Fetch user data with token
async function fetchUserData(token) {
    const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) throw new Error('Failed to fetch user data');
    
    const data = await response.json();
    currentUser = data.user;
    setTheme(data.user.theme || 'light');
}

// Update the auth UI based on mode
function updateAuthUI() {
    if (isLoginMode) {
        authButton.textContent = 'Login';
        toggleAuth.textContent = "Don't have an account? Sign up";
        confirmPasswordGroup.style.display = 'none';
    } else {
        authButton.textContent = 'Sign Up';
        toggleAuth.textContent = "Already have an account? Login";
        confirmPasswordGroup.style.display = 'block';
    }
}

// Handle authentication
authButton.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const phoneNumber = phoneNumberInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!username || !phoneNumber || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (!isLoginMode && password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const endpoint = isLoginMode ? '/login' : '/register';
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                phoneNumber,
                password
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Authentication failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        currentUser = data.user;
        setTheme(data.user.theme || 'light');
        await loadMessages();
        showChat();
    } catch (err) {
        alert(err.message);
    }
});

// Show chat interface
function showChat() {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    currentUserDisplay.textContent = `Logged in as ${currentUser.username}`;
    
    // Add theme toggle if not exists
    if (!themeToggle) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'themeToggle';
        toggleBtn.className = 'theme-toggle';
        toggleBtn.textContent = currentTheme === 'light' ? '🌙' : '☀️';
        toggleBtn.onclick = toggleTheme;
        chatHeader.appendChild(toggleBtn);
    }
}

// Load messages from server
async function loadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load messages');
        
        const messages = await response.json();
        chatMessages.innerHTML = '';
        messages.forEach(msg => {
            addMessageToChat(msg);
        });
    } catch (err) {
        console.error('Error loading messages:', err);
    }
}

// Add a message to the chat
function addMessageToChat(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(message.sender === currentUser.username ? 'sent' : 'received');
    
    const messageContent = document.createElement('div');
    messageContent.textContent = message.text;
    
    const messageInfo = document.createElement('div');
    messageInfo.classList.add('message-info');
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageInfo.textContent = `${message.sender} • ${time}`;
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageInfo);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a message
async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    try {
        // For demo, we'll send to a hardcoded user - in real app you'd select a recipient
        const receiver = 'other_user'; // Replace with actual recipient selection
        
        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                receiver,
                text
            })
        });

        if (!response.ok) throw new Error('Failed to send message');

        const newMessage = await response.json();
        addMessageToChat(newMessage);
        messageInput.value = '';
    } catch (err) {
        console.error('Error sending message:', err);
        alert('Failed to send message');
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

toggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    updateAuthUI();
});

// Initialize the app
init();
