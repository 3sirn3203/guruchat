"""Pydantic schemas for API requests and responses."""
from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CharacterSummary(BaseModel):
    id: UUID = Field(..., description="The unique identifier of the character.")
    name: str = Field(..., description="The name of the character.")
    description: Optional[str] = Field(None, description="The description of the character.")

class SessionInfo(BaseModel):
    id: UUID = Field(..., description="The unique identifier of the session.")
    title: str = Field(..., description="The title of the session.")
    created_at: datetime = Field(..., description="Timestamp when the session was created.")
    characters: List[CharacterSummary] = Field(..., description="List of characters in the session.")

class MessageInfo(BaseModel):
    id: int = Field(..., description="The unique identifier of the message.")
    role: str = Field(..., description="The role of the message sender.")
    content: str = Field(..., description="The content of the message.")
    created_at: datetime = Field(..., description="Timestamp when the message was sent.")
    character: Optional[CharacterSummary] = Field(None, description="Character information if the message was sent by a character.")


class PostSessionRequest(BaseModel):
    user_id: UUID = Field(..., description="The unique identifier of the user.")
    character_ids: List[UUID] = Field(..., description="List of character IDs to include in the session.")

class PostSessionResponse(BaseModel):
    id: UUID = Field(..., description="The unique identifier of the created session.")
    user_id: UUID = Field(..., description="The unique identifier of the user who created the session.")
    title: str = Field(..., description="The title of the session.")
    created_at: datetime = Field(..., description="Timestamp when the session was created.")
    characters: List[CharacterSummary] = Field(
        ...,
        serialization_alias="character_descriptions",
        description="Descriptions of the characters in the session.")


class PatchSessionTitleRequest(BaseModel):
    title: str = Field(..., description="The new title for the session.")


class DeleteSessionResponse(BaseModel):
    status: str = Field(..., description="Status message indicating the result of the deletion operation.")
    session_id: UUID = Field(..., description="The unique identifier of the deleted session.")


class PostChatRequest(BaseModel):
    content: str = Field(..., description="The content of the message.")
    style: str = Field(..., description="The style of the message.")    # 'spicy' or 'cold'
    model: str = Field(default="qwen3-235b-a22b-thinking-2507", description="The AI model to use for generating responses.")