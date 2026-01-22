// ============================================================
// Core Utilities - Shared Functions
// ============================================================

/**
 * Show a toast notification to the user
 * @param {string} message - Message to display
 * @param {string} type - Type of toast ('success' or 'error')
 */
function showToast(message, type = 'success') {
  // Remove existing toast if present
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span style="font-size: 1.25rem;">${type === 'success' ? '✓' : '✕'}</span>
      <span style="font-weight: 500;">${message}</span>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (e) {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

/**
 * Create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Local storage wrapper with error handling
 */
const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Error removing from localStorage:', e);
      return false;
    }
  }
};

/**
 * Create element with classes and attributes
 * @param {string} tag - HTML tag name
 * @param {Object} options - Options object
 * @returns {HTMLElement}
 */
function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) {
    element.className = options.className;
  }

  if (options.attributes) {
    Object.keys(options.attributes).forEach(key => {
      element.setAttribute(key, options.attributes[key]);
    });
  }

  if (options.text) {
    element.textContent = options.text;
  }

  if (options.html) {
    element.innerHTML = options.html;
  }

  if (options.children) {
    options.children.forEach(child => {
      element.appendChild(child);
    });
  }

  return element;
}

/**
 * Animate element with smooth transition
 * @param {HTMLElement} element - Element to animate
 * @param {string} animation - Animation class
 * @param {number} duration - Animation duration in ms
 */
function animateElement(element, animation, duration = 300) {
  element.style.animation = `${animation} ${duration}ms ease`;

  setTimeout(() => {
    element.style.animation = '';
  }, duration);
}

/**
 * Scroll to element smoothly
 * @param {string|HTMLElement} target - Element or selector
 */
function scrollToElement(target) {
  const element = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date
 */
function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string
 */
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Validate domain format (strict)
 * @param {string} domain - Domain to validate
 * @returns {boolean} - True if valid
 */
function validateDomain(domain) {
  if (!domain) return true; // Empty allowed (optional field)
  // Strict regex: requires dot, no spaces, valid chars
  // Ex: example.com, sub.example.co.uk, localhost
  const regex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
  return regex.test(domain);
}

/**
 * Sanitize input for dork building (preserves operators, removes XSS vectors)
 * @param {string} str - Input string
 * @returns {string} - Sanitized string
 */
function sanitizeInput(str) {
  if (!str) return '';
  // Remove potentially malicious script tags and javascript: protocols
  // We want to allow normal dork characters: " : | ( ) - * .
  let clean = str
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
    .replace(/<[^>]+>/g, "") // Remove other HTML tags
    .replace(/javascript:/gi, ""); // Remove javascript: protocol

  return clean.trim();
}

/**
 * Export core utilities
 */
window.DorkTool = window.DorkTool || {};
window.DorkTool.utils = {
  showToast,
  copyToClipboard,
  debounce,
  storage,
  createElement,
  animateElement,
  scrollToElement,
  formatDate,
  sanitizeHTML,
  validateDomain,
  sanitizeInput,
  /**
   * Highlights a dork query with HTML spans
   * @param {string} dork - Raw dork string
   * @returns {string} - HTML string with highlight classes
   */
  highlightDork: (dork) => {
    if (!dork) return '';
    let html = dork;

    // Order matters for regex:
    // 1. Strings in quotes
    html = html.replace(/"([^"]*)"/g, '<span class="dork-str">"$1"</span>');

    // 2. Operators with colons (site:, intitle:, etc.)
    // Matches word + colon that isn't already inside a span
    html = html.replace(/\b(site|ext|filetype|inurl|allinurl|intitle|allintitle|intext|allintext|cache|link|related|info|define|before|after):/gi,
      (match) => {
        const cls = /ext|filetype/i.test(match) ? 'dork-ext' : 'dork-op';
        return `<span class="${cls}">${match}</span>`;
      });

    // 3. Negative operators (-inurl:, -site:)
    html = html.replace(/-[a-z]+:/gi, '<span class="dork-exc">$&</span>');

    // 4. Logical symbols (OR, |, (, ), AND)
    html = html.replace(/\b(OR|AND)\b/g, '<span class="dork-sym">$&</span>');
    html = html.replace(/[|()]/g, '<span class="dork-sym">$&</span>');

    return html;
  }
};
