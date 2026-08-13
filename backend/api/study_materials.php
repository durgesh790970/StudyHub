<?php
/**
 * =====================================================
 * Study Materials CRUD Operations
 * File: study_materials.php
 * Purpose: Handle study materials management
 * Security: Uses prepared statements, file upload validation
 * =====================================================
 */

require_once dirname(__DIR__) . '/config/config.php';

// Require login
requireLogin();

// Initialize response
$response = [
    'status' => ERROR,
    'message' => 'Operation failed',
    'data' => null
];

// Determine action
$action = sanitizeInput($_GET['action'] ?? $_POST['action'] ?? '');

try {
    
    // ===== GET MATERIALS FOR COURSE =====
    if ($action === 'list') {
        $course_id = intval($_GET['course_id'] ?? 0);
        
        if ($course_id <= 0) {
            $response['message'] = 'Invalid course ID';
        } else {
            // Check if course exists
            $course_check = $db->prepare("SELECT id FROM courses WHERE id = ?");
            $course_check->execute([$course_id]);
            
            if ($course_check->rowCount() === 0) {
                $response['message'] = 'Course not found';
            } else {
                $stmt = $db->prepare("
                    SELECT id, title, description, file_path, file_type, `order`, created_at
                    FROM study_materials
                    WHERE course_id = ?
                    ORDER BY `order` ASC
                ");
                
                $stmt->execute([$course_id]);
                $materials = $stmt->fetchAll();
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Materials retrieved successfully',
                    'data' => $materials
                ];
            }
        }
    }
    
    // ===== ADD MATERIAL TO COURSE =====
    else if ($action === 'add') {
        requireRole(['admin', 'instructor']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $course_id = intval($_POST['course_id'] ?? 0);
            $title = sanitizeInput($_POST['title'] ?? '');
            $description = sanitizeInput($_POST['description'] ?? '');
            $file_type = sanitizeInput($_POST['file_type'] ?? 'document');
            $order = intval($_POST['order'] ?? 0);
            
            // Validation
            $errors = [];
            
            if (empty($title)) {
                $errors[] = 'Title is required';
            }
            
            if (!in_array($file_type, ['pdf', 'video', 'document', 'image'])) {
                $errors[] = 'Invalid file type';
            }
            
            // Check course exists and user is instructor of that course
            $course_check = $db->prepare("SELECT instructor_id FROM courses WHERE id = ?");
            $course_check->execute([$course_id]);
            
            if ($course_check->rowCount() === 0) {
                $errors[] = 'Course not found';
            } else {
                $course = $course_check->fetch();
                if ($_SESSION['user_role'] !== 'admin' && $course['instructor_id'] != $_SESSION['user_id']) {
                    $errors[] = 'You do not have permission to add materials to this course';
                }
            }
            
            // Handle file upload
            $file_path = '';
            if (isset($_FILES['file']) && $_FILES['file']['error'] !== UPLOAD_ERR_NO_FILE) {
                if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                    $errors[] = 'File upload error';
                } else {
                    $filename = basename($_FILES['file']['name']);
                    
                    if (!isAllowedFile($filename)) {
                        $errors[] = 'File type not allowed';
                    } else if ($_FILES['file']['size'] > MAX_FILE_SIZE) {
                        $errors[] = 'File size exceeds maximum limit';
                    } else {
                        // Generate unique filename
                        $unique_filename = uniqid() . '_' . $filename;
                        $file_path = 'materials/course_' . $course_id . '/' . $unique_filename;
                        $full_path = UPLOAD_DIR . $file_path;
                        
                        // Create directory if not exists
                        @mkdir(dirname($full_path), 0755, true);
                        
                        if (!move_uploaded_file($_FILES['file']['tmp_name'], $full_path)) {
                            $errors[] = 'Failed to upload file';
                            $file_path = '';
                        }
                    }
                }
            } else if (empty($_POST['file_path'] ?? '')) {
                $file_path = sanitizeInput($_POST['file_path'] ?? '');
            }
            
            if (!empty($errors)) {
                $response['message'] = implode(', ', $errors);
            } else {
                // Insert material
                $stmt = $db->prepare("
                    INSERT INTO study_materials (course_id, title, description, file_path, file_type, `order`, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                ");
                
                $stmt->execute([
                    $course_id,
                    $title,
                    $description,
                    $file_path,
                    $file_type,
                    $order
                ]);
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Material added successfully',
                    'data' => ['material_id' => $db->lastInsertId()]
                ];
            }
        }
    }
    
    // ===== DELETE MATERIAL =====
    else if ($action === 'delete') {
        requireRole(['admin', 'instructor']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $material_id = intval($_POST['id'] ?? 0);
            
            // Get material and check permissions
            $material_check = $db->prepare("
                SELECT sm.id, sm.file_path, c.instructor_id
                FROM study_materials sm
                JOIN courses c ON sm.course_id = c.id
                WHERE sm.id = ?
            ");
            $material_check->execute([$material_id]);
            
            if ($material_check->rowCount() === 0) {
                $response['message'] = 'Material not found';
            } else {
                $material = $material_check->fetch();
                
                if ($_SESSION['user_role'] !== 'admin' && $material['instructor_id'] != $_SESSION['user_id']) {
                    $response['message'] = 'You do not have permission to delete this material';
                } else {
                    // Delete file if exists
                    if (!empty($material['file_path'])) {
                        $full_path = UPLOAD_DIR . $material['file_path'];
                        if (file_exists($full_path)) {
                            @unlink($full_path);
                        }
                    }
                    
                    // Delete material from database
                    $stmt = $db->prepare("DELETE FROM study_materials WHERE id = ?");
                    $stmt->execute([$material_id]);
                    
                    $response = [
                        'status' => SUCCESS,
                        'message' => 'Material deleted successfully',
                        'data' => ['material_id' => $material_id]
                    ];
                }
            }
        }
    }
    
    // Invalid action
    else {
        $response['message'] = 'Invalid action';
    }
    
} catch (PDOException $e) {
    error_log("Study material operation error: " . $e->getMessage());
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
