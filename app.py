from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI , UploadFile , File
import shutil
from pydantic import BaseModel
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
llm = ChatOpenAI(model="gpt-4o-mini")

app = FastAPI()

class Question(BaseModel):
    question: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/ask")
def ask(body: Question):
    docs = vectorstore.similarity_search(body.question, k=4)
    context = "\n\n".join(d.page_content for d in docs)
    prompt = f"Context:\n{context}\n\nQuestion: {body.question}\n\nAnswer based on the context above:"
    response = llm.invoke(prompt)
    return {"answer": response.content}


@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_path = f"files/{file.filename}"
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    chunks = splitter.split_documents(pages)
    
    vectorstore.add_documents(chunks)
    
    return {"message": f"Uploaded and indexed {file.filename} with {len(chunks)} chunks"}

