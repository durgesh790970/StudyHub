<?php
/**
 * =====================================================
 * =====================================================
 */

require_once 'config/config.php';

// Require login
requireLogin();

// Get user data
$user = getCurrentUser();

// Get user statistics
try {
    // For instructors: courses created
    // For students: courses enrolled
    if ($user['role'] === 'instructor') {
        $stats_stmt = $db->prepare("
            SELECT COUNT(*) as total FROM courses WHERE instructor_id = ?
        ");
        $stats_stmt->execute([$user['id']]);
        $courses_count = $stats_stmt->fetch()['total'];
        
        $students_stmt = $db->prepare("
            SELECT COUNT(DISTINCT e.user_id) as total
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE c.instructor_id = ?
        ");
        $students_stmt->execute([$user['id']]);
        $students_count = $students_stmt->fetch()['total'];
        
    } else {
        $stats_stmt = $db->prepare("
            SELECT COUNT(*) as total FROM enrollments WHERE user_id = ?
        ");
        $stats_stmt->execute([$user['id']]);
        $courses_count = $stats_stmt->fetch()['total'];
        $students_count = 0;
    }
    
} catch (PDOException $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    $courses_count = 0;
    $students_count = 0;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo APP_NAME; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
        }
        
        .navbar {
            background: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .navbar h1 {
            color: #667eea;
            font-size: 1.5rem;
        }
        
        .navbar-right {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .navbar-right span {
            color: #666;
            font-size: 0.95rem;
        }
        
        .navbar-right a {
            padding: 0.5rem 1rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.3s;
        }
        
        .navbar-right a:hover {
            background: #5568d3;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        
        .welcome-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        
        .welcome-card h2 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }
        
        .welcome-card p {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.95rem;
        }
        
        .actions {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .actions h3 {
            color: #333;
            margin-bottom: 1.5rem;
            font-size: 1.2rem;
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .btn {
            padding: 1rem;
            background: #667eea;
            color: white;
            text-decoration: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            text-align: center;
            transition: background 0.3s;
            display: inline-block;
        }
        
        .btn:hover {
            background: #5568d3;
        }
        
        .btn-secondary {
            background: #6c757d;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
        }
        
        .btn-danger {
            background: #dc3545;
        }
        
        .btn-danger:hover {
            background: #c82333;
        }
        
        @media (max-width: 768px) {
            .navbar {
                flex-direction: column;
                gap: 1rem;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .action-buttons {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="navbar">
        <h1><?php echo APP_NAME; ?></h1>
        <div class="navbar-right">
            <span>Welcome, <strong><?php echo htmlspecialchars($user['name']); ?></strong> (<?php echo ucfirst($user['role']); ?>)</span>
            <a href="auth/logout.php">Logout</a>
        </div>
    </div>
    
    <div class="container">
        <div class="welcome-card">
            <h2>Welcome back, <?php echo htmlspecialchars($user['name']); ?>!</h2>
            <p>You are logged in as <?php echo ucfirst($user['role']); ?> • Email: <?php echo htmlspecialchars($user['email']); ?></p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number"><?php echo $courses_count; ?></div>
                <div class="stat-label">
                    <?php echo $user['role'] === 'instructor' ? 'Courses Created' : 'Courses Enrolled'; ?>
                </div>
            </div>
            
            <?php if ($user['role'] === 'instructor'): ?>
            <div class="stat-card">
                <div class="stat-number"><?php echo $students_count; ?></div>
                <div class="stat-label">Students Enrolled</div>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="actions">
            <h3>Actions</h3>
            <div class="action-buttons">
                <a href="api/courses.php?action=list" class="btn">View All Courses</a>
                
                <?php if ($user['role'] === 'instructor' || $user['role'] === 'admin'): ?>
                    <a href="#" class="btn" onclick="alert('Create course functionality - POST to /api/courses.php?action=create')">Create Course</a>
                <?php endif; ?>
                
                <a href="#" class="btn btn-secondary" onclick="alert('Study materials management')">Study Materials</a>
                <a href="#" class="btn btn-secondary" onclick="alert('Quizzes management')">Quizzes</a>
            </div>
        </div>
    </div>
    
    <script>
        // Example: Fetch courses using the API
        async function fetchCourses() {
            try {
                const response = await fetch('/api/courses.php?action=list&page=1');
                const data = await response.json();
                
                if (data.status === 'success') {
                    console.log('Courses:', data.data.courses);
                    console.log('Total courses:', data.data.pagination.total_items);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        }
        
        // Load courses on page load
        // fetchCourses();
    </script>
</body>
</html>
