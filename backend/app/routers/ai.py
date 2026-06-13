from fastapi import APIRouter

from schemas.request_models import PromptRequest

router = APIRouter(
    prefix="/api",
    tags=["AI"]
)


@router.post("/ask")
def ask_ai(request: PromptRequest):

    return {
        "prompt": request.prompt,
        "response": "Placeholder response"
    }