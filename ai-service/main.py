from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importam rutele din folderul nou
from routers import recommendations, churn, chat

app = FastAPI(title="Machine Learning Licenta Covrig Eduard", description="ML & AI API")

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