from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
import random
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware  # ✅ Import CORS
import os
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

# ✅ Ensure the correct database path
db_path = os.getenv("DATABASE_URL", "backend/chatbot.db").replace("sqlite:///", "")
db_dir = os.path.dirname(db_path)

# ✅ If the directory does not exist, create it
if db_dir and not os.path.exists(db_dir):
    os.makedirs(db_dir)

# ✅ Connect to SQLite database
conn = sqlite3.connect(db_path, check_same_thread=False)
cursor = conn.cursor()

app = FastAPI()
# ✅ AI Model for Chatbot
chatbot_pipeline = pipeline("text-generation", model="gpt2")
sentiment_analyzer = pipeline("sentiment-analysis")

# ✅ Enable CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all domains (for development)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Database setup
conn = sqlite3.connect("chatbot.db", check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''CREATE TABLE IF NOT EXISTS responses (
    employee_id TEXT,
    response TEXT,
    sentiment REAL
)''')
conn.commit()

class EmployeeQuery(BaseModel):
    employee_id: str

class EmployeeResponse(BaseModel):
    employee_id: str
    response: str

# Get a question for an employee
@app.post("/get_question/")
def get_question(query: EmployeeQuery):
    questions = ["How's your work experience?", "Do you have any concerns?"]
    return {"question": random.choice(questions)}

# Store employee responses & analyze sentiment
@app.post("/store_response/")
def store_response(response: EmployeeResponse):
    sentiment_result = sentiment_analyzer(response.response)[0]
    sentiment_score = sentiment_result["score"] if sentiment_result["label"] == "POSITIVE" else -sentiment_result["score"]
    
    cursor.execute("INSERT INTO responses (employee_id, response, sentiment) VALUES (?, ?, ?)",
                   (response.employee_id, response.response, sentiment_score))
    conn.commit()

    return {"message": "Response recorded.", "sentiment": sentiment_score}

# Get daily sentiment report
@app.get("/daily_report")
def daily_report():
    cursor.execute("SELECT employee_id, AVG(sentiment) FROM responses GROUP BY employee_id")
    report_data = cursor.fetchall()
    report = {emp_id: sentiment for emp_id, sentiment in report_data}
    return {"daily_sentiment_report": report}

# ✅ Fetch Employee Data from SQLite
def get_employee_data(employee_id):
    cursor.execute("SELECT * FROM Vibemeter WHERE Employee_ID = ?", (employee_id,))
    result = cursor.fetchone()
    if not result:
        return None
    return {
        "Employee_ID": result[0],
        "Response_Date": result[1],
        "Vibe_Score": result[2],
        "Emotion_Zone": result[3]
    }

# ✅ API Endpoint for Chatbot Responses
@app.post("/chat")
def chat_with_employee(employee_id: str, message: str):
    employee_data = get_employee_data(employee_id)
    
    if not employee_data:
        raise HTTPException(status_code=404, detail="Employee not found.")
    
    prompt = f"Employee {employee_id} has a mood score of {employee_data['Vibe_Score']} and emotion: {employee_data['Emotion_Zone']}. Respond meaningfully to: {message}"
    ai_response = chatbot_pipeline(prompt, max_length=50)[0]["generated_text"]
    
    return {"employee_data": employee_data, "chatbot_response": ai_response}

# ✅ Example API endpoint to test database connection
@app.get("/test_db")
def test_db():
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    return {"tables": tables}