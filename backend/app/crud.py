"""DB SQL query operations"""
from sqlalchemy.orm import Session, joinedload
from . import models, schemas


# 1. User Logic
def get_user(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user_id: str):
    db_user = models.User(id=user_id)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def ensure_user_exists(db: Session, user_id: str):
    """
    If user does not exist, create one.
    Else, return the existing user.
    """
    user = get_user(db, user_id)
    if not user:
        user = create_user(db, user_id)
    return user


# 2. Character Logic
def get_all_characters(db: Session):
    return db.query(models.Character).all()

def get_character(db: Session, character_id: str):
    return db.query(models.Character).filter(models.Character.id == character_id).first()

def create_character(db: Session, character_data: dict):
    """Create new character with persona_data as JSON field."""
    db_char = models.Character(
        id=character_data["id"],
        name=character_data["name"],
        description=character_data["description"],
        persona_data=character_data["persona_data"] # JSON field
    )
    db.add(db_char)
    db.commit()
    db.refresh(db_char)
    return db_char

def update_character_persona(db: Session, character_id: str, new_persona: dict):
    """Update character persona (JSON)."""
    db_char = get_character(db, character_id)
    if db_char:
        db_char.persona_data = new_persona
        db.commit()
        db.refresh(db_char)
        return db_char
    return None


# 3. Session Logic
def create_session(db: Session, session: schemas.PostSessionRequest):
    """Create a new session and associate characters (N:M)."""
    
    # 1. Ensure user exists (create if not)
    ensure_user_exists(db, session.user_id)

    # 2. Retrieve actual character objects for requested character IDs
    characters = db.query(models.Character).filter(
        models.Character.id.in_(session.character_ids)
    ).all()

    # 3. Create session (SQLAlchemy automatically handles the intermediate table session_characters)
    db_session = models.Session(
        user_id=session.user_id,
        title="New Chat", # Initial title
        characters=characters 
    )
    
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def get_user_sessions(db: Session, user_id: str):
    """
    Retrieve list of my chat rooms (most recent first).
    To display thumbnails in the list, load the characters relationship with joinedload at once.
    """
    return db.query(models.Session)\
        .options(joinedload(models.Session.characters))\
        .filter(models.Session.user_id == user_id)\
        .order_by(models.Session.created_at.desc())\
        .all()

def get_session(db: Session, session_id: str):
    """Retrieve session details (including character information)."""
    return db.query(models.Session)\
        .options(joinedload(models.Session.characters))\
        .filter(models.Session.id == session_id)\
        .first()

def update_session_title(db: Session, session_id: str, new_title: str):
    """
    Update session title.
    Note: Ownership verification is done in the Router layer.
    """
    db_session = db.query(models.Session).filter(models.Session.id == session_id).first()
    if db_session:
        db_session.title = new_title
        db.commit()
        db.refresh(db_session)
        # Loading character information may be necessary to match the response schema
        # (Accessing characters on the Session object triggers Lazy Load)
        return db_session
    return None

def delete_session(db: Session, session_id: str, user_id: str):
    """Delete session (including ownership verification)."""
    db_session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == user_id
    ).first()
    
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False


# 4. Message Logic

def create_message(db: Session, session_id: str, content: str, role: str, character_id: str = None):
    """Create a new message in a session."""
    db_message = models.Message(
        session_id=session_id,
        role=role,
        content=content,
        character_id=character_id # Required if the message is from a character
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_session_messages(db: Session, session_id: str):
    """Retrieve all messages in a session, ordered by creation time ascending."""
    return db.query(models.Message)\
        .options(joinedload(models.Message.character))\
        .filter(models.Message.session_id == session_id)\
        .order_by(models.Message.created_at.asc())\
        .all()