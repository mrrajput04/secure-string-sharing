// Constants
const CONSTANTS = {
    MAX_ATTEMPTS: 5,
    LOCKOUT_DURATION: 300000, // 5 mins
    COPY_FEEDBACK_DURATION: 2000,
    IMAGE_MIME_TYPES: {
        'iVBOR': 'image/png',
        '/9j/': 'image/jpeg',
        'R0lGOD': 'image/gif',
        'PHN2Zz': 'image/svg+xml'
    }
};

// State management - Define state before using it
const state = {
    attemptCount: 0,
    lastAttemptTime: 0,
    lockoutEndTime: 0,
    currentData: null
};

// DOM Elements
const elements = {
    password: document.getElementById('password'),
    errorMessage: document.getElementById('errorMessage'),
    errorSection: document.getElementById('errorSection'),
    passwordSection: document.getElementById('passwordSection'),
    resultSection: document.getElementById('resultSection'),
    secretContent: document.getElementById('secretContent'),
    copyContentBtn: document.getElementById('copyContentBtn'),
    oneTimeWarning: document.getElementById('oneTimeWarning'),
    tryAgainBtn: document.getElementById('tryAgainBtn')
};

// Utility functions
const utils = {
    showElement: (el) => el.classList.remove('hidden'),
    hideElement: (el) => el.classList.add('hidden'),
    getStringId: () => window.location.pathname.split('/').pop(),

    async fetchPasswordHint() {
        try {
            const response = await fetch(`/api/strings/${utils.getStringId()}/hint`);
            const data = await response.json();
            if (response.ok && data.success && data.hint) {
                document.getElementById('hintText').textContent = data.hint;
                utils.showElement(document.getElementById('passwordHint'));
            }
        } catch (error) {
            console.error('Error fetching password hint:', error);
        }
    },

    handleError(message) {
        elements.errorMessage.textContent = message;
        utils.showElement(elements.errorSection);

        state.attemptCount++;
        state.lastAttemptTime = Date.now();

        if (state.attemptCount >= CONSTANTS.MAX_ATTEMPTS) {
            state.lockoutEndTime = Date.now() + CONSTANTS.LOCKOUT_DURATION;
            elements.errorMessage.textContent = 'Too many failed attempts. Please try again in 5 minutes.';
        } else {
            const remaining = CONSTANTS.MAX_ATTEMPTS - state.attemptCount;
            elements.errorMessage.textContent = `${message} (${remaining} attempts remaining)`;
        }
    }
};

// Define handlers
const handlers = {
    async handleSubmit(e) {
        e.preventDefault();

        // Check if user is in lockout period
        const currentTime = Date.now();
        if (currentTime < state.lockoutEndTime) {
            const remainingTime = Math.ceil((state.lockoutEndTime - currentTime) / 1000);
            utils.handleError(`Too many failed attempts. Please try again in ${remainingTime} seconds.`);
            return;
        }

        // Show loading spinner
        const submitButton = e.target.querySelector('button[type="submit"]');
        const buttonText = submitButton.querySelector('.button-text');
        const spinner = submitButton.querySelector('.spinner-border');
        buttonText.classList.add('d-none');
        spinner.classList.remove('d-none');

        try {
            const response = await fetch(`/api/strings/${utils.getStringId()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: elements.password.value }),
            });

            const data = await response.json();
            state.currentData = data;

            if (response.ok && data.success) {
                // Reset attempt count on successful login
                state.attemptCount = 0;
                state.lastAttemptTime = 0;
                state.lockoutEndTime = 0;

                // Show content
                elements.secretContent.textContent = data.string;
                utils.hideElement(elements.passwordSection);
                utils.showElement(elements.resultSection);

                // Show one-time warning if applicable
                if (data.isOneTime) {
                    utils.showElement(elements.oneTimeWarning);
                }
            } else {
                utils.handleError(data.message || 'Invalid password');
            }
        } catch (error) {
            console.error('Error:', error);
            utils.handleError('An error occurred while accessing the content');
        } finally {
            // Hide loading spinner
            buttonText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    },

    handleTryAgain() {
        utils.hideElement(elements.errorSection);
        elements.password.value = '';
    },

    handleClose() {
        if (state.currentData && state.currentData.isOneTime) {
            utils.hideElement(elements.passwordSection);
            utils.hideElement(elements.resultSection);
            utils.showElement(elements.errorSection);
            elements.errorMessage.textContent = 'This content has been permanently deleted.';
            utils.hideElement(elements.tryAgainBtn);
        } else {
            utils.showElement(elements.passwordSection);
            utils.hideElement(elements.resultSection);
            elements.password.value = '';
        }
    },

    async handleCopy() {
        const content = elements.secretContent.textContent;
        try {
            await navigator.clipboard.writeText(content);
            const copyBtn = elements.copyContentBtn;
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, CONSTANTS.COPY_FEEDBACK_DURATION);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy content to clipboard');
        }
    },

    handlePasswordToggle(e) {
        elements.password.type = e.target.checked ? 'text' : 'password';
    },

    handleThemeToggle(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        if (theme === 'dark') {
            utils.hideElement(document.getElementById('darkModeToggle'));
            utils.showElement(document.getElementById('lightModeToggle'));
        } else {
            utils.showElement(document.getElementById('darkModeToggle'));
            utils.hideElement(document.getElementById('lightModeToggle'));
        }
        localStorage.setItem('theme', theme);
    },

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.handleThemeToggle(savedTheme);
    }
};

// Initialize
utils.fetchPasswordHint();
utils.hideElement(elements.oneTimeWarning);

// Event listeners
document.getElementById('accessForm').addEventListener('submit', handlers.handleSubmit);
elements.tryAgainBtn.addEventListener('click', handlers.handleTryAgain);
document.getElementById('closeBtn').addEventListener('click', handlers.handleClose);
document.getElementById('copyContentBtn').addEventListener('click', handlers.handleCopy);
document.getElementById('showPassword').addEventListener('change', handlers.handlePasswordToggle);
document.getElementById('darkModeToggle').addEventListener('click', () => handlers.handleThemeToggle('dark'));
document.getElementById('lightModeToggle').addEventListener('click', () => handlers.handleThemeToggle('light'));

// Initialize theme
handlers.initializeTheme();