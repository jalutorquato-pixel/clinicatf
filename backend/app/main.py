from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import *  # noqa: F401,F403
from app.routers import actions, auth, crud, operations
from app.utils.migrations import ensure_sqlite_columns

Base.metadata.create_all(bind=engine)
ensure_sqlite_columns()

app = FastAPI(title="Clínica TF - Embaixadoras", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://host.docker.internal:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(crud.router)
app.include_router(actions.router)
app.include_router(operations.router)


@app.get("/")
def root():
    return {"name": "Clínica TF - Sistema de Embaixadoras", "status": "ok"}
