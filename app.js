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

// App State
let isLoginMode = true;
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || [];

// Initialize the app
function init() {
    updateAuthUI();
    loadMessages();
    
    // Check if user is already logged in (for demo purposes)
    const loggedInUser = localStorage.getItem('currentUser');
    if (loggedInUser) {
        currentUser = JSON.parse(loggedInUser);
        showChat();
    }
}

// Toggle between login and signup
toggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    updateAuthUI();
});

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
authButton.addEventListener('click', () => {
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

    if (isLoginMode) {
        // Login logic
        const user = users.find(u => 
            (u.username === username || u.phoneNumber === phoneNumber) && 
            u.password === password
        );

        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showChat();
        } else {
            alert('Invalid credentials');
        }
    } else {
        // Signup logic
        const userExists = users.some(u => 
            u.username === username || u.phoneNumber === phoneNumber
        );

        if (userExists) {
            alert('Username or phone number already exists');
            return;
        }

        const newUser = {
            username,
            phoneNumber,
            password
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        showChat();
    }
});

// Show chat interface
function showChat() {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    currentUserDisplay.textContent = `Logged in as ${currentUser.username}`;
}

// Load messages
function loadMessages() {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
        addMessageToChat(msg);
    });
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
    messageInfo.textContent = `${message.sender} • ${message.time}`;
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageInfo);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a message
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    const newMessage = {
        sender: currentUser.username,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    addMessageToChat(newMessage);
    messageInput.value = '';
}

// Event listeners for sending messages
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize the app
init();
