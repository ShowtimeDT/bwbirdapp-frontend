import { signInWithPassword, signUpWithPassword, signOut, onAuth } from './auth.js';

// Inject modal HTML into #auth-root if present
async function mountModal() {
  const root = document.getElementById('auth-root');
  if (!root) return null;
  const res = await fetch('/partials/auth-modal.html', { cache: 'no-store' });
  root.innerHTML = await res.text();
  return root.querySelector('#auth-modal');
}

function show(el){ el?.removeAttribute('hidden'); }
function hide(el){ el?.setAttribute('hidden', ''); }

document.addEventListener('DOMContentLoaded', async () => {
  const modal = await mountModal();
  if (!modal) return;

  const closeBtn = modal.querySelector('.auth-close');
  const form = modal.querySelector('#auth-form');
  const title = modal.querySelector('#auth-title');
  const emailEl = modal.querySelector('#auth-email');
  const pwEl = modal.querySelector('#auth-password');
  const userWrap = modal.querySelector('#username-wrap');
  const userEl = modal.querySelector('#auth-username');
  const submitBtn = modal.querySelector('#auth-submit');
  const switchLink = modal.querySelector('#auth-switch-link');
  const switchText = modal.querySelector('#auth-switch-text');
  const errEl = modal.querySelector('#auth-error');

  let mode = 'signin'; // or 'signup'
  function setMode(next) {
    mode = next;
    if (mode === 'signin') {
      title.textContent = 'Sign In';
      submitBtn.textContent = 'Sign In';
      userWrap.hidden = true;
      switchText.textContent = 'No account?';
      switchLink.textContent = 'Sign up';
    } else {
      title.textContent = 'Create Account';
      submitBtn.textContent = 'Sign Up';
      userWrap.hidden = false;
      switchText.textContent = 'Have an account?';
      switchLink.textContent = 'Sign in';
    }
    errEl.hidden = true;
    errEl.textContent = '';
  }
  setMode('signin');

  // Open/close controls exposed via custom events
  window.addEventListener('auth:open', () => show(modal));
  window.addEventListener('auth:close', () => hide(modal));

  closeBtn?.addEventListener('click', () => hide(modal));
  modal.addEventListener('click', (e) => { if (e.target === modal) hide(modal); });
  switchLink.addEventListener('click', (e) => { e.preventDefault(); setMode(mode === 'signin' ? 'signup' : 'signin'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.hidden = true; errEl.textContent = '';
    const email = emailEl.value.trim();
    const password = pwEl.value;
    const username = userEl.value.trim() || undefined;

    try {
      if (mode === 'signin') {
        await signInWithPassword({ email, password });
      } else {
        await signUpWithPassword({ email, password, username });
      }
      hide(modal);
      // let the rest of the app react via onAuth
    } catch (err) {
      errEl.textContent = err?.message || 'Authentication failed';
      errEl.hidden = false;
    }
  });

  // Header buttons hookup if present
  onAuth((session) => {
    document.querySelectorAll('[data-auth=signin]').forEach(b => b.toggleAttribute('hidden', !!session));
    document.querySelectorAll('[data-auth=signup]').forEach(b => b.toggleAttribute('hidden', !!session));
    document.querySelectorAll('[data-auth=signout]').forEach(b => b.toggleAttribute('hidden', !session));
  });

  document.querySelectorAll('[data-auth=signin],[data-auth=signup]').forEach(b => {
    b.addEventListener('click', () => {
      setMode(b.dataset.auth === 'signup' ? 'signup' : 'signin');
      show(modal);
    });
  });
  document.querySelectorAll('[data-auth=signout]').forEach(b => {
    b.addEventListener('click', async () => { try { await signOut(); } catch(_){} });
  });
});
