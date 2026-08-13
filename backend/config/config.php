<?php
/**
 * =====================================================
 * Global Configuration File
 * File: config.php
 * Purpose: Central configuration for the application
 * =====================================================
 */

// Start session
session_start();

// Set timezone
date_default_timezone_set('UTC');

// Error Reporting (disable in production)
if (getenv('APP_ENV') !== 'production') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
}

// Application Constants
define('APP_NAME', 'StudyHub');
define('APP_URL', 'http://localhost:8000');
define('UPLOAD_DIR', dirname(__DIR__) . '/uploads/');
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt', 'zip']);
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// Session Configuration
define('SESSION_TIMEOUT', 1800); // 30 minutes
define('CSRF_TOKEN_NAME', '_csrf_token');

// Pagination
define('ITEMS_PER_PAGE', 10);

// Response Status Codes
define('SUCCESS', 'success');
define('ERROR', 'error');
define('VALIDATION_ERROR', 'validation_error');
define('NOT_FOUND', 'not_found');
define('UNAUTHORIZED', 'unauthorized');

// Include database connection
require_once dirname(__DIR__) . '/config/db_connect.php';

// Include helper functions
require_once dirname(__DIR__) . '/helpers/functions.php';

?>
