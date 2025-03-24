import os
import csv
import re
import torch
import pandas as pd
from datetime import datetime, timedelta
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import modal
import json
import ast
import readline

# Setup Modal
app = modal.App("employee-sentiment-analysis")
stub = app
image = modal.Image.debian_slim().pip_install(["transformers", "torch", "pandas"])

# Configuration 
# File paths
FEEDBACK_FILE = "employee_feedback.csv"
ESCALATION_FILE = "hr_escalations.csv"
SCHEDULE_FILE = "interaction_schedule.csv"

def init_csv():
    for file, headers in [
        (FEEDBACK_FILE, ["employee_id", "question", "response", "sentiment", "reason", "date"]),
        (ESCALATION_FILE, ["employee_id", "escalation_reason", "date"]),
        (SCHEDULE_FILE, ["employee_id", "next_interaction"])
    ]:
        if not os.path.exists(file):
            pd.DataFrame(columns=headers).to_csv(file, index=False)
            print(f"Created {file}")

def save_response(employee_id, question, response, sentiment, reason):
    new_entry = {
        "employee_id": employee_id,
        "question": question,
        "response": response,
        "sentiment": sentiment,
        "reason": reason,
        "date": datetime.now().strftime("%Y-%m-%d")
    }
    df = pd.read_csv(FEEDBACK_FILE)
    df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
    df.to_csv(FEEDBACK_FILE, index=False)
    print(f"Saved response: {sentiment} - {reason}")

def check_and_escalate(employee_id):
    df = pd.read_csv(FEEDBACK_FILE)
    cutoff_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    recent_feedback = df[
        (df["employee_id"] == employee_id) &
        (df["sentiment"].isin(["Sad Zone", "Leaning to Sad Zone", "Frustrated Zone"])) &
        (df["date"] >= cutoff_date)
    ]
    if len(recent_feedback) >= 3:
        escalation_df = pd.read_csv(ESCALATION_FILE)
        new_esc = {
            "employee_id": employee_id,
            "escalation_reason": "Repeated negative sentiment detected",
            "date": datetime.now().strftime("%Y-%m-%d")
        }
        escalation_df = pd.concat([escalation_df, pd.DataFrame([new_esc])], ignore_index=True)
        escalation_df.to_csv(ESCALATION_FILE, index=False)
        print(f"\n[ALERT] HR has been notified about employee ID {employee_id}")

def update_interaction_schedule(employee_id, sentiment):
    days = 7
    if sentiment in ["Sad Zone", "Leaning to Sad Zone", "Frustrated Zone"]:
        days = 1
    elif sentiment in ["Neutral Zone (OK)", "Leaning to Happy Zone"]:
        days = 3
    next_date = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    df = pd.read_csv(SCHEDULE_FILE)
    if employee_id in df["employee_id"].values:
        df.loc[df["employee_id"] == employee_id, "next_interaction"] = next_date
    else:
        new_entry = {"employee_id": employee_id, "next_interaction": next_date}
        df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
    df.to_csv(SCHEDULE_FILE, index=False)
    print(f"Updated schedule: next interaction in {days} days")

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


@stub.function(
    image=image,
    secrets=[modal.Secret.from_name("huggingface-token")]
)
def analyze_emotion_and_reason(response):
    from transformers import pipeline
    try:
        sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
        result = sentiment_analyzer(response)
        raw_sentiment = result[0]['label']
        sentiment_score = result[0]['score']

        if raw_sentiment == "POSITIVE":
            sentiment = "Happy Zone" if sentiment_score > 0.75 else "Leaning to Happy Zone"
        else:
            if sentiment_score > 0.85:
                sentiment = "Sad Zone"
            elif sentiment_score > 0.7:
                sentiment = "Leaning to Sad Zone"
            elif "frustrat" in response.lower() or "anger" in response.lower():
                sentiment = "Frustrated Zone"
            else:
                sentiment = "Neutral Zone (OK)"

        positive_keywords = ["love", "enjoy", "great", "excellent", "fantastic", "happy", "satisfied", 
                           "content", "appreciate", "wonderful", "positive", "good", "well", "awesome"]
        if sentiment == "Neutral Zone (OK)":
            for keyword in positive_keywords:
                if keyword in response.lower():
                    sentiment = "Leaning to Happy Zone"
                    break

        reason_keywords = {
            "workload": "Work volume concerns",
            "stress": "Stress-related issues",
            "colleague": "Interpersonal dynamics",
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
            if keyword.lower() in response.lower():
                reason = explanation
                break

        return sentiment, reason
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        return 'Neutral Zone (OK)', 'Analysis failed'

@stub.function(
    image=image,
    secrets=[modal.Secret.from_name("huggingface-token")]
)
def select_next_question_remote(conversation_history):
    try:
        follow_up_questions = {
            "workload": [
                "How does your workload affect your work-life balance?",
                "Do you feel your workload is fairly distributed among your team?",
                "What would help you manage your workload better?"
            ],
            "stress": [
                "What are your main sources of stress at work?",
                "How do you typically cope with work-related stress?",
                "Does the company provide any resources to help with stress management?"
            ],
            "manager": [
                "How would you describe your relationship with your manager?",
                "Do you feel comfortable bringing concerns to your manager?",
                "How could your manager better support your work?"
            ],
            "colleague": [
                "Do you feel you can rely on your colleagues for support?",
                "How would you describe the communication within your team?",
                "Have you experienced any conflicts with colleagues?"
            ],
            "compensation": [
                "Do you feel your compensation reflects your contributions?",
                "How important is compensation compared to other aspects of your job?",
                "Are there additional benefits you wish the company offered?"
            ],
            "growth": [
                "Do you feel you have opportunities to grow in your role?",
                "What skills would you like to develop further?",
                "Where do you see yourself in the company in the next few years?"
            ],
            "balance": [
                "How do you maintain your work-life balance?",
                "Do you feel the company respects your personal time?",
                "What policies could improve work-life balance?"
            ]
        }
        matching_topics = []
        for topic in follow_up_questions.keys():
            if topic in conversation_history.lower():
                matching_topics.append(topic)
        
        if matching_topics:
            import random
            topic = random.choice(matching_topics)
            return random.choice(follow_up_questions[topic])
        
        general_questions = [
            "Could you elaborate more on that?",
            "How does that impact your overall job satisfaction?",
            "What changes would you suggest to improve this situation?"
        ]
        import random
        return random.choice(general_questions)
    except Exception as e:
        print(f"Question generation error: {str(e)}")
        return "Is there anything else you'd like to share about your work experience?"

def run_interactive_chatbot(employee_id):
    print("Chatbot: Hello! Let's discuss your work experience.")
    responses_data = []
    conversation_history = []
    GENERAL_QUESTIONS = get_expanded_questions()
    MAX_QUESTIONS = 15
    question_index = 0

    max_questions_per_sentiment = {
        "positive": 5,
        "neutral": 8,
        "negative": 12
    }
    current_max_questions = max_questions_per_sentiment["neutral"]

    while question_index < len(GENERAL_QUESTIONS) and question_index < current_max_questions:
        question = GENERAL_QUESTIONS[question_index]
        response = input(f"Chatbot: {question}\nYou: ")
        responses_data.append({
            "question": question,
            "response": response
        })
        conversation_history.append(f"Q: {question}\nA: {response}")

        sentiment, _ = analyze_emotion_and_reason.remote(response)
        
        if sentiment in ["Sad Zone", "Leaning to Sad Zone", "Frustrated Zone"]:
            current_max_questions = max_questions_per_sentiment["negative"]
        elif sentiment in ["Happy Zone", "Leaning to Happy Zone"]:
            current_max_questions = max_questions_per_sentiment["positive"]

        if question_index < current_max_questions - 1:
            print("Generating next question...")
            conv_text = "\n".join(conversation_history)
            next_q = select_next_question_remote.remote(conv_text)
            if next_q and next_q not in GENERAL_QUESTIONS:
                GENERAL_QUESTIONS.append(next_q)
        
        question_index += 1

    print("\nThank you for your responses! Analyzing your feedback...")
    sentiment_counts = {
        "Happy Zone": 0,
        "Leaning to Happy Zone": 0,
        "Neutral Zone (OK)": 0,
        "Leaning to Sad Zone": 0,
        "Sad Zone": 0,
        "Frustrated Zone": 0
    }
    reasons = []
    all_sentiments = []
    all_reasons = []

    for data in responses_data:
        question = data["question"]
        response = data["response"]
        sentiment, reason = analyze_emotion_and_reason.remote(response)
        
        sentiment_counts[sentiment] += 1
        reasons.append(reason)
        all_sentiments.append(sentiment)
        all_reasons.append(reason)
        save_response(employee_id, question, response, sentiment, reason)

    negative_count = (sentiment_counts["Sad Zone"] + 
                     sentiment_counts["Leaning to Sad Zone"] + 
                     sentiment_counts["Frustrated Zone"])
    positive_count = (sentiment_counts["Happy Zone"] + 
                     sentiment_counts["Leaning to Happy Zone"])

    if positive_count > negative_count * 2:
        sentiment_category = "Very Positive"
    elif positive_count > negative_count:
        sentiment_category = "Generally Positive"
    elif negative_count > positive_count * 2:
        sentiment_category = "Very Concerning"
    elif negative_count > positive_count:
        sentiment_category = "Needs Attention"
    else:
        sentiment_category = "Mixed"

    if negative_count >= 3:
        check_and_escalate(employee_id)

    next_days = 7
    if negative_count > positive_count:
        next_days = 1
    elif negative_count > 0:
        next_days = 3
    update_interaction_schedule(employee_id, sentiment_category)

    print("\n===== EMPLOYEE SENTIMENT ANALYSIS =====")
    print(f"Employee ID: {employee_id}")
    print(f"OVERALL ASSESSMENT: {sentiment_category.upper()}")
    print("\nSentiment Distribution:")
    for sentiment, count in sentiment_counts.items():
        if count > 0:
            percentage = (count / sum(sentiment_counts.values())) * 100
            print(f"  {sentiment}: {count} responses ({percentage:.1f}%)")
    print("\nKey Themes Identified:")
    for reason in set(reasons):
        print(f"  - {reason}")
    if negative_count >= 3:
        print("\n[ALERT] This employee has been flagged for HR attention.")
    print(f"\nNext scheduled interaction: {datetime.now() + timedelta(days=next_days)}")

@stub.local_entrypoint()
def main():
    init_csv()
    employee_id = input("Enter Employee ID: ")
    run_interactive_chatbot(employee_id)

if __name__ == "__main__":
    main()