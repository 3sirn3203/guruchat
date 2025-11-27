"""Main application file for the Chat Session API using FastAPI"""
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, database
from .routers import sessions, chat, characters


models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chat Session API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(characters.router)


# Seed character data from JSON files in the data directory
def seed_characters():
    db = database.SessionLocal()
    try:
        # Set up data directory paths
        BASE_DIR = Path(__file__).resolve().parent
        DATA_DIR = BASE_DIR / "data"

        if not DATA_DIR.exists():
            print(f"Data directory does not exist: {DATA_DIR}")
            return

        # find json files in data directory
        json_files = list(DATA_DIR.glob("*.json"))
        
        if not json_files:
            print(f"No character files found in data directory: {DATA_DIR}")
            return

        print(f"📢 Found {len(json_files)} character files. Starting DB synchronization...")

        for file_path in json_files:
            try:
                # Load JSON data
                with open(file_path, "r", encoding="utf-8") as f:
                    char_data = json.load(f)
                
                char_id = char_data.get("id", file_path.stem)
                
                # Check if character already exists in DB
                exists = db.query(models.Character).filter(models.Character.id == char_id).first()
                
                if not exists:
                    print(f"Adding character: {char_data['name']} ({char_id})")
                    new_char = models.Character(
                        id=char_id,
                        name=char_data["name"],
                        description=char_data["description"],
                        persona_data=char_data["persona"]
                    )
                    db.add(new_char)
                    print(f"Character added: {char_data['name']} ({char_id})")
                else:
                    # If character exists, update its data
                    print(f"Updating character: {char_data['name']} ({char_id})")
                    exists.name = char_data["name"]
                    exists.description = char_data["description"]
                    exists.persona_data = char_data["persona"]
                    pass
            
            except Exception as file_error:
                print(f"Failed to process file ({file_path.name}): {file_error}")

        db.commit()
        
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        db.close()

seed_characters()


# GET /health
@app.get("/health")
def health_check():
    return {"status": "healthy"}