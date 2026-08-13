<?php
/**
 * =====================================================
 * Contact Messages API
 * File: contact.php
 * Purpose: Handle contact form submissions and admin management
 * Security: Uses prepared statements, input validation, CSRF protection
 * =====================================================
 */

require_once dirname(__DIR__) . '/config/config.php';

// Initialize response
$response = [
    'status' => ERROR,
    'message' => 'Operation failed',
    'data' => null
];

// Determine action
$action = sanitizeInput($_GET['action'] ?? $_POST['action'] ?? '');

try {
    
    // ===== SUBMIT CONTACT FORM (Public) =====
    if ($action === 'submit') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $name = sanitizeInput($_POST['name'] ?? '');
            $email = sanitizeInput($_POST['email'] ?? '');
            $subject = sanitizeInput($_POST['subject'] ?? '');
            $message = sanitizeInput($_POST['message'] ?? '');
            
            // Validation
            $errors = [];
            
            if (empty($name)) {
                $errors[] = 'Name is required';
            }
            
            if (empty($email) || !validateEmail($email)) {
                $errors[] = 'Valid email is required';
            }
            
            if (empty($message)) {
                $errors[] = 'Message is required';
            }
            
            if (strlen($message) < 10) {
                $errors[] = 'Message must be at least 10 characters long';
            }
            
            if (!empty($errors)) {
                $response['message'] = implode(', ', $errors);
            } else {
                // Insert contact message
                $stmt = $db->prepare("
                    INSERT INTO contact_messages (name, email, subject, message, status, created_at)
                    VALUES (?, ?, ?, ?, 'unread', NOW())
                ");
                
                $stmt->execute([$name, $email, $subject, $message]);
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Message sent successfully. We will get back to you soon.',
                    'data' => ['message_id' => $db->lastInsertId()]
                ];
            }
        }
    }
    
    // ===== GET ALL MESSAGES (Admin only) =====
    else if ($action === 'list') {
        requireLogin();
        requireRole('admin');
        
        $page = intval($_GET['page'] ?? 1);
        $page = max(1, $page);
        $offset = ($page - 1) * ITEMS_PER_PAGE;
        $status = sanitizeInput($_GET['status'] ?? '');
        
        // Build query based on status filter
        $where_clause = '';
        $params = [];
        
        if (!empty($status) && in_array($status, ['unread', 'read', 'replied'])) {
            $where_clause = 'WHERE status = ?';
            $params[] = $status;
        }
        
        // Get total count
        $count_query = "SELECT COUNT(*) as total FROM contact_messages $where_clause";
        $count_stmt = $db->prepare($count_query);
        $count_stmt->execute($params);
        $total = $count_stmt->fetch()['total'];
        
        // Get messages
        $query = "
            SELECT id, name, email, subject, message, status, created_at
            FROM contact_messages
            $where_clause
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $stmt = $db->prepare($query);
        $params[] = ITEMS_PER_PAGE;
        $params[] = $offset;
        $stmt->execute($params);
        
        $messages = $stmt->fetchAll();
        
        $response = [
            'status' => SUCCESS,
            'message' => 'Messages retrieved successfully',
            'data' => [
                'messages' => $messages,
                'pagination' => [
                    'page' => $page,
                    'total_items' => $total,
                    'total_pages' => ceil($total / ITEMS_PER_PAGE),
                    'items_per_page' => ITEMS_PER_PAGE
                ]
            ]
        ];
    }
    
    // ===== GET SINGLE MESSAGE (Admin only) =====
    else if ($action === 'get') {
        requireLogin();
        requireRole('admin');
        
        $message_id = intval($_GET['id'] ?? 0);
        
        if ($message_id <= 0) {
            $response['message'] = 'Invalid message ID';
        } else {
            $stmt = $db->prepare("
                SELECT id, name, email, subject, message, status, created_at
                FROM contact_messages
                WHERE id = ?
            ");
            
            $stmt->execute([$message_id]);
            
            if ($stmt->rowCount() === 0) {
                $response['message'] = 'Message not found';
            } else {
                $message = $stmt->fetch();
                
                // Mark as read if unread
                if ($message['status'] === 'unread') {
                    $update_stmt = $db->prepare("
                        UPDATE contact_messages
                        SET status = 'read'
                        WHERE id = ?
                    ");
                    $update_stmt->execute([$message_id]);
                }
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Message retrieved successfully',
                    'data' => $message
                ];
            }
        }
    }
    
    // ===== UPDATE MESSAGE STATUS (Admin only) =====
    else if ($action === 'update_status') {
        requireLogin();
        requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $message_id = intval($_POST['id'] ?? 0);
            $new_status = sanitizeInput($_POST['status'] ?? '');
            
            if (!in_array($new_status, ['unread', 'read', 'replied'])) {
                $response['message'] = 'Invalid status';
            } else {
                // Check if message exists
                $check_stmt = $db->prepare("SELECT id FROM contact_messages WHERE id = ?");
                $check_stmt->execute([$message_id]);
                
                if ($check_stmt->rowCount() === 0) {
                    $response['message'] = 'Message not found';
                } else {
                    // Update status
                    $stmt = $db->prepare("
                        UPDATE contact_messages
                        SET status = ?
                        WHERE id = ?
                    ");
                    
                    $stmt->execute([$new_status, $message_id]);
                    
                    $response = [
                        'status' => SUCCESS,
                        'message' => 'Status updated successfully',
                        'data' => ['message_id' => $message_id]
                    ];
                }
            }
        }
    }
    
    // ===== DELETE MESSAGE (Admin only) =====
    else if ($action === 'delete') {
        requireLogin();
        requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $message_id = intval($_POST['id'] ?? 0);
            
            // Check if message exists
            $check_stmt = $db->prepare("SELECT id FROM contact_messages WHERE id = ?");
            $check_stmt->execute([$message_id]);
            
            if ($check_stmt->rowCount() === 0) {
                $response['message'] = 'Message not found';
            } else {
                // Delete message
                $stmt = $db->prepare("DELETE FROM contact_messages WHERE id = ?");
                $stmt->execute([$message_id]);
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Message deleted successfully',
                    'data' => ['message_id' => $message_id]
                ];
            }
        }
    }
    
    // Invalid action
    else {
        $response['message'] = 'Invalid action';
    }
    
} catch (PDOException $e) {
    error_log("Contact operation error: " . $e->getMessage());
    $response = [
        'status' => ERROR,
        'message' => 'Database error occurred'
    ];
}

// Return JSON response
header('Content-Type: application/json');
echo json_encode($response);
exit;

?>
