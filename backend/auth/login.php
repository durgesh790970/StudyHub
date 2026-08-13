<?php
/**
 * =====================================================
 * User Login
 * File: login.php
 * Purpose: Handle user authentication and login
 * Security: Uses password_verify(), prepared statements, session management
 * =====================================================
 */

require_once dirname(__DIR__) . '/config/config.php';

// Redirect if already logged in
if (isLoggedIn()) {
    redirect(APP_URL . '/dashboard.php');
}

// Initialize variables
$errors = [];
$email = '';

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verify CSRF token
    if (!isset($_POST[CSRF_TOKEN_NAME]) || !verifyCSRFToken($_POST[CSRF_TOKEN_NAME])) {
        $errors[] = "Security token validation failed.";
    } else {
        // Get and sanitize input
        $email = sanitizeInput($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        
        // Validation
        if (empty($email) || !validateEmail($email)) {
            $errors[] = "Valid email is required.";
        }
        
        if (empty($password)) {
            $errors[] = "Password is required.";
        }
        
        // If no validation errors, attempt to authenticate
        if (empty($errors)) {
            try {
                // Prepare statement to fetch user by email
                $stmt = $db->prepare("
                    SELECT id, name, email, password, role
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                ");
                
                $stmt->execute([$email]);
                
                if ($stmt->rowCount() > 0) {
                    $user = $stmt->fetch();
                    
                    // Verify password using password_verify()
                    if (verifyPassword($password, $user['password'])) {
                        // Password is correct, create session
                        $_SESSION['user_id'] = $user['id'];
                        $_SESSION['user_name'] = $user['name'];
                        $_SESSION['user_email'] = $user['email'];
                        $_SESSION['user_role'] = $user['role'];
                        $_SESSION['logged_in'] = true;
                        
                        // Log login activity
                        error_log("User logged in: {$email} (ID: {$user['id']})");
                        
                        // Redirect to dashboard or original page
                        $redirect_to = $_SESSION['redirect_to'] ?? APP_URL . '/dashboard.php';
                        unset($_SESSION['redirect_to']);
                        redirect($redirect_to);
                        
                    } else {
                        // Password is incorrect
                        $errors[] = "Invalid email or password.";
                    }
                } else {
                    // Email not found
                    $errors[] = "Invalid email or password.";
                }
                
            } catch (PDOException $e) {
                error_log("Login error: " . $e->getMessage());
                $errors[] = "Login failed. Please try again.";
            }
        }
    }
}

// Get CSRF token for form
$csrf_token = generateCSRFToken();

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo APP_NAME; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 400px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 0.5rem;
            text-align: center;
            font-size: 1.8rem;
        }
        
        .subtitle {
            text-align: center;
            color: #999;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
            font-size: 0.9rem;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
        }
        
        input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
            margin-top: 0.5rem;
        }
        
        .btn:hover {
            background: #5568d3;
        }
        
        .btn:active {
            transform: translateY(1px);
        }
        
        .link {
            text-align: center;
            margin-top: 1rem;
            color: #666;
            font-size: 0.9rem;
        }
        
        .link a {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .link a:hover {
            text-decoration: underline;
        }
        
        .demo-credentials {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            border-radius: 4px;
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.85rem;
            color: #004085;
        }
        
        .demo-credentials strong {
            display: block;
            margin-bottom: 0.5rem;
        }
        
        .demo-credentials code {
            background: white;
            padding: 2px 4px;
            border-radius: 2px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Login</h1>
        <p class="subtitle">Welcome back to <?php echo APP_NAME; ?></p>
        
        <?php if (!empty($errors)): ?>
            <?php foreach ($errors as $error): ?>
                <div class="error-message"><?php echo $error; ?></div>
            <?php endforeach; ?>
        <?php endif; ?>
        
        <form method="POST">
            <input type="hidden" name="<?php echo CSRF_TOKEN_NAME; ?>" value="<?php echo htmlspecialchars($csrf_token); ?>">
            
            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" value="<?php echo htmlspecialchars($email); ?>" required autofocus>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">Login</button>
        </form>
        
        <div class="demo-credentials">
            <strong>📋 Test Credentials:</strong>
            <div><code>admin@studyhub.com</code> / <code>password123</code></div>
            <div><code>jane@example.com</code> / <code>password123</code></div>
        </div>
        
        <div class="link">
            Don't have an account? <a href="register.php">Register here</a>
        </div>
    </div>
</body>
</html>
