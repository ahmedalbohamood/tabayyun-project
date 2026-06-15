from fastapi import APIRouter
from app.services.chatbot_service import ChatBotService

router = APIRouter(
     tags=["Chatbot"]
)

chatbot_service = ChatBotService()


@router.post("/chatbot")
def chatbot(message: str):

    response = chatbot_service.chat(message)

    return {
        "response": response
    }