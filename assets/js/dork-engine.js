// ============================================================
// Enhanced Dork Engine - Advanced Google Query Builder
// ============================================================

/**
 * Advanced Google Dork Query Builder Engine
 * Supports multiple search engines, advanced operators, and query optimization
 */
class DorkEngine {
    constructor() {
        // Search engine configurations - All tested and working
        this.searchEngines = {
            google: {
                name: 'Google',
                baseURL: 'https://www.google.com/search',
                queryParam: 'q',
                supportsAdvanced: true
            },
            bing: {
                name: 'Bing',
                baseURL: 'https://www.bing.com/search',
                queryParam: 'q',
                supportsAdvanced: true
            },
            yahoo: {
                name: 'Yahoo',
                baseURL: 'https://search.yahoo.com/search',
                queryParam: 'p',
                supportsAdvanced: true
            },
            duckduckgo: {
                name: 'DuckDuckGo',
                baseURL: 'https://duckduckgo.com/',
                queryParam: 'q',
                supportsAdvanced: true
            },
            startpage: {
                name: 'Startpage',
                baseURL: 'https://www.startpage.com/do/search',
                queryParam: 'query',
                supportsAdvanced: true
            },
            brave: {
                name: 'Brave Search',
                baseURL: 'https://search.brave.com/search',
                queryParam: 'q',
                supportsAdvanced: true
            }
        };

        this.currentEngine = 'google';

        // Google Dork operators (Preserved Original)
        this.googleOperators = {
            site: 'site:',
            filetype: 'filetype:',
            ext: 'ext:',
            inurl: 'inurl:',
            allinurl: 'allinurl:',
            intitle: 'intitle:',
            allintitle: 'allintitle:',
            intext: 'intext:',
            allintext: 'allintext:',
            cache: 'cache:',
            link: 'link:',
            related: 'related:',
            info: 'info:',
            define: 'define:',
            stocks: 'stocks:',
            map: 'map:',
            movie: 'movie:',
            weather: 'weather:',
            source: 'source:',
            before: 'before:',
            after: 'after:'
        };

        // Bing / Yahoo / DuckDuckGo Operators (Standardized)
        // Many don't support 'ext:', they prefer 'filetype:'
        // 'inurl' support varies, but we'll map it for best effort or fallback
        this.commonOperators = {
            site: 'site:',
            filetype: 'filetype:',
            ext: 'filetype:',       // Mapped: 'ext' -> 'filetype'
            inurl: 'inbody:',       // Bing often prefers inbody or just keywords. inurl is weak.
            allinurl: 'inbody:',    // Fallback
            intitle: 'intitle:',
            allintitle: 'intitle:', // Fallback
            intext: 'inbody:',      // Bing uses 'inbody:'
            allintext: 'inbody:',   // Fallback
            cache: '',              // Not supported generally
            link: '',               // Not supported generally
            related: '',
            info: '',
            define: '',
            stocks: '',
            map: '',
            movie: '',
            weather: '',
            source: '',
            before: '',
            after: ''
        };

        // Content type mappings
        this.contentTypes = {
            all: {
                extensions: [], // No specific extensions, allow all
                keywords: [],
                baseDork: 'intitle:"index of"'
            },
            videos: {
                extensions: ['mp4', 'mkv', 'avi', 'flv', 'mov', 'wmv', 'webm'],
                keywords: ['movie', 'video', 'film', 'episode'],
                baseDork: 'intitle:"index of" (mp4|mkv|avi|flv) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml)'
            },
            downloads: {
                extensions: ['*'],
                keywords: ['download', 'free', 'direct link'],
                baseDork: '(intitle:download OR inurl:download OR inurl:dl) -inurl:(signup|login|register)'
            },
            documents: {
                extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'],
                keywords: ['document', 'report', 'manual', 'guide'],
                baseDork: 'intitle:"index of" (pdf|doc|docx|txt) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml)'
            },
            audio: {
                extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma'],
                keywords: ['music', 'audio', 'song', 'album'],
                baseDork: 'intitle:"index of" (mp3|wav|flac|aac) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml)'
            },
            software: {
                extensions: ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'apk', 'ipa', 'iso'],
                keywords: ['software', 'application', 'installer', 'setup'],
                baseDork: 'intitle:"index of" (exe|iso|dmg|apk) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml)'
            },
            images: {
                extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'],
                keywords: ['image', 'photo', 'picture', 'gallery'],
                baseDork: 'intitle:"index of" (jpg|png|gif|svg) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml)'
            },
            archives: {
                extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
                keywords: ['archive', 'backup', 'compressed'],
                baseDork: 'intitle:"index of" (zip|rar|7z|tar) -inurl:(jsp|pl|php|html|aspx|htm|cf|shtml)'
            }
        };

        // Query history
        this.queryHistory = this.loadHistory();
    }

    /**
     * Build advanced Google search query from parameters
     * @param {Object} params - Query parameters
     * @returns {string} - Formatted Google dork query
     */
    buildQuery(params) {
        let queryParts = [];

        // 1. Base Dork and Strategy Selection
        // 1. Base Dork and Strategy Selection
        const hasSite = params.site && params.site.trim().length > 0;

        if (params.contentType && this.contentTypes[params.contentType]) {
            const contentConfig = this.contentTypes[params.contentType];

            if (hasSite) {
                // Strategy: Site-Specific File Search (Smart Mode)
                // When a site is specified, "index of" usually fails. We switch to direct file discovery.
                // Ex: site:nasa.gov (ext:pdf OR ext:doc)
                if (contentConfig.extensions && contentConfig.extensions.length > 0 && contentConfig.extensions[0] !== '*') {
                    const extParams = contentConfig.extensions.map(ext => `ext:${ext}`).join(' OR ');
                    queryParts.push(`(${extParams})`);
                }
            } else if (params.downloadFocus && this.contentTypes.downloads) {
                // Strategy: Landing Pages (Download Focus)
                // Use extensions as keywords instead of "index.of" dork
                queryParts.push(this.contentTypes.downloads.baseDork);
                if (contentConfig.extensions && contentConfig.extensions.length > 0 && contentConfig.extensions[0] !== '*') {
                    const extParams = contentConfig.extensions.join('|');
                    queryParts.push(`(${extParams})`);
                }
            } else {
                // Strategy: Open Directories (Standard)
                // Best for broad searches across the web
                queryParts.push(contentConfig.baseDork);
            }
        } else if (params.downloadFocus && this.contentTypes.downloads) {
            // Strategy: Generic Download Focus (No specific content type)
            queryParts.push(this.contentTypes.downloads.baseDork);
        }

        // 2. Site operator
        if (params.site) {
            const cleanDomain = this.extractDomain(params.site);
            queryParts.push(`${this.operators.site}${cleanDomain}`);
        }

        // 3. File type/extension operator
        if (params.ext && params.ext !== 'any') {
            queryParts.push(`${this.operators.ext}${params.ext}`);
        }

        // 4. Keywords (with smart quoting)
        if (params.keywords) {
            const processedKeywords = this.processKeywords(params.keywords);
            queryParts.push(processedKeywords);
        }



        // 5. URL-specific operators
        if (params.inurl) {
            queryParts.push(`${this.operators.inurl}${params.inurl}`);
        }

        // 9. Custom raw query parts
        if (params.raw) {
            queryParts.push(params.raw);
        }

        // Join and clean up
        const query = queryParts.join(' ').trim();

        // Save to history
        if (query) {
            this.addToHistory(query);
        }

        return query;
    }

    /**
     * Get active operators based on current engine
     */
    getActiveOperators() {
        if (this.currentEngine === 'google' || this.currentEngine === 'startpage' || this.currentEngine === 'brave') {
            return this.googleOperators;
        } else {
            return this.commonOperators;
        }
    }

    /**
     * Build advanced Google search query from parameters
     * @param {Object} params - Query parameters
     * @returns {string} - Formatted Google dork query
     */
    buildQuery(params) {
        const ops = this.getActiveOperators();
        let queryParts = [];

        // 1. Base Dork and Strategy Selection
        const hasSite = params.site && params.site.trim().length > 0;

        if (params.contentType && this.contentTypes[params.contentType]) {
            const contentConfig = this.contentTypes[params.contentType];

            if (hasSite) {
                // Strategy: Site-Specific File Search
                if (contentConfig.extensions && contentConfig.extensions.length > 0 && contentConfig.extensions[0] !== '*') {
                    // Use engine-specific 'ext' operator (e.g., filetype: for Bing)
                    const extParams = contentConfig.extensions.map(ext => `${ops.ext}${ext}`).join(' OR ');
                    queryParts.push(`(${extParams})`);
                }
            } else if (params.downloadFocus && this.contentTypes.downloads) {
                // Strategy: Download Focus
                // Note: baseDorks often contain hardcoded Google operators (intitle:, inurl:)
                // For non-Google engines, we might need to strip or adapt these baseDorks?
                // For now, we assume intitle/index.of works on most (Bing supports intitle).
                // Google strict exclusions (-inurl:...) might break Bing.

                if (this.currentEngine === 'google') {
                    queryParts.push(this.contentTypes.downloads.baseDork);
                } else {
                    // Simplified base dork for others
                    queryParts.push('intitle:"index of" download');
                }

                if (contentConfig.extensions && contentConfig.extensions.length > 0 && contentConfig.extensions[0] !== '*') {
                    const extParams = contentConfig.extensions.join('|');
                    queryParts.push(`(${extParams})`);
                }
            } else {
                // Strategy: Open Directories
                if (this.currentEngine === 'google') {
                    queryParts.push(contentConfig.baseDork);
                } else {
                    // Simplified for Bing/Yahoo/DDG which might choke on complex exclusions
                    queryParts.push('intitle:"index of"');
                }
            }
        } else if (params.downloadFocus && this.contentTypes.downloads) {
            if (this.currentEngine === 'google') {
                queryParts.push(this.contentTypes.downloads.baseDork);
            } else {
                queryParts.push('intitle:"index of" download');
            }
        }

        // 2. Site operator
        if (params.site) {
            const cleanDomain = this.extractDomain(params.site);
            queryParts.push(`${ops.site}${cleanDomain}`);
        }

        // 3. File type/extension operator
        if (params.ext && params.ext !== 'any') {
            queryParts.push(`${ops.ext}${params.ext}`);
        }

        // 4. Keywords
        if (params.keywords) {
            const processedKeywords = this.processKeywords(params.keywords);
            queryParts.push(processedKeywords);
        }

        // 5. URL-specific operators
        if (params.inurl && ops.inurl) {
            queryParts.push(`${ops.inurl}${params.inurl}`);
        }

        // 6. Title operators
        if (params.intitle && ops.intitle) {
            queryParts.push(`${ops.intitle}${params.intitle}`);
        }

        // 7. Text operators
        if (params.intext && ops.intext) {
            queryParts.push(`${ops.intext}${params.intext}`);
        }

        // 8. Date range (Google Only usually)
        if (params.after && ops.after) {
            queryParts.push(`${ops.after}${params.after}`);
        }
        if (params.before && ops.before) {
            queryParts.push(`${ops.before}${params.before}`);
        }

        // 9. Custom raw query parts
        if (params.raw) {
            queryParts.push(params.raw);
        }

        // Join and clean up
        const finalQuery = queryParts.join(' ').trim();

        // Save to history
        if (finalQuery) {
            this.addToHistory(finalQuery);
        }

        return finalQuery;
    }

    /**
     * Process keywords with smart quoting and operators
     * @param {string} keywords - Raw keywords
     * @returns {string} - Processed keywords
     */
    processKeywords(keywords) {
        // Check if keywords contain operators
        const hasOperators = /[+\-"|()]/.test(keywords);

        if (hasOperators) {
            // User is using advanced syntax, return as-is
            return keywords;
        }

        // Split by spaces and process
        const terms = keywords.trim().split(/\s+/);

        if (terms.length === 1) {
            // Single word, no quotes needed
            return terms[0];
        } else {
            // Multi-word: Return as-is (cleanly joined)
            // Google defaults to AND logic, which is preferred over forcing a "phrase match".
            // Only quote if the user explicitly added quotes (which we checked above)
            return terms.join(' ');
        }
    }

    /**
     * Build query from dork template with domain substitution
     * @param {string} template - Dork template query
     * @param {string} domain - Target domain
     * @returns {string} - Query with domain substituted
     */
    buildFromTemplate(template, domain = '') {
        if (!domain) {
            // If no domain provided, remove the domain-dependent operators entirely
            // to avoid broken queries like "site:[domain]" which won't match anything
            let query = template
                // Remove site:*.[domain] patterns (subdomain discovery)
                .replace(/site:\*\.\[domain\]/gi, '')
                // Remove site:[domain] patterns
                .replace(/site:\[domain\]/gi, '')
                .replace(/site:\{domain\}/gi, '')
                // Remove intext:@[domain] patterns (email discovery)
                .replace(/intext:@\[domain\]/gi, '')
                .replace(/intext:@\{domain\}/gi, '')
                // Clean up any remaining [domain] or {domain} placeholders
                .replace(/\[domain\]/gi, '')
                .replace(/\{domain\}/gi, '')
                // Clean up any double spaces and trim
                .replace(/\s+/g, ' ')
                .trim();

            return query;
        }

        const cleanDomain = this.extractDomain(domain);

        // Replace all common placeholders (case-insensitive for [domain])
        return template
            .replace(/target\.com/g, cleanDomain)
            .replace(/\[domain\]/gi, cleanDomain)
            .replace(/\{domain\}/gi, cleanDomain)
            .replace(/DOMAIN/g, cleanDomain)
            .replace(/example\.com/g, cleanDomain);
    }

    /**
     * Set active search engine
     * @param {string} engine - Engine name
     */
    setEngine(engine) {
        if (this.searchEngines[engine]) {
            this.currentEngine = engine;
        }
    }

    /**
     * Encode and create search URL for current engine
     * @param {string} query - Search query
     * @param {string} engine - Optional engine override
     * @returns {string} - Complete search URL
     */
    encodeSearchURL(query, engine = null) {
        const targetEngine = engine || this.currentEngine;
        const engineConfig = this.searchEngines[targetEngine];

        if (!engineConfig) {
            console.error(`Unknown search engine: ${targetEngine}`);
            return '';
        }

        const params = new URLSearchParams();
        params.set(engineConfig.queryParam, query);

        return `${engineConfig.baseURL}?${params.toString()}`;
    }

    /**
     * Open query in search engine (new tab)
     * @param {string} query - Search query
     * @param {string} engine - Optional engine override
     */
    openInSearch(query, engine = null) {
        const url = this.encodeSearchURL(query, engine);
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    }

    /**
     * Copy query to clipboard
     * @param {string} query - Query to copy
     * @returns {Promise<boolean>} - Success status
     */
    async copyQuery(query) {
        return await window.DorkTool.utils.copyToClipboard(query);
    }

    /**
     * Copy query with metadata (for Pro mode)
     * @param {Object} dork - Dork object with metadata
     * @param {string} customizedQuery - Customized query string
     * @returns {Promise<boolean>} - Success status
     */
    async copyQueryWithMetadata(dork, customizedQuery) {
        const metadata = `
# Google Dork Query
# ==================
# Title: ${dork.title}
# Risk Level: ${dork.risk}
# Category: ${dork.category}
# Phase: ${dork.phase}
# Description: ${dork.description}
# ==================

${customizedQuery}

# Defensive Note:
# ${dork.defensive_note || 'N/A'}
    `.trim();

        return await window.DorkTool.utils.copyToClipboard(metadata);
    }

    /**
     * Validate domain format
     * @param {string} domain - Domain to validate
     * @returns {boolean} - Valid or not
     */
    isValidDomain(domain) {
        if (!domain) return true; // Empty is valid (optional)

        // Remove protocol if present
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

        // Basic domain validation regex
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        return domainRegex.test(cleanDomain);
    }

    /**
     * Extract domain from URL
     * @param {string} url - Full URL or domain
     * @returns {string} - Clean domain only (without www. prefix)
     */
    extractDomain(url) {
        if (!url) return '';

        let hostname = '';

        try {
            // Try parsing as URL
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            hostname = urlObj.hostname;
        } catch (e) {
            // Not a valid URL, clean up manually
            hostname = url
                .replace(/^https?:\/\//, '')
                .replace(/\/.*$/, '')
                .trim();
        }

        // Always strip www. prefix for consistency
        // This prevents issues like www.www.example.com when user enters www.example.com
        return hostname.replace(/^www\./i, '');
    }

    /**
     * Validate query (check for common mistakes)
     * @param {string} query - Query to validate
     * @returns {Object} - Validation result
     */
    validateQuery(query) {
        const warnings = [];
        const errors = [];

        if (!query || query.trim().length === 0) {
            errors.push('Query cannot be empty');
            return { valid: false, warnings, errors };
        }

        // Check for common mistakes
        if (query.includes('site:http://') || query.includes('site:https://')) {
            warnings.push('site: operator should use domain only, not full URL');
        }

        if (query.length > 500) {
            warnings.push('Very long query may not work as expected');
        }

        // Check for unmatched quotes
        const quoteCount = (query.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            warnings.push('Unmatched quotation marks detected');
        }

        // Check for unmatched parentheses
        const openParen = (query.match(/\(/g) || []).length;
        const closeParen = (query.match(/\)/g) || []).length;
        if (openParen !== closeParen) {
            warnings.push('Unmatched parentheses detected');
        }

        return {
            valid: errors.length === 0,
            warnings,
            errors
        };
    }

    /**
     * Export query in different formats
     * @param {string} query - Query to export
     * @param {string} format - Export format ('text', 'url', 'markdown', 'json')
     * @returns {string} - Formatted export
     */
    exportQuery(query, format = 'text') {
        const timestamp = new Date().toISOString();

        switch (format) {
            case 'url':
                return this.encodeSearchURL(query);

            case 'markdown':
                return `## Google Dork Query\n\n\`\`\`\n${query}\n\`\`\`\n\n[Open in ${this.searchEngines[this.currentEngine].name}](${this.encodeSearchURL(query)})\n\n*Generated: ${timestamp}*`;

            case 'json':
                return JSON.stringify({
                    query: query,
                    engine: this.currentEngine,
                    url: this.encodeSearchURL(query),
                    timestamp: timestamp
                }, null, 2);

            case 'text':
            default:
                return query;
        }
    }

    /**
     * Query history management
     */
    loadHistory() {
        try {
            const history = localStorage.getItem('dork_query_history');
            return history ? JSON.parse(history) : [];
        } catch (e) {
            console.warn('Failed to load query history:', e);
            return [];
        }
    }

    addToHistory(query) {
        if (!query || query.trim().length === 0) return;

        // Remove duplicates and add to front
        this.queryHistory = [
            query,
            ...this.queryHistory.filter(q => q !== query)
        ].slice(0, 50); // Keep last 50 queries

        try {
            localStorage.setItem('dork_query_history', JSON.stringify(this.queryHistory));
        } catch (e) {
            console.warn('Failed to save query history:', e);
        }
    }

    getHistory() {
        return this.queryHistory;
    }

    clearHistory() {
        this.queryHistory = [];
        try {
            localStorage.removeItem('dork_query_history');
        } catch (e) {
            console.warn('Failed to clear query history:', e);
        }
    }

    /**
     * Get popular dork templates by category
     * @returns {Object} - Categorized templates
     */
    getPopularTemplates() {
        return {
            discovery: [
                {
                    name: 'Subdomain Enumeration',
                    query: (domain) => `site:*.${domain}`,
                    description: 'Find all indexed subdomains'
                },
                {
                    name: 'Open Directories',
                    query: () => 'intitle:"Index of /" "Parent Directory"',
                    description: 'Find open directory listings'
                },
                {
                    name: 'Related Domains',
                    query: (domain) => `related:${domain}`,
                    description: 'Find similar websites'
                }
            ],
            files: [
                {
                    name: 'PDF Documents',
                    query: (domain) => domain ? `site:${domain} ext:pdf` : 'ext:pdf',
                    description: 'Find PDF files'
                },
                {
                    name: 'Excel Spreadsheets',
                    query: (domain) => domain ? `site:${domain} (ext:xlsx OR ext:xls)` : '(ext:xlsx OR ext:xls)',
                    description: 'Find Excel files'
                },
                {
                    name: 'SQL Dumps',
                    query: (domain) => domain ? `site:${domain} ext:sql` : 'ext:sql',
                    description: 'Find database dumps'
                }
            ],
            security: [
                {
                    name: 'Config Files',
                    query: (domain) => domain ? `site:${domain} (ext:env OR ext:config OR ext:ini)` : '(ext:env OR ext:config OR ext:ini)',
                    description: 'Find configuration files'
                },
                {
                    name: 'Login Pages',
                    query: (domain) => domain ? `site:${domain} (inurl:login OR inurl:admin)` : '(inurl:login OR inurl:admin)',
                    description: 'Find authentication pages'
                },
                {
                    name: 'Exposed Git',
                    query: (domain) => domain ? `site:${domain} inurl:.git` : 'inurl:.git',
                    description: 'Find exposed Git repositories'
                }
            ]
        };
    }

    /**
     * Generate random dork for testing
     * @returns {string} - Random dork query
     */
    generateRandomDork() {
        const templates = this.getPopularTemplates();
        const categories = Object.keys(templates);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryTemplates = templates[randomCategory];
        const randomTemplate = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];

        return randomTemplate.query();
    }
}

// Export DorkEngine class globally
window.DorkEngine = DorkEngine;

// Initialize and export instance
window.DorkTool = window.DorkTool || {};
window.DorkTool.engine = new DorkEngine();
