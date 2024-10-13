const authApiBaseUrl = "https://todoapi-0rqb.onrender.com/api/auth";
const loginButton = document.getElementById("login-button");

//modals
const loginModal = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");
const modalOverlay = document.getElementById("modal-overlay");
const profileModal = document.getElementById("profile-modal");

//login modal
const closeLoginModalButton = document.getElementById("close-login-modal-button");
const loginModalLoginButton = document.getElementById("login-modal-login-button");
const loginModalRegisterLink = document.getElementById("register-link");

//register modal
const closeRegisterModalButton = document.getElementById("register-modal-close-button");
const registerModalRegisterButton = document.getElementById("register-modal-register-button");
const registerModalLoginLink = document.getElementById("login-link");

//profile modal
const profileUsername = document.getElementById("profile-username");
const profileLogoutButton = document.getElementById("profile-logout-button");
const profileCloseModalButton = document.getElementById("profile-close-modal-button");

//events
const loadPageEvent = new CustomEvent('loadPage');
const loginEvent = new CustomEvent("login");

window.onload = () => {
    updateLoginButtonState();

    window.dispatchEvent(loadPageEvent);
};

//login modal buttons
closeLoginModalButton.onclick = hideLoginModal;

//register modal buttons
closeRegisterModalButton.onclick = hideRegisterModal;

document.getElementById("login-form").onsubmit = (event) => {
    event.preventDefault();
    login();
};

document.getElementById("register-form").onsubmit = (event) => {
    event.preventDefault();
    register();
};

loginModalRegisterLink.onclick = (event) => {
    event.preventDefault(); 
    switchToRegisterModal();
};

registerModalLoginLink.onclick = (event) => {
    event.preventDefault(); 
    switchToLoginModal();
};

function updateLoginButtonState()
{
    let token = localStorage.getItem('authToken');
    let username = localStorage.getItem('username');
    
    if (token !== null) {
        loginButton.textContent = username;
        loginButton.onclick = showProfileModal;
        hideLoginModal();
    } else {
        loginButton.textContent = "Login";
        loginButton.onclick = showLoginModal;
        showLoginModal();
    }
}

function switchToLoginModal() {
    hideRegisterModal();
    showLoginModal();
}

function switchToRegisterModal() {
    hideLoginModal();
    showRegisterModal();
}

// Показать и скрыть модальные окна
function showLoginModal() {
    loginModal.style.visibility = "visible";
    modalOverlay.style.visibility = "visible";
}

function hideLoginModal() {
    loginModal.style.visibility = "hidden";
    modalOverlay.style.visibility = "hidden";
}

function showRegisterModal() {
    registerModal.style.visibility = "visible";
    modalOverlay.style.visibility = "visible";
}

function hideRegisterModal() {
    registerModal.style.visibility = "hidden";
    modalOverlay.style.visibility = "hidden";
}

function showProfileModal() {
    profileUsername.textContent = `User: ${localStorage.getItem('username')}`;
    profileModal.style.visibility = "visible";
    modalOverlay.style.visibility = "visible";
}

function hideProfileModal() {
    profileModal.style.visibility = "hidden";
    modalOverlay.style.visibility = "hidden";
}

async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(`${authApiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('username', data.username);
            updateLoginButtonState();
            window.dispatchEvent(loginEvent);
        } else {
            const error = await response.json();
            alert('Login failed: ' + error.message);
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
}

async function register() {
    const username = document.getElementById("register-username").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch(`${authApiBaseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        if (response.ok) {
            switchToLoginModal();
        } else {
            const error = await response.json();
            alert('Registration failed: ' + error.message);
        }
    } catch (err) {
        alert('Network error: ' + err.message);
    }
}

profileLogoutButton.onclick = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    
    loginButton.textContent = "Login";
    loginButton.onclick = showLoginModal;
    
    updateLoginButtonState();
    hideProfileModal();
    window.dispatchEvent(loginEvent);
};

profileCloseModalButton.onclick = hideProfileModal;
