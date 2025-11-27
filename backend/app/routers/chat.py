from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json
import asyncio
from .. import crud, schemas, database, models
from ..utils.llm_chat import generate_guru_response


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


def _build_history_payload(messages: List[models.Message]):
    """Convert DB messages into a lightweight history payload."""
    history = []
    for message in messages:
        speaker = message.character.name if message.character else "User"
        history.append({
            "role": message.role or ("assistant" if message.character else "user"),
            "speaker": speaker,
            "content": message.content or ""
        })
    return history


# POST /api/sessions/{session_id}/chat
# Make streaming response
async def generate_chat_stream(db: Session, session_id: str,
                               request: schemas.PostChatRequest, characters: List[models.Character]):
    """Get chat response for all characters in the session."""

    user_message = request.content
    style = request.style  # 'spicy' or 'cold'
    model = request.model

    loop = asyncio.get_running_loop()
    llm_mode = "hot" if isinstance(style, str) and style.lower() == "spicy" else "cold"

    existing_messages = crud.get_session_messages(db, session_id=session_id)
    conversation_history = _build_history_payload(existing_messages)

    for character in characters:
        persona_data = character.persona_data or {}
        if isinstance(persona_data, dict):
            character_profile = dict(persona_data)
        else:
            try:
                character_profile = json.loads(persona_data)
            except (TypeError, json.JSONDecodeError):
                character_profile = {"persona": persona_data}

        character_profile.setdefault("name", character.name)
        character_profile.setdefault("description", character.description)
        character_profile.setdefault("id", character.id)

        queue: asyncio.Queue = asyncio.Queue()
        streamed_chunks = []

        def enqueue_chunk(text: str):
            try:
                loop.call_soon_threadsafe(queue.put_nowait, text)
            except RuntimeError:
                pass

        def finish_stream():
            try:
                loop.call_soon_threadsafe(queue.put_nowait, None)
            except RuntimeError:
                pass

        def llm_worker():
            return generate_guru_response(
                user_message,
                llm_mode,
                character_profile,
                chat_history=conversation_history,
                stream_callback=enqueue_chunk,
                stream_end_callback=finish_stream
            )

        response_future = loop.run_in_executor(None, llm_worker)

        while True:
            chunk_text = await queue.get()
            if chunk_text is None:
                break
            streamed_chunks.append(chunk_text)
            chunk = {
                "character_id": character.id,
                "name": character.name,
                "content": chunk_text
            }
            yield f"data: {json.dumps(chunk)}\n\n"

        try:
            assistant_response = await response_future
        except HTTPException:
            raise
        except Exception as exc:
            assistant_response = f"System Error: {exc}"

        assistant_response = assistant_response or ""

        if not streamed_chunks:
            chunk = {
                "character_id": character.id,
                "name": character.name,
                "content": assistant_response
            }
            yield f"data: {json.dumps(chunk)}\n\n"

        # Send a space to indicate the end of message for this character
        yield f"data: {json.dumps({'content': ' '})}\n\n"

        try:
            crud.create_message(
                db,
                session_id=session_id,
                content=assistant_response,
                role="assistant",
                character_id=character.id
            )
        except Exception as e:
            print(f"Error saving message: {e}")

        conversation_history.append({
            "role": "assistant",
            "speaker": character.name,
            "content": assistant_response
        })

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
