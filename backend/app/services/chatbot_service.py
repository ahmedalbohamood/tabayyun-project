from langchain_openai import ChatOpenAI
from app.config.settings import settings


class ChatBotService:

    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.MODEL_NAME,
            api_key=settings.OPENAI_API_KEY
        )

    def chat(self, message: str):
        response = self.llm.invoke(message)
        return response.content