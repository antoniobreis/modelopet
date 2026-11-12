const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

function closeMenu() {
  if (!menuButton || !mainNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  mainNav.classList.remove('is-open');
}

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    mainNav.classList.toggle('is-open', !isOpen);
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      if (cookieDialog && cookieDialog.open) cookieDialog.close();
    }
  });
}

const year = document.querySelector('#current-year');
if (year) year.textContent = new Date().getFullYear();

const CONSENT_VERSION = 1;
const CONSENT_STORAGE_KEY = 'pata-pelo-cookie-consent';
const cookieBanner = document.querySelector('#cookie-banner');
const cookieDialog = document.querySelector('#cookie-preferences');
const cookieForm = document.querySelector('#cookie-preferences-form');
const cookieStatus = document.querySelector('#cookie-status');
const cookieDialogStatus = document.querySelector('#cookie-dialog-status');
const cookieMain = document.querySelector('#conteudo');
let storageReadFailed = false;

function isValidConsent(consent) {
  return Boolean(
    consent &&
    consent.version === CONSENT_VERSION &&
    typeof consent.date === 'string' &&
    !Number.isNaN(Date.parse(consent.date)) &&
    consent.categories &&
    consent.categories.necessary === true &&
    typeof consent.categories.analytics === 'boolean' &&
    typeof consent.categories.marketing === 'boolean'
  );
}

function readConsent() {
  let stored;
  try {
    stored = localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch (error) {
    storageReadFailed = true;
    return null;
  }

  if (!stored) return null;
  try {
    const consent = JSON.parse(stored);
    return isValidConsent(consent) ? consent : null;
  } catch (error) {
    return null;
  }
}

let currentConsent = readConsent();

function showCookieStatus(message) {
  if (cookieStatus) cookieStatus.textContent = message;
  if (cookieDialogStatus) cookieDialogStatus.textContent = message;
}

function saveConsent(analytics, marketing) {
  const consent = {
    version: CONSENT_VERSION,
    date: new Date().toISOString(),
    categories: {
      necessary: true,
      analytics,
      marketing
    }
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    currentConsent = consent;
    showCookieStatus('');
    return true;
  } catch (error) {
    showCookieStatus('Não foi possível salvar sua escolha neste navegador. Verifique as configurações de armazenamento e tente novamente.');
    return false;
  }
}

function openCookiePreferences() {
  if (!cookieDialog || cookieDialog.open) return;

  const analyticsInput = cookieForm.elements.analytics;
  const marketingInput = cookieForm.elements.marketing;
  analyticsInput.checked = Boolean(currentConsent && currentConsent.categories.analytics);
  marketingInput.checked = Boolean(currentConsent && currentConsent.categories.marketing);
  cookieDialog.showModal();
  analyticsInput.focus();
}

document.querySelectorAll('[data-open-cookie-preferences]').forEach((button) => {
  button.addEventListener('click', openCookiePreferences);
});

document.querySelectorAll('[data-cookie-choice]').forEach((button) => {
  button.addEventListener('click', () => {
    const accept = button.dataset.cookieChoice === 'accept';
    if (!saveConsent(accept, accept)) return;
    cookieBanner.hidden = true;
    if (cookieMain) cookieMain.focus();
  });
});

document.querySelectorAll('[data-close-cookie-preferences]').forEach((button) => {
  button.addEventListener('click', () => cookieDialog.close());
});

if (cookieForm) {
  cookieForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!saveConsent(cookieForm.elements.analytics.checked, cookieForm.elements.marketing.checked)) return;
    cookieDialog.close();
    if (cookieBanner && !cookieBanner.hidden) {
      cookieBanner.hidden = true;
      if (cookieMain) cookieMain.focus();
    }
  });
}

if (cookieBanner && !currentConsent) {
  cookieBanner.hidden = false;
  if (storageReadFailed) {
    showCookieStatus('O navegador não permitiu ler suas preferências salvas. Você ainda pode tentar escolher novamente.');
  }
}
