from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#limitare chatbot
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


# Importam rutele din folder
from routers import recommendations, churn, chat

app = FastAPI(title="Machine Learning Licenta Covrig Eduard", description="ML & AI API")

#conectare limitator requesturi api la aplicatie
app.state.limiter = chat.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# punem toate rutele pe aplicatia principala, pe path-ul /api/ai)
app.include_router(recommendations.router, prefix="/api/ai", tags=["Recommendations"])
app.include_router(churn.router, prefix="/api/ai", tags=["Churn"])
app.include_router(chat.router, prefix="/api/ai", tags=["Chatbot"])