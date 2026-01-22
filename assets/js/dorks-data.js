// Embedded Dorks Database - Simplified and Working Queries
// All queries tested to return actual results on Google

window.DORKS_DATA = [
    // ============================================================
    // PHASE 1: RECONNAISSANCE
    // ============================================================
    {
        "id": "recon-001",
        "title": "Subdomain Discovery",
        "description": "Find subdomains indexed by Google",
        "query": "site:*.[domain]",
        "category": "Reconnaissance",
        "phase": 1,
        "risk": "Low",
        "defensive_note": "Monitor for subdomain enumeration attempts."
    },
    {
        "id": "recon-002",
        "title": "Directory Listings",
        "description": "Find open directory indexes",
        "query": "site:[domain] intitle:\"index of\"",
        "category": "Reconnaissance",
        "phase": 1,
        "risk": "Medium",
        "defensive_note": "Disable directory listing in web server."
    },
    {
        "id": "recon-003",
        "title": "Login Pages",
        "description": "Find login and authentication pages",
        "query": "site:[domain] inurl:login",
        "category": "Reconnaissance",
        "phase": 1,
        "risk": "Low",
        "defensive_note": "Implement rate limiting on login pages."
    },
    {
        "id": "recon-004",
        "title": "Admin Panels",
        "description": "Find admin/backend panels",
        "query": "site:[domain] inurl:admin",
        "category": "Reconnaissance",
        "phase": 1,
        "risk": "Medium",
        "defensive_note": "Restrict admin panel access by IP."
    },
    {
        "id": "recon-005",
        "title": "Sitemap Files",
        "description": "Find XML sitemaps",
        "query": "site:[domain] filetype:xml inurl:sitemap",
        "category": "Reconnaissance",
        "phase": 1,
        "risk": "Low",
        "defensive_note": "Review sitemap for sensitive URLs."
    },

    // ============================================================
    // PHASE 2: SENSITIVE FILES
    // ============================================================
    {
        "id": "files-001",
        "title": "PDF Documents",
        "description": "Find all PDF files on domain",
        "query": "site:[domain] filetype:pdf",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Low",
        "defensive_note": "Review PDFs for sensitive metadata."
    },
    {
        "id": "files-002",
        "title": "Excel Files",
        "description": "Find spreadsheets that may contain data",
        "query": "site:[domain] filetype:xlsx OR filetype:xls",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Medium",
        "defensive_note": "Don't expose spreadsheets publicly."
    },
    {
        "id": "files-003",
        "title": "Word Documents",
        "description": "Find Word documents on domain",
        "query": "site:[domain] filetype:doc OR filetype:docx",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Low",
        "defensive_note": "Strip metadata from documents."
    },
    {
        "id": "files-004",
        "title": "Text Files",
        "description": "Find plain text files",
        "query": "site:[domain] filetype:txt",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Medium",
        "defensive_note": "Review text files for credentials."
    },
    {
        "id": "files-005",
        "title": "SQL Files",
        "description": "Find SQL database files",
        "query": "site:[domain] filetype:sql",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Critical",
        "defensive_note": "Never expose SQL files publicly."
    },
    {
        "id": "files-006",
        "title": "Log Files",
        "description": "Find exposed log files",
        "query": "site:[domain] filetype:log",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "High",
        "defensive_note": "Store logs outside web root."
    },
    {
        "id": "files-007",
        "title": "Config Files",
        "description": "Find configuration files",
        "query": "site:[domain] filetype:conf OR filetype:config",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Critical",
        "defensive_note": "Block config files via .htaccess."
    },
    {
        "id": "files-008",
        "title": "Backup Files",
        "description": "Find backup files",
        "query": "site:[domain] filetype:bak OR filetype:backup",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "High",
        "defensive_note": "Remove backups from production."
    },
    {
        "id": "files-009",
        "title": "Environment Files",
        "description": "Find .env configuration files",
        "query": "site:[domain] filetype:env",
        "category": "Sensitive Files",
        "phase": 2,
        "risk": "Critical",
        "defensive_note": "Block .env files in web server config."
    },

    // ============================================================
    // PHASE 3: AUTHENTICATION
    // ============================================================
    {
        "id": "auth-001",
        "title": "WordPress Login",
        "description": "Find WordPress admin login",
        "query": "site:[domain] inurl:wp-login.php",
        "category": "Authentication",
        "phase": 3,
        "risk": "Medium",
        "defensive_note": "Change default WP login URL."
    },
    {
        "id": "auth-002",
        "title": "phpMyAdmin",
        "description": "Find phpMyAdmin interfaces",
        "query": "site:[domain] inurl:phpmyadmin",
        "category": "Authentication",
        "phase": 3,
        "risk": "High",
        "defensive_note": "Restrict phpMyAdmin by IP."
    },
    {
        "id": "auth-003",
        "title": "Control Panel",
        "description": "Find cPanel or control panels",
        "query": "site:[domain] inurl:cpanel OR inurl:webmail",
        "category": "Authentication",
        "phase": 3,
        "risk": "Medium",
        "defensive_note": "Use strong passwords for panels."
    },
    {
        "id": "auth-004",
        "title": "Password Pages",
        "description": "Find pages mentioning passwords",
        "query": "site:[domain] intext:password filetype:txt",
        "category": "Authentication",
        "phase": 3,
        "risk": "Critical",
        "defensive_note": "Never store passwords in text files."
    },
    {
        "id": "auth-005",
        "title": "User Database",
        "description": "Find pages with user data",
        "query": "site:[domain] intext:username filetype:sql",
        "category": "Authentication",
        "phase": 3,
        "risk": "Critical",
        "defensive_note": "Secure all database exports."
    },

    // ============================================================
    // PHASE 4: VULNERABILITIES
    // ============================================================
    {
        "id": "vuln-001",
        "title": "SQL Error Messages",
        "description": "Find SQL error pages",
        "query": "site:[domain] intext:\"sql syntax\"",
        "category": "SQL Injection",
        "phase": 4,
        "risk": "Critical",
        "defensive_note": "Disable error display in production."
    },
    {
        "id": "vuln-002",
        "title": "PHP Errors",
        "description": "Find PHP error messages",
        "query": "site:[domain] intext:\"Warning: mysql\"",
        "category": "SQL Injection",
        "phase": 4,
        "risk": "High",
        "defensive_note": "Set display_errors = Off in php.ini."
    },
    {
        "id": "vuln-003",
        "title": "ID Parameters",
        "description": "Find URLs with ID parameters",
        "query": "site:[domain] inurl:id=",
        "category": "SQL Injection",
        "phase": 4,
        "risk": "Medium",
        "defensive_note": "Use parameterized queries."
    },
    {
        "id": "vuln-004",
        "title": "Page Parameters",
        "description": "Find file inclusion parameters",
        "query": "site:[domain] inurl:page=",
        "category": "LFI/RFI",
        "phase": 4,
        "risk": "High",
        "defensive_note": "Validate all file path inputs."
    },
    {
        "id": "vuln-005",
        "title": "File Parameters",
        "description": "Find file parameter URLs",
        "query": "site:[domain] inurl:file=",
        "category": "LFI/RFI",
        "phase": 4,
        "risk": "High",
        "defensive_note": "Use whitelist for file includes."
    },
    {
        "id": "vuln-006",
        "title": "Redirect Parameters",
        "description": "Find redirect URLs",
        "query": "site:[domain] inurl:redirect=",
        "category": "Open Redirect",
        "phase": 4,
        "risk": "Medium",
        "defensive_note": "Validate redirect destinations."
    },
    {
        "id": "vuln-007",
        "title": "Search Parameters",
        "description": "Find search functionality",
        "query": "site:[domain] inurl:search=",
        "category": "XSS",
        "phase": 4,
        "risk": "Medium",
        "defensive_note": "Sanitize search input/output."
    },

    // ============================================================
    // PHASE 5: INTELLIGENCE
    // ============================================================
    {
        "id": "intel-001",
        "title": "Email Addresses",
        "description": "Find email addresses on site",
        "query": "site:[domain] intext:@[domain]",
        "category": "Intelligence",
        "phase": 5,
        "risk": "Low",
        "defensive_note": "Use contact forms instead of emails."
    },
    {
        "id": "intel-002",
        "title": "Phone Numbers",
        "description": "Find phone numbers on site",
        "query": "site:[domain] intext:\"phone\" OR intext:\"contact\"",
        "category": "Intelligence",
        "phase": 5,
        "risk": "Low",
        "defensive_note": "Limit public contact info."
    },
    {
        "id": "intel-003",
        "title": "Confidential Docs",
        "description": "Find confidential documents",
        "query": "site:[domain] intext:confidential filetype:pdf",
        "category": "Intelligence",
        "phase": 5,
        "risk": "High",
        "defensive_note": "Don't expose confidential docs."
    },
    {
        "id": "intel-004",
        "title": "Internal Documents",
        "description": "Find internal use documents",
        "query": "site:[domain] intext:\"internal use only\"",
        "category": "Intelligence",
        "phase": 5,
        "risk": "High",
        "defensive_note": "Implement access controls."
    },

    // ============================================================
    // PHASE 6: INFRASTRUCTURE
    // ============================================================
    {
        "id": "infra-001",
        "title": "Server Info",
        "description": "Find server information pages",
        "query": "site:[domain] intitle:\"Apache Status\"",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "Medium",
        "defensive_note": "Disable server status pages."
    },
    {
        "id": "infra-002",
        "title": "PHP Info",
        "description": "Find phpinfo() pages",
        "query": "site:[domain] inurl:phpinfo.php",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "High",
        "defensive_note": "Remove phpinfo files from production."
    },
    {
        "id": "infra-003",
        "title": "Git Exposure",
        "description": "Find exposed git repositories",
        "query": "site:[domain] inurl:.git",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "Critical",
        "defensive_note": "Block .git directory access."
    },
    {
        "id": "infra-004",
        "title": "SVN Exposure",
        "description": "Find exposed SVN repositories",
        "query": "site:[domain] inurl:.svn",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "Critical",
        "defensive_note": "Block .svn directory access."
    },
    {
        "id": "infra-005",
        "title": "API Endpoints",
        "description": "Find API documentation",
        "query": "site:[domain] inurl:api",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "Medium",
        "defensive_note": "Secure API endpoints with auth."
    },
    {
        "id": "infra-006",
        "title": "Swagger Docs",
        "description": "Find Swagger API docs",
        "query": "site:[domain] inurl:swagger",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "Medium",
        "defensive_note": "Protect API documentation."
    },
    {
        "id": "infra-007",
        "title": "Debug Pages",
        "description": "Find debug/test pages",
        "query": "site:[domain] inurl:debug OR inurl:test",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "High",
        "defensive_note": "Remove debug pages from production."
    },
    {
        "id": "infra-008",
        "title": "Staging/Dev Sites",
        "description": "Find staging or dev environments",
        "query": "site:*.[domain] inurl:staging OR inurl:dev",
        "category": "Infrastructure",
        "phase": 6,
        "risk": "Medium",
        "defensive_note": "Secure staging environments."
    }
];

console.log('Dorks data loaded:', window.DORKS_DATA.length, 'dorks');
