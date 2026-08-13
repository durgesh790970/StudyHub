<?php
/**
 * =====================================================
 * User Logout
 * File: logout.php
 * Purpose: Destroy session and log out user
 * =====================================================
 */

require_once dirname(__DIR__) . '/config/config.php';

// Log logout activity
if (isLoggedIn()) {
    error_log("User logged out: " . $_SESSION['user_email'] . " (ID: " . $_SESSION['user_id'] . ")");
}

// Destroy session
session_destroy();

// Redirect to login page
redirect(APP_URL . '/auth/login.php');

?>
