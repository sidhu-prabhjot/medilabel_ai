from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.routers import auth, medical, workouts, routines, exercises, body_metrics, plans

from postgrest.exceptions import APIError as PostgrestAPIError

# rate limiter
from api.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI()
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # change to frontend URL after
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response


#these two exception handlers catch uncaught errors that propogated up
@app.exception_handler(PostgrestAPIError)
async def supabase_error_handler(_request: Request, _exc: PostgrestAPIError):
    return JSONResponse(status_code=500, content={"detail": "A database error occurred"})


@app.exception_handler(Exception)
async def unhandled_error_handler(_request: Request, _exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred"})

app.include_router(auth.router)
app.include_router(medical.router)
app.include_router(workouts.router)
app.include_router(routines.router)
app.include_router(exercises.router)
app.include_router(body_metrics.router)
app.include_router(plans.router)

@app.get("/")
def root():
    return {"message": "MediLabel + Workout API is running!"}
    
