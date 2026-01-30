# --- MAC OS / CHROMA DB COMPATIBILITY FIX ---
import sys
import os
try:
    __import__('pysqlite3')
    sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
except ImportError:
    pass

import uvicorn
import re
import numpy as np
import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# --- CONFIGURATION ---
MODEL_NAME = 'all-MiniLM-L6-v2'
# Lowered thresholds for MVP demonstration purposes
SIMILARITY_THRESHOLD = 0.70 
SWARM_COUNT_THRESHOLD = 2 # Flags if it finds 2 other similar comments (Cluster of 3)

# --- DATA MODELS ---
class CommentInput(BaseModel):
    id: str
    author: str
    text: str
    account_age_days: int = 0  # Default 0 if scraping fails
    post_volume: int = 0       # Karma or total posts

class ScoreResult(BaseModel):
    comment_id: str
    bot_score: int
    breakdown: dict
    risk_level: str  # LOW, MEDIUM, HIGH

class AnalysisRequest(BaseModel):
    comments: List[CommentInput]

# --- VECTOR DATABASE WRAPPER ---
class VectorStore:
    def __init__(self):
        # Using ephemeral client (in-memory) for this MVP
        self.client = chromadb.Client(Settings(is_persistent=False))
        self.collection = self.client.create_collection(name="session_comments")

    def add_comments(self, ids: List[str], documents: List[str], embeddings: List[List[float]], metadatas: List[dict]):
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

    def query_similarity(self, embedding: List[float], n_results: int = 10):
        return self.collection.query(
            query_embeddings=[embedding],
            n_results=n_results
        )
    
    def reset(self):
        self.client.delete_collection("session_comments")
        self.collection = self.client.create_collection(name="session_comments")

# --- ANALYSIS ENGINE ---
class BotDetector:
    def __init__(self):
        print(f"Loading ML Model {MODEL_NAME}...")
        self.model = SentenceTransformer(MODEL_NAME)
        self.vector_store = VectorStore()
        # Regex for Layer 2: Linguistic Fingerprinting (AI Hedging/Common ChatGPT-isms)
        self.ai_patterns = [
            r"it is important to note",
            r"complex tapestry",
            r"delve into",
            r"nuanced approach",
            r"as an AI language model",
            r"multi-faceted",
            r"foster a sense of",
            r"testament to the"
        ]

    def _layer_1_metadata(self, age: int, volume: int) -> int:
        """
        Layer 1: Metadata Check (Weight: 20%)
        New accounts with high activity are suspicious.
        """
        score = 0
        if age < 90 and volume > 1000:
            score = 20
        return score

    def _layer_2_linguistics(self, text: str) -> int:
        """
        Layer 2: Linguistic Fingerprinting (Weight: 40%)
        Checks for AI hedging and specific phraseology.
        """
        score = 0
        text_lower = text.lower()
        
        matches = sum(1 for pattern in self.ai_patterns if re.search(pattern, text_lower))
        if matches > 0:
            score += 20
        
        if len(text.split()) > 15 and text[0].isupper() and text.endswith('.'):
             score += 20
             
        return min(score, 40)

    def _layer_3_coordination(self, current_vector, all_vectors) -> int:
        """
        Layer 3: Network Coordination (Weight: 40%)
        Calculates Cosine Similarity against the current batch/thread.
        """
        score = 0
        sim_count = 0
        norm_current = np.linalg.norm(current_vector)
        
        for other_vec in all_vectors:
            if np.array_equal(current_vector, other_vec):
                continue
                
            norm_other = np.linalg.norm(other_vec)
            if norm_current == 0 or norm_other == 0:
                continue
                
            cosine_sim = np.dot(current_vector, other_vec) / (norm_current * norm_other)
            
            if cosine_sim > SIMILARITY_THRESHOLD:
                sim_count += 1
        
        if sim_count >= SWARM_COUNT_THRESHOLD:
            score = 40
            
        return score

    def analyze_batch(self, comments: List[CommentInput]) -> List[ScoreResult]:
        results = []
        texts = [c.text for c in comments]
        if not texts:
            return []
            
        embeddings = self.model.encode(texts)
        
        self.vector_store.reset()
        ids = [c.id for c in comments]
        metadatas = [{"author": c.author} for c in comments]
        embeddings_list = embeddings.tolist()
        self.vector_store.add_comments(ids, texts, embeddings_list, metadatas)

        for i, comment in enumerate(comments):
            l1_score = self._layer_1_metadata(comment.account_age_days, comment.post_volume)
            l2_score = self._layer_2_linguistics(comment.text)
            l3_score = self._layer_3_coordination(embeddings[i], embeddings)
            
            total_score = l1_score + l2_score + l3_score
            
            risk = "LOW"
            if total_score >= 70:
                risk = "HIGH"
            elif total_score >= 40:
                risk = "MEDIUM"
                
            results.append(ScoreResult(
                comment_id=comment.id,
                bot_score=total_score,
                risk_level=risk,
                breakdown={
                    "metadata_risk": l1_score,
                    "linguistic_risk": l2_score,
                    "swarm_risk": l3_score
                }
            ))
            
        return results

# --- API SETUP ---
app = FastAPI(title="Bot Swarm Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model at startup
detector = BotDetector()

@app.post("/analyze", response_model=List[ScoreResult])
async def analyze_comments(payload: AnalysisRequest):
    try:
        results = detector.analyze_batch(payload.comments)
        return results
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "active", "model": MODEL_NAME}

if __name__ == "__main__":
    # Use PORT environment variable if available (Render/Heroku), otherwise 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
