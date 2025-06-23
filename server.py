from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from typing import Dict, List

# Import the local Gemini evaluation function
from app import evaluate_response

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class EvaluationRequest(BaseModel):
    question: str
    answer: str

# Define feedback model
class Feedback(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]

# Define response model
class EvaluationResponse(BaseModel):
    success: bool
    explanation: str
    score: int
    feedback: str

# Question model
class Question(BaseModel):
    id: int
    text: str
    context: str

# Questions endpoint
@app.get("/questions")
async def get_questions():
    # Return a mock response for now
    return {
        "success": True,
        "message": "Questions are loaded from questions.js on the client side"
    }

@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(request: EvaluationRequest):
    try:
        print(f"Received evaluation request for question: {request.question[:100]}...")
        print(f"Answer length: {len(request.answer)} characters")
        
        try:
            # Call the local Gemini evaluation function
            result = evaluate_response(request.question, request.answer)
            print(f"Evaluation result: {result}")
            
            # Return the result directly
            return {
                "success": result["passed"],
                "explanation": result["explanation"],
                "score": result["score"],
                "feedback": result["feedback"]
            }
        except Exception as gemini_error:
            print(f"Gemini function error: {str(gemini_error)}")
            print(f"Error type: {type(gemini_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Gemini function error: {str(gemini_error)}"
            )
    except Exception as e:
        print(f"Server error: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 