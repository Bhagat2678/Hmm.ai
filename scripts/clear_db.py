"""
Bedrock Database & Upload Cleanup Utility
Clears PostgreSQL (or SQLite) operational tables while preserving Alembic migration history.
Also purges temporary uploaded files.
"""

import os
import glob

try:
    from sqlalchemy import create_engine, text
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False


def clear_all_data():
    database_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5434/iki"
    )
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sqlite_db_path = os.path.join(base_dir, "backend", "iki.db")
    
    print(f"[INFO] Purging operational data from database...")

    cleared = False
    if HAS_SQLALCHEMY:
        try:
            engine = create_engine(database_url, pool_pre_ping=True)
            with engine.begin() as conn:
                for table in ["document_chunks", "documents", "alerts", "audit_log"]:
                    try:
                        conn.execute(text(f"DELETE FROM {table};"))
                        print(f"  ✓ Cleared table '{table}'")
                    except Exception as e:
                        print(f"  ! Table '{table}' notice: {e}")
            print("[INFO] Database operational tables cleared successfully.")
            cleared = True
        except Exception as e:
            print(f"[WARN] PostgreSQL connection failed: {e}")

    if not cleared and os.path.exists(sqlite_db_path):
        import sqlite3
        print(f"[INFO] Clearing SQLite fallback database: {sqlite_db_path}")
        conn = sqlite3.connect(sqlite_db_path)
        cursor = conn.cursor()
        for table in ["document_chunks", "documents", "alerts", "audit_log"]:
            try:
                cursor.execute(f"DELETE FROM {table};")
                print(f"  ✓ Cleared SQLite table '{table}'")
            except Exception as ex:
                print(f"  ! SQLite table notice: {ex}")
        conn.commit()
        conn.close()

    # Clear uploads directories
    upload_dirs = [
        "/tmp/uploads",
        os.path.join(base_dir, "backend", "uploads")
    ]
    
    for u_dir in upload_dirs:
        if os.path.exists(u_dir):
            files = glob.glob(os.path.join(u_dir, "*"))
            removed_count = 0
            for f in files:
                if os.path.isfile(f):
                    try:
                        os.remove(f)
                        removed_count += 1
                    except Exception:
                        pass
            print(f"[INFO] Cleared {removed_count} file(s) from '{u_dir}'.")


if __name__ == "__main__":
    clear_all_data()
