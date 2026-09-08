"""Centralized database access layer for the StudyHub backend.

This module is the single source of truth for SQLite database setup and common
CRUD helpers. It is intentionally kept in the database package so database logic
is easier to maintain and understand.
"""

import logging
import os
import sqlite3
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BACKEND_DIR / "db.sqlite3"


def get_db_connection():
    """Return a database connection for the project SQLite database."""
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as exc:
        logger.error("Database connection error: %s", exc)
        raise


def close_db_connection(conn):
    """Close a SQLite connection safely."""
    if conn:
        conn.close()
        logger.info("Database connection closed")


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    date_of_birth DATE,
    gender VARCHAR(20),
    profile_image VARCHAR(255),
    bio TEXT,
    phone_verified BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
    description TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def initialize_database():
    """Create all required tables and indexes if they do not already exist."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.executescript(SCHEMA)
        conn.commit()
        logger.info("Database initialized at %s", DB_PATH)
        logger.info("All tables and indexes created")
        conn.close()
        return True
    except sqlite3.Error as exc:
        logger.error("Database initialization error: %s", exc)
        return False


def drop_all_tables():
    """Drop all project tables. Intended for development resets only."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        for table in [
            "audit_logs",
            "sessions",
            "activity_logs",
            "transactions",
            "user_profiles",
            "users",
            "settings",
        ]:
            cursor.execute(f"DROP TABLE IF EXISTS {table}")
        conn.commit()
        logger.info("All tables dropped")
        conn.close()
        return True
    except sqlite3.Error as exc:
        logger.error("Error dropping tables: %s", exc)
        return False


def reset_database():
    """Drop and recreate all tables."""
    if drop_all_tables():
        return initialize_database()
    return False


def get_database_info():
    """Return metadata about the current database state."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        table_info = {}
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            table_info[table] = count
        file_size = os.path.getsize(DB_PATH) / 1024
        info = {
            "database": str(DB_PATH),
            "type": "SQLite3",
            "file_size_kb": round(file_size, 2),
            "tables": tables,
            "table_records": table_info,
            "total_records": sum(table_info.values()),
        }
        conn.close()
        return info
    except Exception as exc:  # pragma: no cover - defensive fallback
        logger.error("Error getting database info: %s", exc)
        return {}


def verify_database():
    """Check that the database exists and passes integrity checks."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            logger.error("Database not initialized")
            conn.close()
            return False

        cursor.execute("PRAGMA integrity_check")
        result = cursor.fetchone()[0]
        conn.close()

        if result == "ok":
            logger.info("Database integrity verified")
            return True

        logger.error("Database integrity check failed: %s", result)
        return False
    except Exception as exc:
        logger.error("Database verification error: %s", exc)
        return False


def execute_query(query, params=None, fetch_one=False):
    """Execute a SQL query and return either rows or the affected count."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        conn.commit()
        result = cursor.fetchone() if fetch_one else cursor.fetchall()
        conn.close()
        return result if result is not None else 0
    except sqlite3.Error as exc:
        logger.error("Query execution error: %s", exc)
        return None


def get_record_by_id(table, record_id):
    """Return a single row by primary key."""
    query = f"SELECT * FROM {table} WHERE id = ?"
    return execute_query(query, (record_id,), fetch_one=True)


def get_all_records(table, limit=None):
    """Return all rows from a table, optionally limited."""
    query = f"SELECT * FROM {table}"
    if limit:
        query += f" LIMIT {limit}"
    return execute_query(query)


def insert_record(table, data):
    """Insert a row into a table and return the last inserted ID."""
    columns = ", ".join(data.keys())
    placeholders = ", ".join(["?" for _ in data])
    query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, tuple(data.values()))
        conn.commit()
        last_id = cursor.lastrowid
        conn.close()
        return last_id
    except sqlite3.Error as exc:
        logger.error("Insert error: %s", exc)
        return 0


def update_record(table, record_id, data):
    """Update a row by primary key and return whether it succeeded."""
    set_clause = ", ".join([f"{key} = ?" for key in data.keys()])
    query = f"UPDATE {table} SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, (*data.values(), record_id))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success
    except sqlite3.Error as exc:
        logger.error("Update error: %s", exc)
        return False


def delete_record(table, record_id):
    """Delete a row by primary key and return whether it succeeded."""
    query = f"DELETE FROM {table} WHERE id = ?"
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(query, (record_id,))
        conn.commit()
        success = cursor.rowcount > 0
        conn.close()
        return success
    except sqlite3.Error as exc:
        logger.error("Delete error: %s", exc)
        return False


__all__ = [
    "DB_PATH",
    "get_db_connection",
    "close_db_connection",
    "initialize_database",
    "drop_all_tables",
    "reset_database",
    "get_database_info",
    "verify_database",
    "execute_query",
    "get_record_by_id",
    "get_all_records",
    "insert_record",
    "update_record",
    "delete_record",
]
