const loginButton = document.getElementById("login-button");

//modals
const loginModal = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");
const modalOverlay = document.getElementById("modal-overlay");

//login modal
const closeLoginModalButton = document.getElementById("close-login-modal-button");
const loginModalLoginButton = document.getElementById("login-modal-login-button");
const loginModalRegisterLink = document.getElementById("register-link");

//register modal
const closeRegisterModalButton = document.getElementById("register-modal-close-button");
const registerModalRegisterButton = document.getElementById("register-modal-register-button");
const registerModalLoginLink = document.getElementById("login-link");

loginButton.onclick = showLoginModal;

//login modal buttons
closeLoginModalButton.onclick = hideLoginModal;

//register modal buttons
closeRegisterModalButton.onclick = hideRegisterModal;

loginModalRegisterLink.onclick = (event) => {
    event.preventDefault(); 
    switchToRegisterModal();
};

registerModalLoginLink.onclick = (event) => {
    event.preventDefault(); 
    switchToLoginModal();
};


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
