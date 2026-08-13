<?php
/**
 * =====================================================
 * Courses CRUD Operations
 * File: courses.php
 * Purpose: Handle all course management (Create, Read, Update, Delete)
 * Security: Uses prepared statements, role-based access, input validation
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
    
    // ===== GET ALL COURSES =====
    if ($action === 'list') {
        $page = intval($_GET['page'] ?? 1);
        $page = max(1, $page);
        $offset = ($page - 1) * ITEMS_PER_PAGE;
        
        // Get total count
        $count_stmt = $db->prepare("SELECT COUNT(*) as total FROM courses");
        $count_stmt->execute();
        $total = $count_stmt->fetch()['total'];
        
        // Get courses with pagination
        $stmt = $db->prepare("
            SELECT 
                c.id, c.title, c.description, c.instructor, 
                c.category, c.level, c.created_at,
                COUNT(e.id) as enrolled_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $stmt->bindValue(1, ITEMS_PER_PAGE, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $courses = $stmt->fetchAll();
        
        $response = [
            'status' => SUCCESS,
            'message' => 'Courses retrieved successfully',
            'data' => [
                'courses' => $courses,
                'pagination' => [
                    'page' => $page,
                    'total_items' => $total,
                    'total_pages' => ceil($total / ITEMS_PER_PAGE),
                    'items_per_page' => ITEMS_PER_PAGE
                ]
            ]
        ];
    }
    
    // ===== GET SINGLE COURSE =====
    else if ($action === 'get') {
        $course_id = intval($_GET['id'] ?? 0);
        
        if ($course_id <= 0) {
            $response['message'] = 'Invalid course ID';
        } else {
            $stmt = $db->prepare("
                SELECT c.*, COUNT(e.id) as enrolled_count
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id
                WHERE c.id = ?
                GROUP BY c.id
            ");
            
            $stmt->execute([$course_id]);
            
            if ($stmt->rowCount() === 0) {
                $response['message'] = 'Course not found';
            } else {
                $course = $stmt->fetch();
                
                // Get course materials
                $materials_stmt = $db->prepare("
                    SELECT id, title, description, file_type, order
                    FROM study_materials
                    WHERE course_id = ?
                    ORDER BY `order` ASC
                ");
                $materials_stmt->execute([$course_id]);
                $course['materials'] = $materials_stmt->fetchAll();
                
                // Get course quizzes
                $quizzes_stmt = $db->prepare("
                    SELECT id, title, description, total_marks, passing_marks, time_limit
                    FROM quizzes
                    WHERE course_id = ?
                ");
                $quizzes_stmt->execute([$course_id]);
                $course['quizzes'] = $quizzes_stmt->fetchAll();
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Course retrieved successfully',
                    'data' => $course
                ];
            }
        }
    }
    
    // ===== CREATE COURSE (Admin/Instructor only) =====
    else if ($action === 'create') {
        requireRole(['admin', 'instructor']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $title = sanitizeInput($_POST['title'] ?? '');
            $description = sanitizeInput($_POST['description'] ?? '');
            $category = sanitizeInput($_POST['category'] ?? '');
            $level = sanitizeInput($_POST['level'] ?? 'beginner');
            
            // Validation
            $errors = [];
            
            if (empty($title)) {
                $errors[] = 'Title is required';
            }
            
            if (empty($description)) {
                $errors[] = 'Description is required';
            }
            
            if (!in_array($level, ['beginner', 'intermediate', 'advanced'])) {
                $errors[] = 'Invalid level selected';
            }
            
            if (!empty($errors)) {
                $response['message'] = implode(', ', $errors);
            } else {
                // Insert course
                $stmt = $db->prepare("
                    INSERT INTO courses (title, description, instructor, instructor_id, category, level, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                ");
                
                $stmt->execute([
                    $title,
                    $description,
                    $_SESSION['user_name'],
                    $_SESSION['user_id'],
                    $category,
                    $level
                ]);
                
                $course_id = $db->lastInsertId();
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Course created successfully',
                    'data' => ['course_id' => $course_id]
                ];
            }
        }
    }
    
    // ===== UPDATE COURSE (Admin/Course Instructor only) =====
    else if ($action === 'update') {
        requireRole(['admin', 'instructor']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $course_id = intval($_POST['id'] ?? 0);
            $title = sanitizeInput($_POST['title'] ?? '');
            $description = sanitizeInput($_POST['description'] ?? '');
            $category = sanitizeInput($_POST['category'] ?? '');
            $level = sanitizeInput($_POST['level'] ?? 'beginner');
            
            // Check if course exists and user has permission
            $check_stmt = $db->prepare("SELECT instructor_id FROM courses WHERE id = ?");
            $check_stmt->execute([$course_id]);
            
            if ($check_stmt->rowCount() === 0) {
                $response['message'] = 'Course not found';
            } else {
                $course = $check_stmt->fetch();
                
                // Check permission (admin or course owner)
                if ($_SESSION['user_role'] !== 'admin' && $course['instructor_id'] != $_SESSION['user_id']) {
                    $response['message'] = 'You do not have permission to update this course';
                } else {
                    // Validation
                    $errors = [];
                    
                    if (empty($title)) {
                        $errors[] = 'Title is required';
                    }
                    
                    if (empty($description)) {
                        $errors[] = 'Description is required';
                    }
                    
                    if (!in_array($level, ['beginner', 'intermediate', 'advanced'])) {
                        $errors[] = 'Invalid level selected';
                    }
                    
                    if (!empty($errors)) {
                        $response['message'] = implode(', ', $errors);
                    } else {
                        // Update course
                        $stmt = $db->prepare("
                            UPDATE courses
                            SET title = ?, description = ?, category = ?, level = ?, updated_at = NOW()
                            WHERE id = ?
                        ");
                        
                        $stmt->execute([$title, $description, $category, $level, $course_id]);
                        
                        $response = [
                            'status' => SUCCESS,
                            'message' => 'Course updated successfully',
                            'data' => ['course_id' => $course_id]
                        ];
                    }
                }
            }
        }
    }
    
    // ===== DELETE COURSE (Admin only) =====
    else if ($action === 'delete') {
        requireRole('admin');
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $course_id = intval($_POST['id'] ?? 0);
            
            // Check if course exists
            $check_stmt = $db->prepare("SELECT id FROM courses WHERE id = ?");
            $check_stmt->execute([$course_id]);
            
            if ($check_stmt->rowCount() === 0) {
                $response['message'] = 'Course not found';
            } else {
                // Delete course (cascades to enrollments, materials, quizzes)
                $stmt = $db->prepare("DELETE FROM courses WHERE id = ?");
                $stmt->execute([$course_id]);
                
                $response = [
                    'status' => SUCCESS,
                    'message' => 'Course deleted successfully',
                    'data' => ['course_id' => $course_id]
                ];
            }
        }
    }
    
    // ===== ENROLL STUDENT IN COURSE =====
    else if ($action === 'enroll') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $response['message'] = 'POST request required';
        } else if (!verifyCSRFToken($_POST[CSRF_TOKEN_NAME] ?? '')) {
            $response['message'] = 'Security token validation failed';
        } else {
            $course_id = intval($_POST['course_id'] ?? 0);
            
            // Check if course exists
            $check_stmt = $db->prepare("SELECT id FROM courses WHERE id = ?");
            $check_stmt->execute([$course_id]);
            
            if ($check_stmt->rowCount() === 0) {
                $response['message'] = 'Course not found';
            } else {
                // Check if already enrolled
                $enroll_check = $db->prepare("
                    SELECT id FROM enrollments
                    WHERE user_id = ? AND course_id = ?
                ");
                $enroll_check->execute([$_SESSION['user_id'], $course_id]);
                
                if ($enroll_check->rowCount() > 0) {
                    $response['message'] = 'You are already enrolled in this course';
                } else {
                    // Enroll student
                    $stmt = $db->prepare("
                        INSERT INTO enrollments (user_id, course_id, enrolled_at)
                        VALUES (?, ?, NOW())
                    ");
                    
                    $stmt->execute([$_SESSION['user_id'], $course_id]);
                    
                    $response = [
                        'status' => SUCCESS,
                        'message' => 'Successfully enrolled in course',
                        'data' => ['enrollment_id' => $db->lastInsertId()]
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
    error_log("Course operation error: " . $e->getMessage());
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
