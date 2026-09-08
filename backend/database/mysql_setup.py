"""MySQL setup helper for StudyHub.

This file keeps the database setup task in the database package instead of
scattering setup logic across unrelated folders.
"""

import sys

from .config import get_database_config


def main():
    """Display the required MySQL configuration for Django."""
    config = get_database_config()
    print("Current database config:")
    print(config)
    print("\nTo use MySQL, set DATABASE_TYPE=mysql and configure DB_NAME, DB_USER, DB_PASSWORD, DB_HOST and DB_PORT in the environment.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
