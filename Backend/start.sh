#!/bin/bash
echo "Initializing database..."
python3 init_db.py
echo "Starting application server..."
python3 run.py