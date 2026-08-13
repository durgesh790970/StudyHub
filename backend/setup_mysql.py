#!/usr/bin/env python
"""
MySQL Database Setup Script
Creates the studyhub database and configures it for Django
"""

import os
import sys
import mysql.connector
from mysql.connector import Error

def setup_database():
    """Setup MySQL database for Django"""
    
    # Try different connection approaches
    connection_configs = [
        # No password (fresh install)
        {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'port': 3306
        },
        # With common default passwords
        {
            'host': 'localhost',
            'user': 'root',
            'password': 'root',
            'port': 3306
        },
        {
            'host': 'localhost',
            'user': 'root',
            'password': 'password',
            'port': 3306
        },
        # Using socket (Unix-style, might work on Windows too)
        {
            'host': '127.0.0.1',
            'user': 'root',
            'password': '',
            'port': 3306
        },
    ]
    
    conn = None
    
    for config in connection_configs:
        try:
            print(f"🔄 Trying connection: user={config['user']}, host={config['host']}")
            conn = mysql.connector.connect(**config)
            print("✅ Connected successfully!")
            break
        except Error as err:
            print(f"   ❌ Failed: {err}")
            continue
    
    if not conn:
        print("\n❌ Could not connect to MySQL!")
        print("\n💡 Please set MySQL root password and try again.")
        print("   Or run: mysql -u root -p")
        print("   Then: ALTER USER 'root'@'localhost' IDENTIFIED BY '';")
        return False
    
    try:
        cursor = conn.cursor()
        
        # Create database
        print("\n📝 Creating database 'studyhub'...")
        cursor.execute("""
            CREATE DATABASE IF NOT EXISTS studyhub 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
        """)
        print("✅ Database created!")
        
        # Create user for Django (optional - for security)
        print("\n👤 Creating Django user...")
        cursor.execute("""
            CREATE USER IF NOT EXISTS 'django'@'localhost' IDENTIFIED BY 'django_pass_123'
        """)
        cursor.execute("""
            GRANT ALL PRIVILEGES ON studyhub.* TO 'django'@'localhost'
        """)
        cursor.execute("FLUSH PRIVILEGES")
        print("✅ Django user created!")
        
        # Show database info
        print("\n📊 Database Information:")
        print("=" * 50)
        cursor.execute("SHOW DATABASES LIKE 'studyhub'")
        for db in cursor.fetchall():
            print(f"  Database: {db[0]}")
        
        print("\n" + "=" * 50)
        print("✅ MySQL Setup Complete!")
        print("\nFor Django .env, use either:")
        print("  1. Root user: DB_USER=root, DB_PASSWORD=(empty)")
        print("  2. Django user: DB_USER=django, DB_PASSWORD=django_pass_123")
        print("=" * 50)
        
        conn.commit()
        
    except Error as err:
        print(f"❌ Error: {err}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return True

if __name__ == "__main__":
    success = setup_database()
    sys.exit(0 if success else 1)
