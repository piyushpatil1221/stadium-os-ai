from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import auth, crowds, incidents, navigator, transport, matches, volunteers, sustainability

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered stadium operations platform for FIFA World Cup 2026",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(crowds.router, prefix="/api/v1")
app.include_router(incidents.router, prefix="/api/v1")
app.include_router(navigator.router, prefix="/api/v1")
app.include_router(transport.router, prefix="/api/v1")
app.include_router(matches.router, prefix="/api/v1")
app.include_router(volunteers.router, prefix="/api/v1")
app.include_router(sustainability.router, prefix="/api/v1")
app.include_router(sustainability.router_alerts, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {"app": settings.APP_NAME, "status": "operational", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "environment": settings.APP_ENV}


@app.on_event("startup")
def on_startup():
    """Seed the database with initial data on first run."""
    from app.services.seed import seed_database
    try:
        seed_database()
    except Exception as e:
        print(f"Seed skipped or failed: {e}")
