"""Unified database package for the StudyHub backend.

This package centralizes the database configuration and helper functions used by
Django and other backend scripts.
"""

from .config import get_database_config
from .db import (
    DB_PATH,
    close_db_connection,
    delete_record,
    drop_all_tables,
    execute_query,
    get_all_records,
    get_database_info,
    get_db_connection,
    get_record_by_id,
    initialize_database,
    insert_record,
    reset_database,
    update_record,
    verify_database,
)

__all__ = [
    "DB_PATH",
    "get_database_config",
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
