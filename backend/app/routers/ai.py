import shutil
from fastapi import APIRouter, UploadFile, File

from app.schemas.request_models import PromptRequest
from app.services.rag_service import ingest_pdf, search
from app.services.llm_service import ask

router = APIRouter(
    prefix="/api",
    tags=["AI"]
)


@router.post("/ask")
def ask_ai(request: PromptRequest):
    context = search(request.prompt)
    response = ask(request.prompt, context)
    return {"prompt": request.prompt, "response": response}


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_path = f"files/{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    chunks = ingest_pdf(file_path)
    return {"message": f"Uploaded and indexed {file.filename} with {chunks} chunks"}
