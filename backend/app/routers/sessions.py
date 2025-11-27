from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, database


router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# POST /api/sessions
@router.post("/", response_model=schemas.PostSessionResponse)
def create_session(
    request: schemas.PostSessionRequest,
    db: Session = Depends(database.get_db)
):
    return crud.create_session(db, request)


# GET /api/sessions
@router.get("/", response_model=List[schemas.SessionInfo])
def read_sessions(
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(database.get_db)
):
    return crud.get_user_sessions(db, user_id=user_id)


# PATCH /api/sessions/{session_id}/title
@router.patch("/{session_id}/title", response_model=schemas.PostSessionResponse)
def update_session_title(
    session_id: str,
    request: schemas.PatchSessionTitleRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(database.get_db)
):
    # Ensure user exists
    session = crud.get_session(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
    
    return crud.update_session_title(db, session_id=session_id, new_title=request.title)


# DELETE /api/sessions/{session_id}
@router.delete("/{session_id}", response_model=schemas.DeleteSessionResponse)
def delete_session(
    session_id: str,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(database.get_db)
):
    # User authorization is handled in the CRUD function
    success = crud.delete_session(db, session_id=session_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not authorized to delete")
    return schemas.DeleteSessionResponse(status="deleted", session_id=session_id)