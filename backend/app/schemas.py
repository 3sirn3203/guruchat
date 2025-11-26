"""Pydantic schemas for API requests and responses."""
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

"""
POST /api/sessions
    request:
        user_id: UUID
        character_ids: List[UUID]

    response:
        session_id: UUID
        user_id: UUID
        title: str
        created_at: datetime
        character_descriptions: List[CharacterSummary]
"""
class CharacterSummary(BaseModel):
    character_id: UUID = Field(..., description="The unique identifier of the character.")
    name: str = Field(..., description="The name of the character.")
    description: Optional[str] = Field(None, description="The description of the character.")

class PostSessionRequest(BaseModel):
    user_id: UUID = Field(..., description="The unique identifier of the user.")
    character_ids: List[UUID] = Field(..., description="List of character IDs to include in the session.")

class PostSessionResponse(BaseModel):
    session_id: UUID = Field(..., description="The unique identifier of the created session.")
    user_id: UUID = Field(..., description="The unique identifier of the user who created the session.")
    title: str = Field(..., description="The title of the session.")
    created_at: datetime = Field(..., description="Timestamp when the session was created.")
    character_descriptions: List[CharacterSummary] = Field(..., description="Descriptions of the characters in the session.")


"""
GET /api/sessions
    request:
        None

    response:
        session_info: List[SessionInfo]
"""
class SessionInfo(BaseModel):
    session_id: UUID = Field(..., description="The unique identifier of the session.")
    title: str = Field(..., description="The title of the session.")
    created_at: datetime = Field(..., description="Timestamp when the session was created.")
    characters: List[CharacterSummary] = Field(..., description="List of characters in the session.")

class GetSessionsResponse(BaseModel):
    session_info: List[SessionInfo] = Field(..., description="List of session information objects.")


"""
PATCH /api/sessions/{session_id}/title
    request:
        title: str

    response: same as PostSessionResponse
        session_id: UUID
        user_id: UUID
        title: str
        created_at: datetime
        character_descriptions: List[CharacterSummary]
"""
class PatchSessionTitleRequest(BaseModel):
    title: str = Field(..., description="The new title for the session.")


"""
DELETE /api/sessions/{session_id}
    request:
        None

    response:
        status: str
        session_id: UUID
"""
class DeleteSessionResponse(BaseModel):
    status: str = Field(..., description="Status message indicating the result of the deletion operation.")
    session_id: UUID = Field(..., description="The unique identifier of the deleted session.")


"""
GET /api/sessions/{session_id}/messages
    request:
        None

    response:
        messages: List[MessageInfo]
"""
class MessageInfo(BaseModel):
    message_id: int = Field(..., description="The unique identifier of the message.")
    role: str = Field(..., description="The role of the message sender.")
    content: str = Field(..., description="The content of the message.")
    created_at: datetime = Field(..., description="Timestamp when the message was sent.")
    character: Optional[CharacterSummary] = Field(None, description="Character information if the message was sent by a character.")

class GetSessionMessagesResponse(BaseModel):
    messages: List[MessageInfo] = Field(..., description="List of messages in the session.")


"""
POST /api/sessions/{session_id}/chat
    request:
        content: str

    response:
        Streaming response (not defined here)
"""
class PostChatRequest(BaseModel):
    content: str = Field(..., description="The content of the message.")
    style: str = Field(..., description="The style of the message.")    # 'spicy' or 'cold'


"""
GET /api/characters
    request:
        None

    response:
        characters: List[CharacterInfo]
"""
class CharacterInfo(BaseModel):
    character_id: UUID = Field(..., description="The unique identifier of the character.")
    name: str = Field(..., description="The name of the character.")
    description: str = Field(..., description="The description of the character.")

class GetCharactersResponse(BaseModel):
    characters: List[CharacterInfo] = Field(..., description="List of available characters.")