"""
Database Configuration Module
File: config.py
Purpose: Centralized database configuration for Django
Supports both SQLite (development) and custom databases
"""

import os
from pathlib import Path

def get_database_config():
    """
    Get database configuration based on environment variables.
    
    Returns:
        dict: Database configuration for Django DATABASES setting
    """
    
    # Get database type from environment (default: sqlite)
    db_type = os.getenv('DATABASE_TYPE', 'sqlite').lower()
    
    # Get base directory
    base_dir = Path(__file__).resolve().parent.parent
    
    # =========================================
    # SQLite Configuration (Development)
    # =========================================
    if db_type == 'sqlite':
        return {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': base_dir / 'db.sqlite3',
            }
        }
    
    # =========================================
    # MySQL Configuration
    # =========================================
    elif db_type == 'mysql':
        return {
            'default': {
                'ENGINE': 'django.db.backends.mysql',
                'NAME': os.getenv('DB_NAME', 'studyhub'),
                'USER': os.getenv('DB_USER', 'root'),
                'PASSWORD': os.getenv('DB_PASSWORD', ''),
                'HOST': os.getenv('DB_HOST', 'localhost'),
                'PORT': os.getenv('DB_PORT', '3306'),
                'OPTIONS': {
                    'charset': 'utf8mb4',
                },
            }
        }
    
    # =========================================
    # PostgreSQL Configuration
    # =========================================
    elif db_type == 'postgresql':
        return {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'NAME': os.getenv('DB_NAME', 'studyhub'),
                'USER': os.getenv('DB_USER', 'postgres'),
                'PASSWORD': os.getenv('DB_PASSWORD', ''),
                'HOST': os.getenv('DB_HOST', 'localhost'),
                'PORT': os.getenv('DB_PORT', '5432'),
            }
        }
    
    # =========================================
    # Default: SQLite (fallback)
    # =========================================
    else:
        return {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': base_dir / 'db.sqlite3',
            }
        }
