from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    recommendations,
    interactions,
    quizzes,
    document_chunks,
    rag_chat
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & Status"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendation Engine"])
api_router.include_router(interactions.router, prefix="/interactions", tags=["Interaction Tracking"])
api_router.include_router(quizzes.router, prefix="/quiz", tags=["AI Quiz & Assessment"])
api_router.include_router(document_chunks.router, prefix="/documents", tags=["Document Processing & Chunks"])
api_router.include_router(rag_chat.router, prefix="/chat", tags=["RAG Academic Chatbot"])
