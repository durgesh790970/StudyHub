#!/usr/bin/env python
"""
MySQL Database Setup - Interactive Version
Asks user for MySQL root password
"""

import os
import sys
import getpass
import mysql.connector
from mysql.connector import Error

def setup_database_interactive():
    """Setup MySQL database with user-provided credentials"""
    
    print("\n" + "=" * 60)
    print("  🚀 MySQL Database Setup for StudyProHub")
    print("=" * 60)
    
    # Get credentials from user
    print("\n📌 MySQL Root Credentials:")
    host = input("  MySQL Host [localhost]: ").strip() or "localhost"
    port = input("  MySQL Port [3306]: ").strip() or "3306"
    user = input("  MySQL User [root]: ").strip() or "root"
    password = getpass.getpass("  MySQL Root Password: ")
    
    try:
        port = int(port)
    except ValueError:
        port = 3306
    
    print("\n🔄 Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            port=port
        )
        print("✅ Connected successfully!")
    except Error as err:
        print(f"❌ Connection failed: {err}")
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
        
        # Switch to studyhub database
        cursor.execute("USE studyhub")
        
        # Create tables (Django will do this via migrations, but just in case)
        print("\n⏳ Database ready for Django migrations...")
        
        print("\n" + "=" * 60)
        print("✅ MySQL Setup Complete!")
        print("=" * 60)
        print("\n📝 Update your .env file:")
        print(f"  DATABASE_TYPE=mysql")
        print(f"  DB_NAME=studyhub")
        print(f"  DB_USER={user}")
        print(f"  DB_PASSWORD={password if password else '(empty)'}")
        print(f"  DB_HOST={host}")
        print(f"  DB_PORT={port}")
        print("\n💡 Next step: Run 'python manage.py migrate'")
        print("=" * 60 + "\n")
        
        conn.commit()
        
    except Error as err:
        print(f"❌ Database setup error: {err}")
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return True

if __name__ == "__main__":
    success = setup_database_interactive()
    sys.exit(0 if success else 1)
