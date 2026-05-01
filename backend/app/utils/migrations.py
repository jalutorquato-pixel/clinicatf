from sqlalchemy import inspect, text

from app.database import engine


CLIENT_COLUMNS = {
    "zip_code": "VARCHAR(12)",
    "street": "VARCHAR(180)",
    "address_number": "VARCHAR(30)",
    "address_complement": "VARCHAR(120)",
    "neighborhood": "VARCHAR(120)",
    "city": "VARCHAR(120)",
    "state": "VARCHAR(2)",
    "latitude": "FLOAT",
    "longitude": "FLOAT",
}


def ensure_sqlite_columns():
    inspector = inspect(engine)
    if "clients" not in inspector.get_table_names():
        return
    current = {column["name"] for column in inspector.get_columns("clients")}
    with engine.begin() as conn:
        for name, sql_type in CLIENT_COLUMNS.items():
            if name not in current:
                conn.execute(text(f"ALTER TABLE clients ADD COLUMN {name} {sql_type}"))
