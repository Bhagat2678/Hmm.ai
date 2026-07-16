from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine
from app.services.scheduler import start_scheduler, stop_scheduler

from app.api import documents, query, graph, alerts, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        # Note: In production or full docker setup, alembic migrations handle DDL,
        # but creating tables here ensures instantaneous development/testing readiness.
        Base.metadata.create_all(bind=engine)
    except Exception as db_err:
        logger.warning(f"Database table auto-creation skipped or deferred: {db_err}")

    logger.info("Starting background scheduler...")
    try:
        start_scheduler()
    except Exception as sched_err:
        logger.warning(f"Scheduler startup deferred: {sched_err}")

    yield

    logger.info("Stopping background scheduler...")
    try:
        stop_scheduler()
    except Exception as sched_err:
        logger.warning(f"Error stopping scheduler: {sched_err}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
origins = [
    settings.VITE_API_BASE_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handling Normalization per Section 9 of Integration Contract
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = "HTTP_ERROR"
    if exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 400:
        code = "BAD_REQUEST"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 422:
        code = "UNPROCESSABLE_ENTITY"
    elif exc.status_code == 409:
        code = "CONFLICT"

    message = exc.detail if isinstance(exc.detail, str) else "An HTTP error occurred."
    details = exc.detail if isinstance(exc.detail, dict) else {}

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": "Validation error in request parameters or body.",
                "details": {"errors": exc.errors()},
            }
        },
    )



@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": str(exc),
                "details": {},
            }
        },
    )


@app.exception_handler(KeyError)
async def key_error_handler(request: Request, exc: KeyError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": {
                "code": "NOT_FOUND",
                "message": f"Resource not found: {str(exc)}",
                "details": {},
            }
        },
    )


@app.exception_handler(TimeoutError)
async def timeout_error_handler(request: Request, exc: TimeoutError):
    return JSONResponse(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        content={
            "error": {
                "code": "TIMEOUT_ERROR",
                "message": "The request timed out.",
                "details": {"error": str(exc)},
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": {"error": str(exc)},
            }
        },
    )


# Include Routers
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(query.router, prefix=settings.API_V1_STR)
app.include_router(graph.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)


@app.get("/health")
def health_check():
    return {"status": "ok"}

