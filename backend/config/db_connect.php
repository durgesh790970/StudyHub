<?php
/**
 * =====================================================
 * Database Connection Configuration
 * File: db_connect.php
 * Purpose: Establish PDO connection to MySQL database
 * Security: Uses prepared statements and PDO
 * =====================================================
 */

// Database Configuration Constants
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'studyhub');
define('DB_CHARSET', 'utf8mb4');

/**
 * Create PDO Database Connection
 * 
 * @return PDO|false - Database connection object or false on failure
 */
function connectDB() {
    try {
        // Create DSN (Data Source Name) string
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        
        // PDO Options for security and performance
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Return arrays (associative)
            PDO::ATTR_EMULATE_PREPARES   => false,                   // Use real prepared statements
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"     // Set character set
        ];
        
        // Create PDO connection
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        return $pdo;
        
    } catch (PDOException $e) {
        // Log error securely (don't expose in production)
        error_log("Database Connection Error: " . $e->getMessage());
        
        // Return user-friendly error message
        if (getenv('APP_ENV') === 'production') {
            die("Database connection failed. Please try again later.");
        } else {
            die("Database Connection Error: " . $e->getMessage());
        }
    }
}

/**
 * Global Database Connection Instance
 * Initialize database connection
 */
$db = connectDB();


require_once 'db_connect.php';

if ($db) {
    echo "Database Connected Successfully";
} else {
    echo "Connection Failed";
}
?>
