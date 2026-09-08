"""Database seed helper for development data.

This replaces the older scattered seed scripts and keeps all seeding logic in a
single, easy-to-find backend/database module.
"""

import hashlib
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from database.db import initialize_database, insert_record


def hash_password(password):
    """Create a simple SHA256 hash for demo data."""
    return hashlib.sha256(password.encode()).hexdigest()


def seed_demo_users():
    """Seed a few demo users into the SQLite database."""
    initialize_database()

    demo_users = [
        {
            "full_name": "Admin User",
            "email": "admin@studypro.com",
            "password_hash": hash_password("Admin123!@"),
            "phone": "+91-9999999999",
            "role": "admin",
            "is_active": 1,
        },
        {
            "full_name": "Raj Kumar",
            "email": "raj.kumar@gmail.com",
            "password_hash": hash_password("Raj@12345"),
            "phone": "+91-9876543210",
            "role": "user",
            "is_active": 1,
        },
    ]

    for user in demo_users:
        insert_record("users", user)

    return len(demo_users)


def main():
    """Entry point for seeding demo data."""
    count = seed_demo_users()
    print(f"Seeded {count} demo users.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
