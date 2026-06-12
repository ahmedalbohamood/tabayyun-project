from langchain_community.document_loaders import PyPDFLoader
from fastapi import FastAPI

app =FastAPI()
PDF_PATH = "your_document.pdf"
@app.get("/health")


def health():
    return {"status": "ok"}



loader = PyPDFLoader("files/Introduction_to_GenAI_&_LLM.pptx.pdf")
pages = loader.load()

#print(f"Loaded {len(pages)} pages")
#print(pages[0].page_content[:500])
#print(pages[0].metadata)


from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
)

chunks = splitter.split_documents(pages)

#print(f"Total chunks: {len(chunks)}")
#print(chunks[0].page_content)

import os
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_DIR = "./chroma_db"

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=CHROMA_DIR,
)

print(f"Stored {vectorstore._collection.count()} vectors")