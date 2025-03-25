import sqlite3

def get_database_connection():
    conn = sqlite3.connect("chatbot.db", check_same_thread=False)
    return conn
