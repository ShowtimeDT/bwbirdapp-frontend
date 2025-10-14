import { signInWithEmail, signOut, onAuth } from '/js/auth.js';

const loginSection = document.getElementById('login-section');
const actionButtons = document.getElementById('action-buttons');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

// Check if user is already logged in
function checkAuthStatus() {
  onAuth((session) => {
    if (session) {
      showLoggedInState();
    } else {
      showLoginForm();
    }
  });
}

// Show login form
function showLoginForm() {
  loginSection.style.display = 'block';
  actionButtons.style.display = 'none';
}

// Show logged in state
function showLoggedInState() {
  loginSection.style.display = 'none';
  actionButtons.style.display = 'block';
}

// Handle login form submission
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  if (!email) return;
  
  try {
    loginStatus.textContent = 'Sending magic link...';
    loginStatus.style.color = '#666';
    
    await signInWithEmail(email);
    
    loginStatus.textContent = 'Check your email for the magic link!';
    loginStatus.style.color = '#28a745';
  } catch (error) {
    console.error('Login error:', error);
    loginStatus.textContent = 'Failed to send magic link. Please try again.';
    loginStatus.style.color = '#dc3545';
  }
});

// Listen for auth state changes
window.addEventListener('load', () => {
  checkAuthStatus();
});
