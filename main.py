import os
from dotenv import load_dotenv
load_dotenv()

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma


FILES_DIR = "files"
CHROMA_DIR = "./chroma_db"

pages = []
for filename in os.listdir(FILES_DIR):
    if filename.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(FILES_DIR, filename))
        pages.extend(loader.load())

print(f"Loaded {len(pages)} pages from {FILES_DIR}/")

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
chunks = splitter.split_documents(pages)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=CHROMA_DIR,
)

print(f"Stored {vectorstore._collection.count()} vectors")
