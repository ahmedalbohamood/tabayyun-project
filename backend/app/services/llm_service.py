from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")


def ask(question: str, context: str) -> str:
    prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer based on the context above:"
    response = llm.invoke(prompt)
    return response.content
