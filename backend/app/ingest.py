import os
from dotenv import load_dotenv
load_dotenv()

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

FILES_DIR = "./files"
CHROMA_DIR = "./chroma_db"

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)

existing = vectorstore._collection.get(include=["metadatas"])
ingested_sources = {
    os.path.abspath(m["source"])
    for m in existing["metadatas"]
    if m and "source" in m
}

pages = []
for root, dirs, files in os.walk(FILES_DIR):
    for filename in files:
        if filename.endswith(".pdf") or filename.endswith(".docx"):
            path = os.path.join(root, filename)
            abs_path = os.path.abspath(path)
            if abs_path in ingested_sources:
                print(f"Skipping (already ingested): {path}")
                continue
            print(f"Loading: {path}")
            loader = Docx2txtLoader(path) if filename.endswith(".docx") else PyPDFLoader(path)
            pages.extend(loader.load())

if not pages:
    print("No new files to ingest.")
else:
    print(f"Total new pages loaded: {len(pages)}")
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_documents(pages)
    vectorstore.add_documents(chunks)
    print(f"Total vectors in DB: {vectorstore._collection.count()}")
