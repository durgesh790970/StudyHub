<?php
/**
 * =====================================================
 * Helper Functions
 * File: functions.php
 * Purpose: Reusable utility functions for the application
 * =====================================================
 */

/**
 * Sanitize user input
 * 
 * @param string $input - User input to sanitize
 * @return string - Sanitized input
 */
function sanitizeInput($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input);
    return $input;
}

/**
 * Validate email address
 * 
 * @param string $email - Email to validate
 * @return bool - True if valid, false otherwise
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Check if user is logged in
 * 
 * @return bool - True if logged in, false otherwise
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current logged-in user
 * 
 * @return array|null - User data or null if not logged in
 */
function getCurrentUser() {
    if (isLoggedIn()) {
        return [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'] ?? null,
            'email' => $_SESSION['user_email'] ?? null,
            'role' => $_SESSION['user_role'] ?? null
        ];
    }
    return null;
}

/**
 * Generate CSRF token
 * 
 * @return string - CSRF token
 */
function generateCSRFToken() {
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Verify CSRF token
 * 
 * @param string $token - Token to verify
 * @return bool - True if valid, false otherwise
 */
function verifyCSRFToken($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && 
           hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

/**
 * Hash password using bcrypt
 * 
 * @param string $password - Plain text password
 * @return string - Hashed password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
}

/**
 * Verify password against hash
 * 
 * @param string $password - Plain text password
 * @param string $hash - Password hash
 * @return bool - True if password matches, false otherwise
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Redirect to URL
 * 
 * @param string $url - URL to redirect to
 * @return void
 */
function redirect($url) {
    header("Location: " . $url);
    exit();
}

/**
 * JSON response helper
 * 
 * @param string $status - Response status (success/error)
 * @param string $message - Response message
 * @param mixed $data - Response data
 * @return void
 */
function jsonResponse($status, $message, $data = null) {
    header('Content-Type: application/json');
    $response = [
        'status' => $status,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit();
}

/**
 * Check user role
 * 
 * @param string $role - Role to check
 * @return bool - True if user has role, false otherwise
 */
function userHasRole($role) {
    return isLoggedIn() && $_SESSION['user_role'] === $role;
}

/**
 * Require login (redirect if not logged in)
 * 
 * @return void
 */
function requireLogin() {
    if (!isLoggedIn()) {
        $_SESSION['redirect_to'] = $_SERVER['REQUEST_URI'];
        redirect(APP_URL . '/auth/login.php');
    }
}

/**
 * Require specific role
 * 
 * @param string|array $roles - Role(s) required
 * @return void
 */
function requireRole($roles) {
    requireLogin();
    
    $roles = is_array($roles) ? $roles : [$roles];
    
    if (!in_array($_SESSION['user_role'], $roles)) {
        http_response_code(403);
        die("Access Denied: You do not have permission to access this page.");
    }
}

/**
 * Format date
 * 
 * @param string $date - Date to format
 * @param string $format - Date format
 * @return string - Formatted date
 */
function formatDate($date, $format = 'M d, Y') {
    return date($format, strtotime($date));
}

/**
 * Truncate text
 * 
 * @param string $text - Text to truncate
 * @param int $length - Maximum length
 * @param string $suffix - Suffix to append
 * @return string - Truncated text
 */
function truncateText($text, $length = 100, $suffix = '...') {
    if (strlen($text) <= $length) {
        return $text;
    }
    return substr($text, 0, $length) . $suffix;
}

/**
 * Get file extension
 * 
 * @param string $filename - Filename
 * @return string - File extension
 */
function getFileExtension($filename) {
    return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
}

/**
 * Check if file is allowed
 * 
 * @param string $filename - Filename to check
 * @return bool - True if allowed, false otherwise
 */
function isAllowedFile($filename) {
    $extension = getFileExtension($filename);
    return in_array($extension, ALLOWED_EXTENSIONS);
}

?>
