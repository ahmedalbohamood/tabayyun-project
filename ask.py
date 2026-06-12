import os
from fastapi import FastAPI
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
llm = ChatOpenAI(model="gpt-4o-mini")

# 1. Ask a question
question = "what is generative ai"

# 2. Get relevant chunks
docs = vectorstore.similarity_search(question, k=4)
context = "\n\n".join(d.page_content for d in docs)

# 3. Build the prompt
prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer based on the context above:"

# 4. Ask the LLM
response = llm.invoke(prompt)
print(response.content)