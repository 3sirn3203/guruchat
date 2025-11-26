from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database


router = APIRouter(prefix="/api/characters", tags=["characters"])


# GET /api/characters
@router.get("/", response_model=schemas.GetCharactersResponse)
def read_characters(db: Session = Depends(database.get_db)):
    return crud.get_all_characters(db)