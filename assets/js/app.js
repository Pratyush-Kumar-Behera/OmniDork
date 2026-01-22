// Main App Controller - Combines Normal and Pro Mode
console.log('App.js loading...');

// Wait for DOM and dependencies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    console.log('Initializing app...');

    // Check dependencies
    if (!window.DorkTool || !window.DorkTool.utils) {
        console.error('DorkTool.utils not loaded!');
        return;
    }

    if (!window.DorkEngine) {
        console.error('DorkEngine not loaded!');
        return;
    }

    const app = new DorkApp();

    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(req => console.log('Service Worker Registered!', req))
                .catch(err => console.log('Service Worker registration failed', err));
        });
    }
}

class DorkApp {
    constructor() {
        console.log('DorkApp constructor');
        this.utils = window.DorkTool.utils;
        this.engine = new DorkEngine();
        this.currentMode = 'normal';
        this.dorks = [];
        this.filteredDorks = [];
        this.currentQuery = '';

        this.init();
    }

    async init() {
        console.log('App init starting...');

        // Load dorks for Pro Mode
        await this.loadDorks();

        // Setup mode toggle
        this.setupModeToggle();

        // Initialize Normal Mode
        this.initNormalMode();

        // Initialize Pro Mode
        this.initProMode();

        // Initialize FAB
        this.initFab();

        // Initialize Custom Selects
        this.initCustomSelects();

        console.log('App init complete');
    }


    initCustomSelects() {
        // Find all selects that are inputs
        const selects = document.querySelectorAll('select.input');
        selects.forEach(select => {
            new CustomSelect(select);
        });
    }

    initFab() {
        const fabToggle = document.getElementById('fabToggle');
        const fabContainer = document.querySelector('.fab-container');

        if (fabToggle && fabContainer) {
            fabToggle.addEventListener('click', () => {
                fabContainer.classList.toggle('active');
                fabToggle.classList.toggle('active');
                const isExpanded = fabToggle.classList.contains('active');
                fabToggle.setAttribute('aria-expanded', isExpanded);
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!fabContainer.contains(e.target) && fabContainer.classList.contains('active')) {
                    fabContainer.classList.remove('active');
                    fabToggle.classList.remove('active');
                    fabToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    setupModeToggle() {
        const modeSwitch = document.getElementById('modeSwitch');
        const normalContent = document.getElementById('normalMode');
        const proContent = document.getElementById('proMode');
        const modeLabel = document.getElementById('modeLabel');

        console.log('Setting up mode toggle...');
        console.log('Elements:', { modeSwitch, normalContent, proContent, modeLabel });

        if (!modeSwitch || !normalContent || !proContent) {
            console.error('Mode toggle elements not found!');
            return;
        }

        modeSwitch.addEventListener('change', (e) => {
            console.log('Toggle changed! Checked:', e.target.checked);

            if (e.target.checked) {
                // Switch to Pro Mode
                this.currentMode = 'pro';
                normalContent.style.display = 'none';
                proContent.style.display = 'block';
                if (modeLabel) modeLabel.textContent = '';
                console.log('Switched to Pro Mode');
            } else {
                // Switch to Normal Mode
                this.currentMode = 'normal';
                normalContent.style.display = 'block';
                proContent.style.display = 'none';
                if (modeLabel) modeLabel.textContent = 'Normal Mode';
                console.log('Switched to Normal Mode');
            }
        });

        console.log('Mode toggle event listener attached');
    }

    // ============================================================
    // NORMAL MODE
    // ============================================================
    initNormalMode() {
        console.log('Initializing Normal Mode...');
        this.setupNormalModeListeners();
        this.updateQueryPreview();
    }

    setupNormalModeListeners() {
        const contentType = document.getElementById('contentType');
        const fileFormat = document.getElementById('fileFormat');
        const websiteScope = document.getElementById('websiteScope');
        const keywords = document.getElementById('keywords');
        const searchEngine = document.getElementById('searchEngine');
        const downloadFocus = document.getElementById('downloadFocus');
        const copyBtn = document.getElementById('copyQuery');
        const openBtn = document.getElementById('openInGoogle');

        // Update engine when changed
        if (searchEngine) {
            searchEngine.addEventListener('change', (e) => {
                this.engine.setEngine(e.target.value);
                console.log('Search engine changed to:', e.target.value);
                // Trigger preview update to reflect new engine syntax
                this.updateQueryPreview();
            });
        }

        if (contentType) contentType.addEventListener('change', () => this.updateQueryPreview());
        if (fileFormat) fileFormat.addEventListener('change', () => this.updateQueryPreview());
        if (downloadFocus) downloadFocus.addEventListener('change', () => this.updateQueryPreview());
        if (websiteScope) websiteScope.addEventListener('input', this.utils.debounce(() => this.updateQueryPreview(), 300));
        if (keywords) keywords.addEventListener('input', this.utils.debounce(() => this.updateQueryPreview(), 300));


        if (copyBtn) copyBtn.addEventListener('click', () => this.copyQuery());
        if (openBtn) openBtn.addEventListener('click', () => this.openInSearch());

        // Validation Listeners
        if (websiteScope) {
            websiteScope.addEventListener('input', (e) => {
                const isValid = this.utils.validateDomain(e.target.value);
                this.toggleValidationState(e.target, isValid, 'Invalid domain format');
            });
        }

        // Keyboard Accessibility (Enter/Space = Click)
        this.setupKeyboardAccessibility();
    }

    toggleValidationState(element, isValid, errorMessage) {
        // Remove existing states
        element.classList.remove('input-error');

        // Find or create tooltip
        let tooltip = element.parentNode.querySelector('.validation-tooltip');
        if (!tooltip) {
            tooltip = this.utils.createElement('div', { className: 'validation-tooltip' });
            element.parentNode.appendChild(tooltip);
        }

        if (element.value.length === 0) {
            tooltip.classList.remove('active');
            return;
        }

        if (!isValid) {
            element.classList.add('input-error');
            tooltip.textContent = errorMessage;
            tooltip.classList.add('active');
        } else {
            tooltip.classList.remove('active');
        }
    }

    updateQueryPreview() {
        const preview = document.getElementById('queryPreview');
        const previewBox = document.getElementById('queryPreviewBox');
        if (!preview) return;

        const formValues = this.getFormValues();
        const params = this.mapToQueryParams(formValues);

        this.currentQuery = this.engine.buildQuery(params);

        if (this.currentQuery) {
            // Sanitize display output
            const highlighted = this.utils.highlightDork(this.currentQuery);
            preview.innerHTML = `<span class="terminal-text">${highlighted}</span>`;
            if (previewBox) previewBox.style.display = 'block';
        } else {
            preview.innerHTML = '<span style="color: var(--color-text-dim);">Configure options above to generate query...</span>';
            if (previewBox) previewBox.style.display = 'block';
        }
    }

    getFormValues() {
        return {
            contentType: document.getElementById('contentType')?.value || '',
            fileFormat: document.getElementById('fileFormat')?.value || 'any',
            // Sanitize inputs
            websiteScope: this.utils.sanitizeInput(document.getElementById('websiteScope')?.value || ''),
            keywords: this.utils.sanitizeInput(document.getElementById('keywords')?.value || ''),
            downloadFocus: document.getElementById('downloadFocus')?.checked || false
        };
    }

    mapToQueryParams(formValues) {
        const params = {
            contentType: formValues.contentType,
            keywords: formValues.keywords,
            site: formValues.websiteScope,
            ext: formValues.fileFormat,
            downloadFocus: formValues.downloadFocus
        };

        return params;
    }

    async copyQuery() {
        if (!this.currentQuery) {
            this.utils.showToast('Please build a query first', 'error');
            return;
        }
        const success = await this.engine.copyQuery(this.currentQuery);
        if (success) this.utils.showToast('Query copied to clipboard!', 'success');
    }

    openInSearch() {
        if (!this.currentQuery) {
            this.utils.showToast('Please build a query first', 'error');
            return;
        }

        // Validate query before opening
        const validation = this.engine.validateQuery(this.currentQuery);
        if (validation.warnings.length > 0) {
            console.warn('Query warnings:', validation.warnings);
        }

        this.engine.openInSearch(this.currentQuery);
        this.utils.showToast('Opening in search engine...', 'success');
    }

    setupKeyboardAccessibility() {
        document.addEventListener('keydown', (e) => {
            // Only targets with role="button" or tabindex="0" that aren't native inputs
            const target = e.target;
            const isInteractive = target.getAttribute('role') === 'button' || target.getAttribute('tabindex') === '0';
            const isNativeInput = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(target.tagName);

            if (isInteractive && !isNativeInput) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent scrolling for Space

                    // Special case for checkbox labels causing double-trigger
                    if (target.tagName === 'LABEL' && target.getAttribute('for')) {
                        // Native behavior usually handles this, but if we preventDefault we might need to manual trigger
                        // For now, let's assume if it has 'for', we might not need to do anything if we didn't preventDefault for Enter
                        // But we DID preventDefault.
                        const input = document.getElementById(target.getAttribute('for'));
                        if (input) input.click();
                        return;
                    }

                    // Specific handling for our mode toggle which wraps input but might not have 'for' if nested
                    if (target.classList.contains('mode-toggle')) {
                        const input = target.querySelector('input');
                        if (input) {
                            input.checked = !input.checked;
                            // Manually dispatch change event since setting checked property doesn't trigger it
                            const event = new Event('change', { bubbles: true });
                            input.dispatchEvent(event);
                        }
                        return;
                    }

                    target.click();
                }
            }
        });

        console.log('Keyboard accessibility listeners attached');
    }

    // ============================================================
    // PRO MODE
    // ============================================================
    async loadDorks() {
        console.log('Loading dorks...');

        // Strategy 1: Fetch from JSON (Preferred for GitHub Pages / Web Server)
        try {
            const response = await fetch('./assets/data/dorks.json');
            if (response.ok) {
                const data = await response.json();
                this.dorks = Array.isArray(data) ? data : (data.dorks || []);
                this.filteredDorks = [...this.dorks];
                console.log('Loaded dorks via JSON fetch:', this.dorks.length);
                this.updateResultsCount();
                return; // Success
            }
        } catch (e) {
            console.warn('JSON fetch failed (normal for offline/file: protocol):', e);
        }

        // Strategy 2: Fallback to Embedded Data (Critical for Offline / file:// protocol)
        if (window.DORKS_DATA && Array.isArray(window.DORKS_DATA)) {
            this.dorks = window.DORKS_DATA;
            this.filteredDorks = [...this.dorks];
            console.log('Loaded dorks via Embedded Script (Offline Mode):', this.dorks.length);
            // Only show toast if we actually fell back (implicit success)
            // Fallback successful - silent mode
            this.updateResultsCount();
            return;
        }

        // Failure
        console.error('Failed to load dorks from both JSON and Embedded sources.');
        this.utils.showToast('Failed to load dorks database', 'error');
    }

    initProMode() {
        console.log('Initializing Pro Mode...');
        this.currentPhase = 'all';
        this.targetDomain = '';
        this.setupProModeListeners();
        this.filterAndRenderDorks();
    }

    setupProModeListeners() {
        // Phase tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPhase = e.target.getAttribute('data-phase');
                this.filterAndRenderDorks();
            });
        });

        // Target domain
        const targetInput = document.getElementById('targetDomain');
        if (targetInput) {
            targetInput.addEventListener('input', this.utils.debounce(() => {
                const isValid = this.utils.validateDomain(targetInput.value);
                this.toggleValidationState(targetInput, isValid, 'Invalid domain format');

                // Only clean if valid (or empty)
                this.targetDomain = this.utils.sanitizeInput(targetInput.value.trim());
                this.renderDorks();
            }, 300));
        }

        // Search
        const searchInput = document.getElementById('searchDorks');
        if (searchInput) {
            searchInput.addEventListener('input', this.utils.debounce(() => this.filterAndRenderDorks(), 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterAndRenderDorks());
        }

        // Risk filter
        const riskFilter = document.getElementById('riskFilter');
        if (riskFilter) {
            riskFilter.addEventListener('change', () => this.filterAndRenderDorks());
        }

        // Export button
        const exportBtn = document.getElementById('exportDorks');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportFilteredDorks());
        }

        // Clear filters button
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    filterAndRenderDorks() {
        const searchTerm = document.getElementById('searchDorks')?.value.toLowerCase() || '';
        const riskLevel = document.getElementById('riskFilter')?.value || 'all';
        const category = document.getElementById('categoryFilter')?.value || 'all';

        this.filteredDorks = this.dorks.filter(dork => {
            if (this.currentPhase !== 'all' && dork.phase !== parseInt(this.currentPhase)) return false;
            if (searchTerm && !this.matchesSearch(dork, searchTerm)) return false;
            if (riskLevel !== 'all' && dork.risk.toLowerCase() !== riskLevel) return false;
            if (category !== 'all' && dork.category !== category) return false;
            return true;
        });

        this.renderDorks();
        this.updateResultsCount();
        this.updateStatsDashboard();
    }

    updateStatsDashboard() {
        const dashboard = document.getElementById('statsDashboard');
        if (!dashboard) return;

        const total = this.filteredDorks.length;
        const critical = this.filteredDorks.filter(d => d.risk.toLowerCase() === 'critical').length;
        const high = this.filteredDorks.filter(d => d.risk.toLowerCase() === 'high').length;
        const medium = this.filteredDorks.filter(d => d.risk.toLowerCase() === 'medium').length;

        dashboard.innerHTML = `
            <div class="stat-pille">
                <span class="stat-value">${total}</span>
                <span class="stat-label">Total Dorks</span>
            </div>
            <div class="stat-pille critical">
                <span class="stat-value">${critical}</span>
                <span class="stat-label">Critical Risk</span>
            </div>
            <div class="stat-pille high">
                <span class="stat-value">${high}</span>
                <span class="stat-label">High Risk</span>
            </div>
            <div class="stat-pille">
                <span class="stat-value">${medium}</span>
                <span class="stat-label">Medium Risk</span>
            </div>
        `;
    }

    matchesSearch(dork, term) {
        return dork.title.toLowerCase().includes(term) ||
            dork.description.toLowerCase().includes(term) ||
            dork.query.toLowerCase().includes(term) ||
            dork.category.toLowerCase().includes(term);
    }

    renderDorks() {
        const container = document.getElementById('dorksContainer');
        if (!container) return;

        if (this.filteredDorks.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <h3 class="empty-state-title">No Dorks Identified</h3>
                    <p class="empty-state-text">We couldn't find any dorks matching your current filters. Try relaxing your search criteria or changing categories.</p>
                    <div class="empty-state-hint">💡 Tip: Try the "All Phases" tab to see everything</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredDorks.map(dork => this.createDorkCard(dork)).join('');
        this.attachDorkCardListeners();
    }

    createDorkCard(dork) {
        // Always use buildFromTemplate to properly handle domain placeholders
        const query = this.engine.buildFromTemplate(dork.query, this.targetDomain);
        const riskClass = `badge-risk-${dork.risk.toLowerCase()}`;

        return `
      <div class="dork-card">
        <div class="dork-card-header">
          <h3 class="dork-card-title">${this.utils.sanitizeHTML(dork.title)}</h3>
          <span class="badge ${riskClass}">${dork.risk}</span>
        </div>
        <p class="dork-card-description">${this.utils.sanitizeHTML(dork.description)}</p>
        <div class="dork-card-query">${this.utils.sanitizeHTML(query)}</div>
        <div class="dork-card-footer">
          <div class="dork-card-tags">
            <span class="badge" style="font-size: 0.6875rem; background: var(--color-bg-tertiary);">Phase ${dork.phase}</span>
            <span class="badge" style="font-size: 0.6875rem; background: var(--color-bg-tertiary);">${dork.category}</span>
          </div>
          <div class="dork-card-actions">
            <button class="btn btn-ghost btn-sm copy-dork-btn liquid-btn" data-dork-id="${dork.id}" style="padding: var(--space-2) var(--space-3); font-size: 0.8125rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>
            <button class="btn btn-primary btn-sm search-dork-btn liquid-btn liquid-btn-primary" data-dork-id="${dork.id}" style="padding: var(--space-2) var(--space-3); font-size: 0.8125rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Search
            </button>
          </div>
        </div>
      </div>
    `;
    }

    attachDorkCardListeners() {
        document.querySelectorAll('.copy-dork-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const dorkId = e.target.getAttribute('data-dork-id');
                const dork = this.dorks.find(d => d.id === dorkId);
                if (!dork) return;

                // Always use buildFromTemplate to properly handle domain placeholders
                const query = this.engine.buildFromTemplate(dork.query, this.targetDomain);

                // Warn user if dork requires domain but none provided
                if (!this.targetDomain && dork.query.includes('[domain]')) {
                    this.utils.showToast('💡 Tip: Enter a target domain for better results', 'success');
                }

                const success = await this.engine.copyQueryWithMetadata(dork, query);
                if (success) this.utils.showToast('Dork copied with metadata!', 'success');
            });
        });

        document.querySelectorAll('.search-dork-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dorkId = e.target.getAttribute('data-dork-id');
                const dork = this.dorks.find(d => d.id === dorkId);
                if (!dork) return;

                // Always use buildFromTemplate to properly handle domain placeholders
                const query = this.engine.buildFromTemplate(dork.query, this.targetDomain);

                // Warn user if dork requires domain but none provided
                if (!this.targetDomain && dork.query.includes('[domain]')) {
                    this.utils.showToast('⚠️ This dork works best with a target domain', 'success');
                }

                this.engine.openInSearch(query);
                this.utils.showToast(`Searching: ${dork.title}`, 'success');
            });
        });
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const count = this.filteredDorks.length;
            const total = this.dorks.length;
            resultsCount.textContent = `Showing ${count} of ${total} dorks`;
        }
    }

    clearAllFilters() {
        // Reset all filters
        const searchInput = document.getElementById('searchDorks');
        const categoryFilter = document.getElementById('categoryFilter');
        const riskFilter = document.getElementById('riskFilter');
        const targetInput = document.getElementById('targetDomain');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (riskFilter) riskFilter.value = 'all';
        if (targetInput) targetInput.value = '';

        // Reset phase to all
        this.currentPhase = 'all';
        this.targetDomain = '';
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-phase') === 'all') {
                tab.classList.add('active');
            }
        });

        // Re-render
        this.filterAndRenderDorks();
        this.utils.showToast('Filters cleared', 'success');
    }

    exportFilteredDorks() {
        if (this.filteredDorks.length === 0) {
            this.utils.showToast('No dorks to export', 'error');
            return;
        }

        // Prepare export data
        const exportData = this.filteredDorks.map(dork => {
            // Always use buildFromTemplate for consistent query handling
            const query = this.engine.buildFromTemplate(dork.query, this.targetDomain);
            return {
                id: dork.id,
                title: dork.title,
                description: dork.description,
                query: query,
                category: dork.category,
                phase: dork.phase,
                risk: dork.risk,
                defensive_note: dork.defensive_note
            };
        });

        // Create JSON file
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `dorks_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.utils.showToast(`Exported ${exportData.length} dorks`, 'success');
    }
}

console.log('App.js loaded');

// ============================================================
// Custom Select Component (Liquid Glass with Icons)
// ============================================================
class CustomSelect {
    constructor(originalSelect) {
        this.originalSelect = originalSelect;
        this.iconMap = this.getIconMap();
        this.isOpen = false;
        this.createCustomDOM();
        this.setupListeners();
    }

    getIconMap() {
        return {
            'all': '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
            'videos': '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>',
            'documents': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
            'audio': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
            'software': '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle>',
            'images': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
            'archives': '<path d="M21 8v13H3V8"></path><path d="M1 3h22v5H1z"></path><line x1="10" y1="12" x2="14" y2="12"></line>',
            'google': '<path d="M20.94 11c.04.33.06.66.06 1 0 5-3.5 8.5-8.5 8.5C7.25 20.5 3 16.25 3 11S7.25 1.5 12.5 1.5c2.4 0 4.5.9 6.1 2.4l-3.1 3.1c-1-.9-2.2-1.4-3-1.4-2.5 0-4.5 2.1-4.5 4.5s2 4.5 4.5 4.5c2.6 0 3.8-1.8 4.1-3H12.5v-3H21z"></path>',
            'bing': '<polygon points="12 2 2 7 12 22 22 7 12 2"></polygon>',
            'yahoo': '<path d="M7 2l5 9 5-9M12 11v11"></path>',
            'duckduckgo': '<path d="M12 2c2.8 0 5 2.2 5 5 0 2-1.2 3.8-3 4.6V13a2 2 0 0 1-4 0v-1.4c-1.8-.8-3-2.6-3-4.6 0-2.8 2.2-5 5-5zM9 14.5c-1.5 0-3 1.5-3 3.5s1.5 3.5 3 3.5h6c1.5 0 3-1.5 3-3.5s-1.5-3.5-3-3.5"></path>',
            'startpage': '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line>',
            'brave': '<path d="M12 2l-3.5 2L4 9l1 11 7 2 7-2 1-11-4.5-5L12 2zm0 15.5l-2.5-2h5l-2.5 2zM8.5 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm10 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"></path>',
            'low': '<circle cx="12" cy="12" r="10"></circle>',
            'medium': '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>',
            'high': '<polygon points="12 2 2 22 22 22 12 2"></polygon>',
            'critical': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line>',
            'Reconnaissance': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
            'Sensitive Files': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>',
            'Authentication': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
            'SQL Injection': '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>',
            'XSS': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
            'LFI/RFI': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M9 13h6l-3-3 3 3-3 3"></path>',
            'Intelligence': '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
            'Infrastructure': '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>'
        };
    }

    createCustomDOM() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'custom-select-wrapper';

        this.originalSelect.style.display = 'none';
        this.originalSelect.parentNode.insertBefore(this.wrapper, this.originalSelect);
        this.wrapper.appendChild(this.originalSelect);

        this.selectedDisplay = document.createElement('div');
        this.selectedDisplay.className = 'custom-select-trigger';
        this.updateSelectedDisplay();
        this.wrapper.appendChild(this.selectedDisplay);

        // Options Container - Attached to body later
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'custom-options portal';
        this.renderOptions();
    }

    renderOptions() {
        this.optionsContainer.innerHTML = '';
        Array.from(this.originalSelect.options).forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-option' + (option.value === this.originalSelect.value ? ' selected' : '');
            optionDiv.setAttribute('data-value', option.value);

            const iconPath = this.iconMap[option.value] || this.iconMap[option.textContent] || '';
            const iconHTML = iconPath ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="select-icon">${iconPath}</svg>` : '';

            optionDiv.innerHTML = `${iconHTML}<span class="option-text">${option.textContent}</span>`;
            optionDiv.addEventListener('mousedown', (e) => { // Use mousedown to trigger before blur
                this.selectOption(option.value);
                e.preventDefault();
            });
            this.optionsContainer.appendChild(optionDiv);
        });
    }

    updateSelectedDisplay() {
        const selectedOption = this.originalSelect.options[this.originalSelect.selectedIndex];
        if (!selectedOption) return;
        const iconPath = this.iconMap[selectedOption.value] || this.iconMap[selectedOption.textContent] || '';
        const iconHTML = iconPath ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="select-icon">${iconPath}</svg>` : '';
        this.selectedDisplay.innerHTML = `${iconHTML}<span class="select-value">${selectedOption.textContent}</span><div class="select-arrow"></div>`;
    }

    selectOption(value) {
        this.originalSelect.value = value;
        this.originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
        this.close();
        this.updateSelectedDisplay();
    }

    open() {
        if (this.isOpen) return;

        // Close other selects
        document.querySelectorAll('.custom-select-wrapper.open').forEach(el => {
            el.dispatchEvent(new CustomEvent('closeRequest'));
        });

        document.body.appendChild(this.optionsContainer);
        this.positionDropdown();
        this.wrapper.classList.add('open');
        this.optionsContainer.classList.add('visible');
        this.isOpen = true;

        // Sync selection highlight
        this.renderOptions();
    }

    close() {
        if (!this.isOpen) return;
        this.wrapper.classList.remove('open');
        this.optionsContainer.classList.remove('visible');
        setTimeout(() => {
            if (this.optionsContainer.parentNode === document.body) {
                document.body.removeChild(this.optionsContainer);
            }
        }, 200); // Wait for transition
        this.isOpen = false;
    }

    positionDropdown() {
        const rect = this.selectedDisplay.getBoundingClientRect();
        const dropHeight = Math.min(this.optionsContainer.scrollHeight, 280);

        // Horizontal
        this.optionsContainer.style.width = `${rect.width}px`;
        this.optionsContainer.style.left = `${rect.left + window.scrollX}px`;

        // Vertical detection
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < dropHeight && rect.top > dropHeight) {
            // Open Upwards
            this.optionsContainer.style.top = `${rect.top + window.scrollY - dropHeight}px`;
            this.optionsContainer.classList.add('opens-up');
        } else {
            // Open Downwards
            this.optionsContainer.style.top = `${rect.bottom + window.scrollY}px`;
            this.optionsContainer.classList.remove('opens-up');
        }
    }

    setupListeners() {
        this.selectedDisplay.addEventListener('click', (e) => {
            if (this.isOpen) this.close();
            else this.open();
            e.stopPropagation();
        });

        this.wrapper.addEventListener('closeRequest', () => this.close());

        window.addEventListener('resize', () => {
            if (this.isOpen) this.positionDropdown();
        });

        window.addEventListener('scroll', () => {
            if (this.isOpen) this.positionDropdown();
        }, true);

        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target) && !this.optionsContainer.contains(e.target)) {
                this.close();
            }
        });
    }
}
