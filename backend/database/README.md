# Database package

This folder is the centralized database layer for the backend.

## Included files
- `config.py`: environment-based database config
- `db.py`: SQLite initialization, schema, CRUD helpers
- `seed.py`: demo data seeding
- `mysql_setup.py`: MySQL setup utilities
- `studyhub.sql`: database schema dump

## Usage

```python
from database.db import initialize_database, verify_database

initialize_database()
print(verify_database())
```

Keep all database-related logic in this package so imports are consistent and easier to maintain.
