import requests
import json
import time
import sys
import os
from dotenv import load_dotenv

load_dotenv()

class ChatbotClient:
    """Client for interacting with the Modal-deployed chatbot API."""
    
    def __init__(self, api_key=None):
        """Initialize the client with API endpoints and key."""
        # API endpoints
        self.endpoints = {
'check_api_key': os.getenv("CHECK_API_KEY", "https://harshrajdubey-swg--chatbot-chatbot-check-api-key.modal.run"),
'start_chat': os.getenv("START_CHAT", "https://harshrajdubey-swg--chatbot-chatbot-start-chat.modal.run"),
'chat': os.getenv("CHAT", "https://harshrajdubey-swg--chatbot-chatbot-chat.modal.run")
                    }
        
        # Default API key
        self.api_key = api_key or "DVaz_Aa2FLTZA-PA_oJlwbXt2GeK8Hf8CJSTsFnS-UA"
        
        # HTTP headers
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Key': self.api_key
        }
    
    def verify_api_key(self):
        """Verify if the API key is valid."""
        print("Verifying API key...")
        try:
            response = requests.get(
                self.endpoints['check_api_key'],
                headers=self.headers,
                timeout=10  # Add a timeout
            )
            
            if response.status_code == 200:
                print("API key is valid!")
                return True
            else:
                print(f"API key verification failed: {response.status_code}")
                print(response.text)
                return False
        except requests.exceptions.Timeout:
            print("API key verification timed out. Using default key.")
            # Consider the key valid if it's the default one
            return self.api_key == "DVaz_Aa2FLTZA-PA_oJlwbXt2GeK8Hf8CJSTsFnS-UA"
        except Exception as e:
            print(f"Error connecting to API: {str(e)}")
            return False
    
    def start_chat(self, employee_id):
        """Start a chat session with the employee."""
        try:
            # Call the chatbot API to start a session
            response = requests.post(
                self.endpoints['start_chat'],
                headers=self.headers,
                json={'employee_id': employee_id}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error starting chat: {str(e)}")
            return None

    def send_message(self, session_id, message):
        """Send a message to an existing chat session."""
        try:
            # Call the chatbot API to continue the conversation
            response = requests.post(
                self.endpoints['chat'],
                headers=self.headers,
                json={'session_id': session_id, 'message': message}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error sending message: {str(e)}")
            return None
    
    def format_analysis(self, analysis):
        """Format the final analysis for display."""
        output = "\n" + "="*50 + "\n"
        output += "FINAL ANALYSIS\n"
        output += "="*50 + "\n\n"
        
        output += f"Overall Sentiment: {analysis.get('overall_sentiment', 'Not available')}\n\n"
        
        if 'key_concerns' in analysis and analysis['key_concerns']:
            output += "Key Concerns:\n"
            for concern in analysis['key_concerns']:
                output += f"- {concern}\n"
            output += "\n"
        
        if 'sentiment_breakdown' in analysis:
            output += "Sentiment Breakdown:\n"
            for category, value in analysis['sentiment_breakdown'].items():
                output += f"- {category}: {value}\n"
            output += "\n"
        
        if 'hr_escalation_needed' in analysis:
            escalation = "Yes" if analysis['hr_escalation_needed'] else "No"
            output += f"HR Escalation Needed: {escalation}\n"
            if analysis['hr_escalation_needed'] and 'escalation_reason' in analysis:
                output += f"Reason: {analysis['escalation_reason']}\n"
            output += "\n"
        
        if 'recommended_actions' in analysis and analysis['recommended_actions']:
            output += "Recommended Actions:\n"
            for action in analysis['recommended_actions']:
                output += f"- {action}\n"
            output += "\n"
        
        if 'next_scheduled_interaction' in analysis:
            output += f"Next Scheduled Interaction: {analysis['next_scheduled_interaction']}\n"
        
        return output

    def run_interactive_session(self):
        """Run an interactive chat session."""
        print("\n" + "="*50)
        print("EMPLOYEE SENTIMENT ANALYSIS CHATBOT")
        print("="*50 + "\n")
        
        # Verify API key
        if not self.verify_api_key():
            print("API key validation failed. Exiting...")
            return
        
        # Get employee ID
        employee_id = input("Enter employee ID: ")
        if not employee_id:
            print("Employee ID is required. Exiting...")
            return
        
        # Start chat
        response = self.start_chat(employee_id)
        if not response or 'session_id' not in response:
            print("Failed to start chat. Exiting...")
            return
        
        session_id = response['session_id']
        
        # Display first question
        if 'question' in response and response['question']:
            print(f"\nChatbot: {response['question']}")
        
        # Main chat loop
        while True:
            user_input = input("\nYou: ")
            
            # Allow user to exit
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("Ending chat session...")
                break
            
            # Send message
            result = self.send_message(session_id, user_input)
            if not result:
                print("Error in communication. Ending session...")
                break
            
            # Check if we have a final analysis
            if 'final_analysis' in result and result['final_analysis']:
                print("\nChatbot: Thank you for your responses!")
                print(self.format_analysis(result['final_analysis']))
                break
            
            # Display next question
            if 'question' in result and result['question']:
                print(f"\nChatbot: {result['question']}")
            else:
                print("\nChatbot: No more questions. Thank you!")
                break
    def format_analysis(self, analysis):
        """Format the final analysis for display."""
        output = "\n" + "="*50 + "\n"
        output += "FINAL ANALYSIS\n"
        output += "="*50 + "\n\n"
        
        # Field name mapping
        output += f"Overall Sentiment: {analysis.get('overall_assessment', 'Not available')}\n\n"
        
        # Use key_themes instead of key_concerns
        if 'key_themes' in analysis and analysis['key_themes']:
            output += "Key Concerns:\n"
            for concern in analysis['key_themes']:
                output += f"- {concern}\n"
            output += "\n"
        
        # Display top keywords
        if 'top_keywords' in analysis and analysis['top_keywords']:
            output += "Key Topics:\n"
            for keyword in analysis['top_keywords']:
                output += f"- {keyword}\n"
            output += "\n"
        
        # Sentiment distribution
        if 'sentiment_distribution' in analysis:
            output += "Sentiment Breakdown:\n"
            for category, value in analysis['sentiment_distribution'].items():
                output += f"- {category}: {value}\n"
            output += "\n"
        
        # HR escalation (field name changed)
        if 'hr_escalation' in analysis:
            escalation = "Yes" if analysis['hr_escalation'] else "No"
            output += f"HR Escalation Needed: {escalation}\n"
            if analysis['hr_escalation'] and 'escalation_reason' in analysis:
                output += f"Reason: {analysis['escalation_reason']}\n"
            output += "\n"
        
        # Add mood explanation
        if 'mood_explanation' in analysis:
            output += f"Assessment: {analysis['mood_explanation']}\n\n"
        
        # Next scheduled interaction
        if 'next_interaction' in analysis:
            output += f"Next Scheduled Interaction: {analysis['next_interaction']}\n"
        
        return output
if __name__ == "__main__":
    # Create client and run interactive session
    client = ChatbotClient()
    client.run_interactive_session()