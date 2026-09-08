"""Compatibility wrapper for the centralized database package.

Older imports such as `from config.db import ...` continue to work by re-exporting
functions from the new `database.db` implementation.
"""

from database.db import (  # noqa: F401
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

if __name__ == '__main__':
    print("Initializing database...")
    if initialize_database():
        print("✅ Database ready!")
        info = get_database_info()
        print(f"\nDatabase Info:")
        print(f"  Path: {info['database']}")
        print(f"  Size: {info['file_size_kb']} KB")
        print(f"  Tables: {len(info['tables'])}")
    else:
        print("❌ Database initialization failed")
