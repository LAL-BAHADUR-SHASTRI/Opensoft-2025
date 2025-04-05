import json
import logging
import os
import uuid
import traceback  # Add this import for stack trace logging
from datetime import datetime, timezone, timedelta, date
from typing import Dict, Any, List, Optional
import requests
import random  # Add this import for personalized messages
from fastapi import HTTPException
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.chat import ChatMessage  # Changed from ChatMessageModel

logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling employee chatbot interactions"""

    def __init__(self, db: Session):
        self.db = db
        
        # API configuration
        self.api_endpoints = {
            'check_api_key': 'https://mybooi097--employee-sentiment-analysis-chatbot-check-api-key.modal.run',
            'start_chat': 'https://mybooi097--employee-sentiment-analysis-chatbot-start-chat.modal.run',
            'chat': 'https://mybooi097--employee-sentiment-analysis-chatbot-chat.modal.run'
        }
        
        # Default API key - in production this should be loaded from environment variables
        self.api_key = "DVaz_Aa2FLTZA-PA_oJlwbXt2GeK8Hf8CJSTsFnS-UA"
        
        # HTTP headers
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Key': self.api_key
        }
    
    def start_chat(self, employee_id: str) -> Dict[str, Any]:
        """Start a new chat session for an employee"""
        logger.info(f"Starting chat for employee {employee_id}")
        
        try:
            # Call the chatbot API to start a session
            response = requests.post(
                self.api_endpoints['start_chat'],
                headers=self.headers,
                json={'employee_id': employee_id}
            )
            response.raise_for_status()
            result = response.json()
            
            # Create database record for this message
            chat_message = ChatMessage(  # Changed from ChatMessageModel
                session_id=result['session_id'],
                employee_id=employee_id,
                is_from_user=False,
                question=result['question'],
                timestamp=datetime.now(timezone.utc)
            )
            
            self.db.add(chat_message)
            
            # Also update user's last_chat_date
            user = self.db.query(User).filter(User.employee_id == employee_id).first()
            if user:
                user.last_chat_date = datetime.now(timezone.utc)
                
            self.db.commit()
            
            return {
                "session_id": result['session_id'],
                "question": result['question'],
                "timestamp": chat_message.timestamp
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"ChatAPI error: {str(e)}")
        except Exception as e:
            logger.error(f"Error starting chat: {str(e)}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Error starting chat: {str(e)}")
    
    def process_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Process a chat message and get the next question or final analysis"""
        logger.info(f"Processing message for session {session_id}")
        
        # First, get the employee ID and most recent question from the session
        last_question = self.db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id,
            ChatMessage.is_from_user == False  # This is a bot question
        ).order_by(ChatMessage.timestamp.desc()).first()
        
        if not last_question:
            raise HTTPException(status_code=404, detail="Chat session or question not found")
        
        employee_id = last_question.employee_id
        
        try:
            # Update the last question with the user's response
            last_question.response = message
            self.db.flush()
            
            # Call the chatbot API
            response = requests.post(
                self.api_endpoints['chat'],
                headers=self.headers,
                json={
                    'session_id': session_id,
                    'message': message
                }
            )
            response.raise_for_status()
            result = response.json()
            
            # Process API response
            if 'question' in result and result['question']:
                # Create a new record for the bot's next question
                bot_message = ChatMessage(
                    session_id=session_id,
                    employee_id=employee_id,
                    is_from_user=False,
                    question=result['question'],
                    timestamp=datetime.now(timezone.utc)
                )
                
                self.db.add(bot_message)
                self.db.commit()
                
                return {
                    "session_id": session_id,
                    "question": result['question'],
                    "timestamp": bot_message.timestamp
                }
                
            elif 'final_analysis' in result and result['final_analysis']:
                # We have a final analysis - process it and update user record
                self._process_final_analysis(employee_id, result['final_analysis'])
                
                # Commit the last question update
                self.db.commit()
                
                personalized_messages = [
                    "Thank you for sharing your thoughts! Your feedback is incredibly valuable and helps us improve.",
                    "We truly appreciate your candid feedback! Your insights will help shape a better workplace.",
                    "Thank you for your thoughtful response! Your perspective matters greatly to us.",
                    "We've received your feedback—thank you for taking the time to share your thoughts with us!",
                    "Your input is invaluable! Thank you for helping us understand what matters to you."
                ]


                return {
                    "session_id": session_id,
                    "question": random.choice(personalized_messages),
                    "final_analysis": result['final_analysis'],
                    "timestamp": datetime.now(timezone.utc)
                }
            
            else:
                # Unexpected response format, but still commit the user message
                logger.warning(f"Unexpected API response format: {result}")
                self.db.commit()
                
                personalized_messages = [
                    "Thank you for sharing your thoughts! Your feedback is incredibly valuable and helps us improve.",
                    "We truly appreciate your candid feedback! Your insights will help shape a better workplace.",
                    "Thank you for your thoughtful response! Your perspective matters greatly to us.",
                    "We've received your feedback—thank you for taking the time to share your thoughts with us!",
                    "Your input is invaluable! Thank you for helping us understand what matters to you."
                ]
                
                return {
                    "session_id": session_id,
                    "question": random.choice(personalized_messages),
                    "timestamp": datetime.now(timezone.utc)
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"ChatAPI error: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")
    
    def _process_final_analysis(self, employee_id: str, analysis: Dict[str, Any]) -> None:
        """Process final analysis and update user record and vibe meter"""
        logger.info(f"Processing final analysis for employee {employee_id}")
        
        try:
            # Find the user 
            user = self.db.query(User).filter(User.employee_id == employee_id).first()
            
            if user:
                # Update user mood and chat dates
                current_mood = analysis.get('overall_assessment')
                user.current_mood = current_mood
                user.last_chat_date = datetime.now(timezone.utc)
                
                # Calculate next chat date
                if 'next_interaction' in analysis and analysis['next_interaction']:
                    try:
                        next_chat = datetime.strptime(analysis['next_interaction'], "%Y-%m-%d")
                        user.next_chat_date = next_chat
                    except ValueError:
                        logger.warning(f"Invalid date format for next_interaction: {analysis['next_interaction']}")
                        # Default to 7 days from now
                        user.next_chat_date = datetime.now(timezone.utc) + timedelta(days=7)
                else:
                    # Default to 7 days from now
                    user.next_chat_date = datetime.now(timezone.utc) + timedelta(days=7)
                
                user.escalation_reason = analysis.get('escalation_reason', 'No specific reason provided')
                # Set HR escalation flags if needed
                if 'hr_escalation' in analysis and analysis['hr_escalation']:
                    user.hr_escalation = True
                
                # Get explanation/comments for vibe meter
                mood_explanation = analysis.get('mood_explanation', '')
                if not mood_explanation and 'escalation_reason' in analysis:
                    mood_explanation = analysis.get('escalation_reason')
                
                # Create entry in VibeMeter table with appropriate mood score
                from app.models.vibemeter import VibeMeter
                
                vibe_entry = VibeMeter(
                    employee_id=employee_id,
                    date=datetime.now(timezone.utc).date(),
                    mood_score=self._convert_mood_to_score(current_mood),
                    comments=current_mood
                )
                
                self.db.add(vibe_entry)
                self.db.commit()
                
                logger.info(f"Updated user record and added vibe meter entry for {employee_id}")
            else:
                logger.warning(f"User not found for employee ID: {employee_id}")
        
        except Exception as e:
            logger.error(f"Error updating records with final analysis: {str(e)}")
            logger.error(f"Stack trace: {traceback.format_exc()}")
            self.db.rollback()
            # We don't re-raise the exception here to avoid breaking the chat flow

    def _convert_mood_to_score(self, mood: str) -> int:
        """Convert mood string to numeric score for the vibe_meter table"""
        # Scale: Happy Zone (1) to Frustrated Zone (6)
        mood_scores = {
            "Happy Zone": 1,  # Changed from 5 to 1
            "Leaning to Happy Zone": 2,  # Changed from 4 to 2
            "Neutral Zone (OK)": 3,
            "Leaning to Sad Zone": 4,  # Changed from 2 to 4
            "Sad Zone": 5,    # Changed from 1 to 5
            "Frustrated Zone": 6  # Changed from 1 to 6
        }
        
        # Default to neutral if mood is unknown
        return mood_scores.get(mood, 3)
    
    def get_chat_history(self, employee_id: str, chat_date: Optional[date] = None):
        """Get chat history for an employee"""
        logger.info(f"Getting chat history for employee {employee_id}")
        
        try:
            # Base query for getting messages for this employee
            query = self.db.query(ChatMessage).filter(
                ChatMessage.employee_id == employee_id
            )
            
            # Apply date filter if provided
            if chat_date:
                query = query.filter(
                    func.date(ChatMessage.timestamp) == chat_date
                )
            
            # Get all messages
            messages = query.order_by(ChatMessage.timestamp).all()
            
            # Group messages by session_id
            sessions = {}
            for msg in messages:
                if msg.session_id not in sessions:
                    sessions[msg.session_id] = {
                        "session_id": msg.session_id,
                        "messages": [],
                        "start_time": msg.timestamp,
                        "end_time": msg.timestamp
                    }
                
                # Add message to session
                message_dict = {
                    "timestamp": msg.timestamp,
                    "is_from_user": msg.is_from_user,
                }
                
                if msg.is_from_user:
                    message_dict["response"] = msg.response
                else:
                    message_dict["question"] = msg.question
                
                if msg.sentiment:
                    message_dict["sentiment"] = msg.sentiment
                
                if msg.keywords:
                    message_dict["keywords"] = msg.keywords
                
                sessions[msg.session_id]["messages"].append(message_dict)
                
                # Update session end time if this message is later
                if msg.timestamp > sessions[msg.session_id]["end_time"]:
                    sessions[msg.session_id]["end_time"] = msg.timestamp
            
            # Convert to list and sort by start_time (newest first)
            history = list(sessions.values())
            history.sort(key=lambda x: x["start_time"], reverse=True)
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting chat history: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")
    
    def get_chat_dates(self, employee_id: str) -> List[str]:
        """Get distinct dates on which the employee had chats"""
        logger.info(f"Getting chat dates for employee {employee_id}")
        
        try:
            # Query for distinct dates
            results = self.db.query(
                func.date(ChatMessage.timestamp).label('chat_date')
            ).filter(
                ChatMessage.employee_id == employee_id
            ).distinct().all()
            
            # Convert results to list of ISO format strings
            dates = [row.chat_date.isoformat() for row in results]
            return dates
            
        except Exception as e:
            logger.error(f"Error getting chat dates: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving chat dates: {str(e)}")
    
    def clear_escalation(self, employee_id: str) -> Dict[str, Any]:
        """Clear HR escalation flag for an employee"""
        logger.info(f"Clearing HR escalation for employee {employee_id}")
        
        try:
            # Find the user
            user = self.db.query(User).filter(User.employee_id == employee_id).first()
            
            if not user:
                raise HTTPException(status_code=404, detail=f"User not found for employee ID: {employee_id}")
            
            # Clear escalation flags
            user.hr_escalation = False
            user.escalation_reason = None
            
            self.db.commit()
            
            return {
                "success": True,
                "message": f"HR escalation cleared for employee {employee_id}",
                "employee_id": employee_id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error clearing HR escalation: {str(e)}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Error clearing HR escalation: {str(e)}")