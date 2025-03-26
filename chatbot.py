import os
import json
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import torch
import secrets
import traceback
import readline
import modal
from modal import Image, Mount
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security.api_key import APIKeyHeader, APIKey
from starlette.status import HTTP_403_FORBIDDEN
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Data models for API
class ChatRequest(BaseModel):
    message: str = ""
    session_id: Optional[str] = None
    employee_id: Optional[str] = None

class ChatResponse(BaseModel):
    question: Optional[str] = None
    final_analysis: Optional[Dict[str, Any]] = None
    session_id: str

# Modal setup
app = modal.App("employee-sentiment-analysis")
stub = app
@app.function(secrets=[modal.Secret.from_name("huggingface-token")])                                             
def some_function():                                                                                             
    os.getenv("HUGGINGFACE_TOKEN")
# Define API key security scheme
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

# Generate a secure API key if not provided
DEFAULT_API_KEY = ""

# Create image with all dependencies
image = modal.Image.debian_slim().pip_install([
    "transformers",
    "torch",
    "fastapi[standard]",
    "accelerate",
    "einops",
    "flask"
])

# File paths and configuration - Use local paths for CLI mode
DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
FEEDBACK_FILE = os.path.join(DATA_PATH, "employee_feedback.json")
ESCALATION_FILE = os.path.join(DATA_PATH, "hr_escalations.json")
SCHEDULE_FILE = os.path.join(DATA_PATH, "interaction_schedule.json")

# Create volumes to persist data
volume = modal.Volume.from_name("employee-data", create_if_missing=True)
api_keys_volume = modal.Volume.from_name("api-keys-volume", create_if_missing=True)

# Get expanded question bank
def get_expanded_questions():
    """Returns an expanded list of workplace questions"""
    return [
        # Work Environment
        "How do you feel about your physical work environment?",
        "Do you have all the tools you need to do your job effectively?",
        "How would you describe the noise level in your workspace?",
        "Is your workspace comfortable and ergonomically suitable?",
        "Do you feel the office layout promotes collaboration?",
        "How do you feel about the lighting in your workspace?",
        "Do you have enough privacy to focus on your work?",
        
        # Work-Life Balance
        "How many hours do you typically work per week?",
        "Do you feel you have enough time for personal activities?",
        "How often do you work on weekends or after hours?",
        "Do you feel comfortable taking time off when needed?",
        "How would you describe your work-life balance?",
        "Do you feel pressured to always be available outside work hours?",
        "How do you manage stress from work?",
        
        # Management and Leadership
        "Do you feel your manager listens to your concerns?",
        "How would you describe your relationship with your manager?",
        "Do you receive regular feedback on your performance?",
        "Do you feel management recognizes your contributions?",
        "How transparent is leadership about company decisions?",
        "Do you feel comfortable approaching senior management?",
        "How well does your manager help you grow professionally?",
        
        # Team Dynamics
        "How would you describe your relationships with colleagues?",
        "Do you feel your team collaborates effectively?",
        "Do you feel included in team activities and decisions?",
        "How are conflicts resolved within your team?",
        "Do you feel your ideas are valued by team members?",
        "How would you rate the communication within your team?",
        "Do you feel supported by your colleagues?",
        
        # Career Growth
        "Do you see a clear career path at this company?",
        "How satisfied are you with professional development opportunities?",
        "Do you feel you're learning and growing in your role?",
        "Are there opportunities for advancement in your department?",
        "How well does the company support your career goals?",
        "Do you feel your skills are being fully utilized?",
        "What skills would you like to develop further?",
        
        # Compensation and Benefits
        "Do you feel fairly compensated for your work?",
        "How satisfied are you with the benefits package?",
        "Does your compensation reflect your contributions?",
        "How does your compensation compare to industry standards?",
        "Are there benefits you wish the company offered?",
        "How important is compensation compared to other job aspects?",
        "Do you understand how compensation decisions are made?",
        
        # Workload and Resources
        "How would you describe your current workload?",
        "Do you have the resources you need to do your job well?",
        "How often do you feel overwhelmed by your responsibilities?",
        "Are deadlines and expectations realistic in your role?",
        "Do you feel your workload is fairly distributed in your team?",
        "How often do you need to work extra hours to complete tasks?",
        "Do you feel you have enough support with your tasks?"
    ]

@stub.function(volumes={"/root/api_keys": api_keys_volume})
def get_valid_api_keys():
    """Get list of valid API keys"""
    try:
        with open("/root/api_keys/keys.json", "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Create default keys file if it doesn't exist
        os.makedirs("/root/api_keys", exist_ok=True)
        with open("/root/api_keys/keys.json", "w") as f:
            keys = [DEFAULT_API_KEY]
            json.dump(keys, f)
        return keys

async def get_api_key(api_key_header: str = Security(api_key_header)):
    """Validate API key"""
    if not api_key_header:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="API key missing"
        )
    
    valid_keys = get_valid_api_keys.remote()
    
    if api_key_header not in valid_keys:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Invalid API key"
        )
    
    return api_key_header

# Create a class to handle all chatbot operations
@stub.cls(
    image=image,
    gpu="any",
    timeout=600,
    secrets=[modal.Secret.from_name("huggingface-token")],
    volumes={"/root/data": volume, "/root/api_keys": api_keys_volume},
    min_containers=1
)
class ChatBot:
    def __init__(self):
        """Initialize instance variables"""
        # Initialize sessions here to fix the error in local mode
        self.sessions = {}
        self.sentiment_model = None
        
        # Create local data directory for CLI mode
        os.makedirs(DATA_PATH, exist_ok=True)
        self.init_json_local()  # Initialize local JSON files
        
        # Try to load sentiment model in __init__ for local mode
        try:
            from transformers import pipeline
            print("Loading sentiment model in local mode...")
            self.sentiment_model = pipeline(
                "sentiment-analysis", 
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            print("Sentiment model loaded successfully in local mode")
        except Exception as e:
            print(f"Could not load sentiment model in local mode: {str(e)}")
            print("Will use fallback sentiment analyzer")
            self.sentiment_model = None

    def __enter__(self):
        """Initialize models when the container starts"""
        from transformers import pipeline
        import os
        
        # Create container data directory
        os.makedirs("/root/data", exist_ok=True)
        
        # Initialize JSON files in container
        self.init_json_container()
        
        # Initialize sessions
        self.sessions = {}
        
        # Load sentiment model with better error handling
        print("Loading sentiment analysis model...")
        try:
            self.sentiment_model = pipeline(
                "sentiment-analysis", 
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            print("Sentiment model loaded successfully")
        except Exception as e:
            print(f"Error loading sentiment model: {str(e)}")
            # Set a default sentiment analyzer that won't crash
            self.sentiment_model = self.simple_sentiment_analyzer
            
        # Print API key information
        print(f"\n=== API KEY INFORMATION ===")
        print(f"Your API key is: {DEFAULT_API_KEY}")
        print(f"Include this in your requests as an 'X-API-Key' header.\n")
        
        return self
    
    # Simple sentiment analyzer as fallback with improved workspace terms
    def simple_sentiment_analyzer(self, text):
        """Simple rule-based sentiment analyzer as fallback"""
        print("Using fallback sentiment analyzer")
        
        # Expanded workplace-specific positive vocabulary
        positive_words = [
            "good", "great", "excellent", "happy", "enjoy", "like", "love", 
            "wonderful", "fantastic", "perfect", "positive", "satisfied", "awesome",
            # Workspace-specific positive terms
            "spacious", "peaceful", "quiet", "collaborative", "comfortable", 
            "ergonomic", "well-lit", "bright", "flexible", "modern", "clean",
            "organized", "efficient", "productive", "convenient", "accessible"
        ]
        
        # Expanded workplace-specific negative vocabulary
        negative_words = [
            "bad", "terrible", "awful", "sad", "hate", "dislike", "frustrat", 
            "angry", "unhappy", "negative", "annoying", "poor", "stress",
            # Workspace-specific negative terms
            "cramped", "noisy", "loud", "distracting", "uncomfortable", "dim",
            "dark", "rigid", "outdated", "messy", "disorganized", "inefficient",
            "unproductive", "inconvenient", "inaccessible", "crowded"
        ]
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        # Strengthen positive bias for workspace descriptions
        workspace_specific_terms = ["space", "office", "desk", "environment", "workplace"]
        if any(term in text_lower for term in workspace_specific_terms):
            positive_count += 0.5  # Add a slight positive bias for workspace descriptions
        
        if positive_count > negative_count:
            return [{"label": "POSITIVE", "score": 0.8}]
        else:
            return [{"label": "NEGATIVE", "score": 0.8}]
    
    # Separate methods for local and container file initialization
    def init_json_local(self):
        """Initialize JSON files locally"""
        for file, default_data in [
            (FEEDBACK_FILE, []),
            (ESCALATION_FILE, []),
            (SCHEDULE_FILE, [])
        ]:
            if not os.path.exists(file):
                os.makedirs(os.path.dirname(file), exist_ok=True)
                with open(file, 'w') as f:
                    json.dump(default_data, f, indent=2)
                print(f"Created local file {file}")
    
    def init_json_container(self):
        """Initialize JSON files in container"""
        for file, default_data in [
            ("/root/data/employee_feedback.json", []),
            ("/root/data/hr_escalations.json", []),
            ("/root/data/interaction_schedule.json", [])
        ]:
            if not os.path.exists(file):
                with open(file, 'w') as f:
                    json.dump(default_data, f, indent=2)
                print(f"Created container file {file}")
    
    # Legacy method for backward compatibility
    def init_csv(self):
        """Initialize files - legacy method"""
        self.init_json_local()
        
    def analyze_sentiment(self, text):
        """Analyze sentiment and extract reason from text"""
        try:
            # Check if sentiment_model is None
            if self.sentiment_model is None:
                print("Sentiment model not initialized, using fallback")
                result = self.simple_sentiment_analyzer(text)
            else:
                # Get raw sentiment from model
                result = self.sentiment_model(text)
            
            raw_sentiment = result[0]['label']
            sentiment_score = result[0]['score']
            
            # Map to our sentiment categories
            if raw_sentiment == "POSITIVE":
                if sentiment_score > 0.75:  # Lower threshold for Happy Zone
                    sentiment = "Happy Zone"
                else:
                    sentiment = "Leaning to Happy Zone"
            else:  # NEGATIVE
                if sentiment_score > 0.85:  # Higher threshold for Sad Zone
                    sentiment = "Sad Zone"
                elif sentiment_score > 0.7:
                    sentiment = "Leaning to Sad Zone"
                elif "frustrat" in text.lower() or "anger" in text.lower():
                    sentiment = "Frustrated Zone"
                else:
                    sentiment = "Neutral Zone (OK)"
            
            # Check for positive keywords
            positive_keywords = ["love", "enjoy", "great", "excellent", "fantastic", "happy", "satisfied", 
                               "content", "appreciate", "wonderful", "positive", "good", "well", "awesome"]
            
            # If any positive keywords, boost sentiment if neutral
            if sentiment == "Neutral Zone (OK)":
                for keyword in positive_keywords:
                    if keyword in text.lower():
                        sentiment = "Leaning to Happy Zone"
                        break
            
            # Simple keyword analysis for reasons
            reason_keywords = {
                "workload": "Work volume concerns",
                "stress": "Stress-related issues",
                "colleague": "Interpersonal dynamics",
                "team": "Team dynamics",
                "manager": "Management concerns",
                "leadership": "Leadership issues",
                "environment": "Workplace environment",
                "balance": "Work-life balance",
                "happy": "Job satisfaction",
                "enjoy": "Job satisfaction",
                "compensat": "Compensation concerns",
                "pay": "Compensation concerns",
                "benefit": "Benefits concerns",
                "resource": "Resource limitations",
                "tool": "Tool and equipment issues",
                "growth": "Career growth concerns",
                "opportunity": "Career development",
                "communication": "Communication issues"
            }
            
            reason = "General feedback"
            for keyword, explanation in reason_keywords.items():
                if keyword in text.lower():
                    reason = explanation
                    break
            
            return sentiment, reason
        except Exception as e:
            print(f"Analysis error: {str(e)}")
            return 'Neutral Zone (OK)', 'Analysis failed'
    
    def save_response(self, employee_id, question, response, sentiment, reason):
        """Save response to JSON file"""
        try:
            # For local testing, use local paths
            if os.path.exists(FEEDBACK_FILE):
                file_to_use = FEEDBACK_FILE
            else:
                # For container, use container paths
                file_to_use = "/root/data/employee_feedback.json"
                
            new_entry = {
                "employee_id": employee_id,
                "question": question,
                "response": response,
                "sentiment": sentiment,
                "reason": reason,
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            
            # Read existing data
            if os.path.exists(file_to_use) and os.path.getsize(file_to_use) > 0:
                with open(file_to_use, 'r') as f:
                    feedback_data = json.load(f)
            else:
                feedback_data = []
                
            # Add new entry
            feedback_data.append(new_entry)
            
            # Write back to file
            with open(file_to_use, 'w') as f:
                json.dump(feedback_data, f, indent=2)
            
            print(f"Saved response to {file_to_use}")
            
        except Exception as e:
            print(f"Error saving response: {str(e)}")
            # Continue execution even if saving fails
    
    def determine_hr_escalation(self, session):
        """
        Multi-factor approach to determine if HR escalation is needed.
        Returns a tuple with (score, needs_escalation, reason)
        """
        sentiment_counts = session["sentiment_counts"]
        
        # 1. Calculate basic measures
        total_responses = sum(sentiment_counts.values())
        negative_count = sum([
            sentiment_counts["Sad Zone"],
            sentiment_counts["Leaning to Sad Zone"],
            sentiment_counts["Frustrated Zone"]
        ])
        positive_count = sum([
            sentiment_counts["Happy Zone"],
            sentiment_counts["Leaning to Happy Zone"]
        ])
        
        # 2. Check for consecutive negative responses
        consecutive_negative = 0
        max_consecutive = 0
        for entry in session["history"]:
            if entry["sentiment"] in ["Sad Zone", "Leaning to Sad Zone", "Frustrated Zone"]:
                consecutive_negative += 1
            else:
                max_consecutive = max(max_consecutive, consecutive_negative)
                consecutive_negative = 0
        max_consecutive = max(max_consecutive, consecutive_negative)
        
        # 3. Topic sensitivity check
        critical_keywords = ["harassment", "discrimination", "burnout", "quit", "unsafe", 
                            "overworked", "stress", "hostile", "unfair", "mental health"]
        critical_mentions = 0
        for entry in session["history"]:
            response = entry["response"].lower()
            for keyword in critical_keywords:
                if keyword in response:
                    critical_mentions += 1
                    break
                    
        # 4. Create a score-based system (0-10)
        escalation_score = 0
        
        # Add points for negative sentiment - reduced weight from 2 to 1 for Sad Zone
        escalation_score += sentiment_counts["Sad Zone"] * 1  # Reduced from 2 to 1
        escalation_score += sentiment_counts["Leaning to Sad Zone"] * 0.5
        escalation_score += sentiment_counts["Frustrated Zone"] * 1
        
        # Add points for consecutive negative responses
        escalation_score += max_consecutive * 0.5
        
        # Add points for critical topic mentions
        escalation_score += critical_mentions * 1.5
        
        # Add points if negative responses are a high percentage of total
        if total_responses > 0 and negative_count / total_responses > 0.4:
            escalation_score += 2
            
        # Calculate escalation reason
        reason = ""
        
        # Increase threshold for positive sentiment
        threshold = 5
        if positive_count > negative_count:
            threshold = 7  # Higher threshold when overall sentiment is positive
            
        needs_escalation = escalation_score >= threshold
            
        if needs_escalation:
            reason_parts = []
            if sentiment_counts["Sad Zone"] >= 2:
                reason_parts.append("multiple highly negative responses")
            if max_consecutive >= 2:
                reason_parts.append("consecutive negative responses")
            if critical_mentions > 0:
                reason_parts.append(f"mentions of sensitive topics")
            if total_responses > 0 and negative_count / total_responses > 0.4:
                reason_parts.append("high ratio of negative feedback")
                
            if reason_parts:
                reason = "Employee reported " + ", ".join(reason_parts)
            else:
                reason = "Multiple factors indicating potential employee distress"
        
        return (escalation_score, needs_escalation, reason)
    
    def check_and_escalate(self, employee_id, reason="Repeated negative sentiment detected"):
        """Record HR escalation with reason"""
        try:
            # Try both local and container paths
            if os.path.exists(ESCALATION_FILE):
                escalation_file = ESCALATION_FILE
            else:
                escalation_file = "/root/data/hr_escalations.json"
            
            new_esc = {
                "employee_id": employee_id,
                "escalation_reason": reason,
                "date": datetime.now().strftime("%Y-%m-%d")
            }
            
            # Read existing data
            if os.path.exists(escalation_file) and os.path.getsize(escalation_file) > 0:
                with open(escalation_file, 'r') as f:
                    escalation_data = json.load(f)
            else:
                escalation_data = []
            
            # Add new entry
            escalation_data.append(new_esc)
            
            # Write back to file
            with open(escalation_file, 'w') as f:
                json.dump(escalation_data, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error recording escalation: {str(e)}")
        
        return False
    
    def update_interaction_schedule(self, employee_id, sentiment):
        """Update when to next interact with employee"""
        try:
            days = 7
            if sentiment in ["Sad Zone", "Leaning to Sad Zone", "Frustrated Zone"]:
                days = 1
            elif sentiment in ["Neutral Zone (OK)", "Leaning to Happy Zone"]:
                days = 3

            next_date = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
            
            # Try both local and container paths
            if os.path.exists(SCHEDULE_FILE):
                file_to_use = SCHEDULE_FILE
            else:
                file_to_use = "/root/data/interaction_schedule.json"
            
            # Read existing data
            if os.path.exists(file_to_use) and os.path.getsize(file_to_use) > 0:
                with open(file_to_use, 'r') as f:
                    schedule_data = json.load(f)
            else:
                schedule_data = []
            
            # Check if employee exists in schedule
            employee_found = False
            for entry in schedule_data:
                if entry["employee_id"] == employee_id:
                    entry["next_interaction"] = next_date
                    employee_found = True
                    break
            
            # Add new entry if employee not found
            if not employee_found:
                schedule_data.append({
                    "employee_id": employee_id,
                    "next_interaction": next_date
                })
            
            # Write back to file
            with open(file_to_use, 'w') as f:
                json.dump(schedule_data, f, indent=2)
        except Exception as e:
            print(f"Error updating schedule: {str(e)}")
    
    def create_session(self, employee_id):
        """Create a new chat session with balanced question selection"""
        session_id = str(uuid.uuid4())
        
        # Get all questions from the predefined list
        all_questions = get_expanded_questions()
        
        # Create a balanced selection from different categories
        # This ensures we ask about different aspects of work experience
        categories = [
            all_questions[0:7],     # Work Environment
            all_questions[7:14],    # Work-Life Balance
            all_questions[14:21],   # Management and Leadership
            all_questions[21:28],   # Team Dynamics
            all_questions[28:35],   # Career Growth
            all_questions[35:42],   # Compensation and Benefits
            all_questions[42:49]    # Workload and Resources
        ]
        
        # Select 1-2 questions from each category
        selected_questions = []
        for category in categories:
            # Take 1 or 2 questions from each category
            num_to_take = random.randint(1, 2)
            selected = random.sample(category, num_to_take)
            selected_questions.extend(selected)
        
        # Randomize the order of questions
        random.shuffle(selected_questions)
        
        # Make sure we have a reasonable number of questions
        if len(selected_questions) > 15:
            selected_questions = selected_questions[:15]
        
        self.sessions[session_id] = {
            "employee_id": employee_id,
            "history": [],
            "question_index": 0,
            "current_max_questions": 8,  # Default is neutral
            "questions": selected_questions,
            "sentiment_counts": {
                "Happy Zone": 0,
                "Leaning to Happy Zone": 0,
                "Neutral Zone (OK)": 0,
                "Leaning to Sad Zone": 0,
                "Sad Zone": 0,
                "Frustrated Zone": 0
            }
        }
        return session_id, selected_questions[0]
    
    def generate_final_analysis(self, session):
        """Generate final analysis of the conversation"""
        sentiment_counts = session["sentiment_counts"]
        total = sum(sentiment_counts.values())
        negative = sum([
            sentiment_counts["Sad Zone"],
            sentiment_counts["Leaning to Sad Zone"],
            sentiment_counts["Frustrated Zone"]
        ])
        positive = sum([
            sentiment_counts["Happy Zone"],
            sentiment_counts["Leaning to Happy Zone"]
        ])
        
        # Determine overall sentiment
        if positive > negative * 2:
            sentiment_category = "Very Positive"
        elif positive > negative:
            sentiment_category = "Generally Positive"
        elif negative > positive * 2:
            sentiment_category = "Very Concerning"
        elif negative > positive:
            sentiment_category = "Needs Attention"
        else:
            sentiment_category = "Mixed"
        
        # Extract unique reasons
        reasons = []
        for item in session["history"]:
            if "reason" in item and item["reason"] not in reasons:
                reasons.append(item["reason"])
        
        # Schedule next interaction
        if negative > positive:
            next_days = 1
        elif negative > 0:
            next_days = 3
        else:
            next_days = 7
        
        next_date = (datetime.now() + timedelta(days=next_days)).strftime("%Y-%m-%d")
        
        # Save to schedule file
        employee_id = session["employee_id"]
        self.update_interaction_schedule(employee_id, 
                                         "Sad Zone" if negative > positive else "Happy Zone")
        
        # Use new multi-factor approach for HR escalation
        score, needs_escalation, escalation_reason = self.determine_hr_escalation(session)
        
        # If escalation is needed, record it
        if needs_escalation:
            self.check_and_escalate(employee_id, escalation_reason)
        
        return {
            "employee_id": employee_id,
            "sentiment_distribution": sentiment_counts,
            "key_themes": reasons,
            "overall_assessment": sentiment_category,
            "next_interaction": next_date,
            "responses_analyzed": total,
            "hr_escalation": needs_escalation,
            "escalation_reason": escalation_reason if needs_escalation else ""
        }
    
    def process_chat(self, message, session_id):
        """Core logic for processing a chat message"""
        if session_id not in self.sessions:
            raise ValueError("Session not found")
        
        session = self.sessions[session_id]
        
        # Process the user's response
        response = message
        question_index = session["question_index"]
        questions = session["questions"]
        
        # Get the current question
        current_question = questions[question_index]
        
        # Analyze sentiment
        sentiment, reason = self.analyze_sentiment(response)
        
        # Update session
        session["history"].append({
            "question": current_question,
            "response": response,
            "sentiment": sentiment,
            "reason": reason
        })
        
        # Update sentiment counts
        if sentiment in session["sentiment_counts"]:
            session["sentiment_counts"][sentiment] += 1
        
        # Adapt max questions based on sentiment
        if sentiment in ["Sad Zone", "Leaning to Sad Zone", "Frustrated Zone"]:
            session["current_max_questions"] = 12  # More questions for negative sentiment
        elif sentiment in ["Happy Zone", "Leaning to Happy Zone"]:
            session["current_max_questions"] = 5   # Fewer questions for positive sentiment
        
        # Save response to JSON
        self.save_response(
            session["employee_id"],
            current_question,
            response,
            sentiment,
            reason
        )
        
        # Increment question index
        session["question_index"] += 1
        print(f"DEBUG: Question index: {session['question_index']}, Max questions: {session['current_max_questions']}")
        print(f"DEBUG: Total available questions: {len(session['questions'])}")
        
        # Check if conversation should end
        if session["question_index"] >= session["current_max_questions"] or session["question_index"] >= len(session["questions"]):
            analysis = self.generate_final_analysis(session)
            return ChatResponse(
                final_analysis=analysis,
                session_id=session_id
            )
        
        # Just get the next predefined question
        next_q = session["questions"][session["question_index"]]
        
        return ChatResponse(
            question=next_q,
            session_id=session_id
        )
    
    @modal.fastapi_endpoint(method="POST")
    def start_chat(self, request: ChatRequest, api_key: APIKey = Depends(get_api_key)):
        """Start a new chat session"""
        if not request.employee_id:
            raise HTTPException(status_code=400, detail="Employee ID is required")
        
        session_id, first_question = self.create_session(request.employee_id)
        
        return ChatResponse(
            question=first_question,
            session_id=session_id
        )
    
    @modal.fastapi_endpoint(method="POST")
    def chat(self, request: ChatRequest, api_key: APIKey = Depends(get_api_key)):
        """Process a chat message and return the next question or final analysis"""
        if not request.session_id:
            raise HTTPException(status_code=400, detail="Session ID is required")
        
        try:
            return self.process_chat(request.message, request.session_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")
    
    @modal.fastapi_endpoint(method="GET")
    def check_api_key(self, api_key: APIKey = Depends(get_api_key)):
        """Simple endpoint to check if API key is valid"""
        return {"status": "success", "message": "API key is valid"}

@stub.local_entrypoint()
def main():
    """Run a local web server for API testing"""
    from flask import Flask, request, jsonify
    from flask_cors import CORS

    app = Flask(__name__)
    CORS(app, resources={
        r"/*": {
            "origins": "*",  # Allow all origins (or specify your frontend URL)
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "X-API-Key"]
        }
    })
    bot = ChatBot()
    
    print("\n" + "=" * 60)
    print("EMPLOYEE SENTIMENT ANALYSIS API SERVER")
    print("=" * 60)
    print(f"\nAPI Key: {DEFAULT_API_KEY}")
    print("Include this API key in your requests as the 'X-API-Key' header")
    print("\nAvailable endpoints:")
    print("  POST /start_chat - Start a new conversation")
    print("  POST /chat - Send messages in an existing conversation")
    print("\nExample curl commands:")
    print(f'  curl -X POST http://localhost:8000/start_chat \\')
    print(f'    -H "Content-Type: application/json" \\')
    print(f'    -H "X-API-Key: {DEFAULT_API_KEY}" \\')
    print(f'    -d \'{{"employee_id": "EMP123"}}\'')
    print("\nFor website integration, include the API endpoints in your JavaScript.")
    print("=" * 60 + "\n")
    
    @app.route('/start_chat', methods=['POST', 'OPTIONS'])
    def start_chat_endpoint():
        # CORS preflight
        if request.method == 'OPTIONS':
            return handle_options()
            
        # Check API key
        api_key = request.headers.get('X-API-Key')
        if api_key != DEFAULT_API_KEY:
           response = jsonify({"error": "Invalid API key"})
           response.headers.add('Access-Control-Allow-Origin', '*')
           return response, 403
            
        data = request.json
        employee_id = data.get('employee_id')
        if not employee_id:
            response = jsonify({"error": "Employee ID is required"})
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response, 400
            
        session_id, question = bot.create_session(employee_id)
        print(f"New session created: {session_id} for employee {employee_id}")
        response = jsonify({"session_id": session_id, "question": question})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    @app.route('/chat', methods=['POST', 'OPTIONS'])
    def chat_endpoint():
        # CORS preflight
        if request.method == 'OPTIONS':
            return handle_options()
            
        # Check API key
        api_key = request.headers.get('X-API-Key')
        if api_key != DEFAULT_API_KEY:
            return jsonify({"error": "Invalid API key"}), 403
            
        data = request.json
        message = data.get('message')
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({"error": "Session ID is required"}), 400
            
        try:
            print(f"Processing message for session {session_id}: '{message[:30]}...'")
            result = bot.process_chat(message, session_id)
            
            # Log if final analysis was generated
            if result.final_analysis:
                print(f"Final analysis generated for {result.final_analysis.get('employee_id', 'unknown')}")
                
            return jsonify({
                "session_id": result.session_id,
                "question": result.question,
                "final_analysis": result.final_analysis
            })
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            return jsonify({"error": str(e)}), 500
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Simple health check endpoint"""
        return jsonify({"status": "healthy", "message": "API is running"})
    
    def handle_options():
        """Handle CORS preflight requests"""
        response = jsonify({"status": "ok"})
        return response
    
    @app.route('/test-cors', methods=['POST', 'OPTIONS'])
    def test_cors_endpoint():
        """Simple endpoint to test CORS handling"""
        if request.method == 'OPTIONS':
            return handle_options()
    
    # Return success for any request
        response = jsonify({"status": "success", "message": "CORS is working!"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
# Add CORS headers to all responses - FIX: moved outside previous function

    
    print("\nStarting web server on http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=False)