import { signInWithEmail, signOut, getCurrentUser } from './auth.js';

const loginSection = document.getElementById('login-section');
const actionButtons = document.getElementById('action-buttons');
const loginForm = document.getElementById('login-form');
const loginStatus = document.getElementById('login-status');

// Check if user is already logged in
async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    if (user) {
      showLoggedInState();
    } else {
      showLoginForm();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showLoginForm();
  }
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

// Listen for auth state changes from Supabase
import { supa } from './auth.js';

supa.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    showLoggedInState();
  } else if (event === 'SIGNED_OUT') {
    showLoginForm();
  }
});
