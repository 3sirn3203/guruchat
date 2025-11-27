from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import asyncio
import random
from .. import crud, schemas, database, models


router = APIRouter(prefix="/api/sessions/chat", tags=["chat"])


# GET /api/sessions/{session_id}/messages
@router.get("/{session_id}/messages", response_model=List[schemas.MessageInfo])
def get_messages(
    session_id: str,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(database.get_db)
):
    # Ensure user exists
    session = crud.get_session(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")
    
    return crud.get_session_messages(db, session_id=session_id)


# POST /api/sessions/{session_id}/chat
# Make streaming response
async def generate_chat_stream(db: Session, session_id: str,
                               request: schemas.PostChatRequest, characters: List[models.Character]):
    """Get chat response for all characters in the session."""

    user_message = request.content
    style = request.style  # 'spicy' or 'cold'
    model = request.model

    for character in characters:
        #################### TODO ####################
        mock_response = f"나는 {character.name}입니다. 당신의 메세지 {user_message}에 답변합니다."

        for token in mock_response:
            await asyncio.sleep(0.05)

            chunk = {
                "character_id": character.id,
                "name": character.name,
                "content": token
            }
            # SSE format: "data: <json>\n\n"
            yield f"data: {json.dumps(chunk)}\n\n"
        #################### TODO ####################

        # Send a space to indicate the end of message for this character
        yield f"data: {json.dumps({'content': ' '})}\n\n"

        try:
            crud.create_message(
                db,
                session_id=session_id,
                content=mock_response,
                role="assistant",
                character_id=character.id
            )
        except Exception as e:
            print(f"Error saving message: {e}")

@router.post("/{session_id}/chat")
async def send_message(
    session_id: str,
    request: schemas.PostChatRequest,
    user_id: str = Header(..., alias="X-User-ID"),
    db: Session = Depends(database.get_db)
):
    # Validate session
    session = crud.get_session(db, session_id=session_id)
    if not session or session.user_id != user_id:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.characters:
        raise HTTPException(status_code=400, detail="No characters in session")
    
    crud.create_message(
        db,
        session_id=session_id,
        content=request.content,
        role="user"
    )

    active_characters = session.characters
    
    return StreamingResponse(
        generate_chat_stream(db, session_id, request, active_characters),
        media_type="text/event-stream"
    )