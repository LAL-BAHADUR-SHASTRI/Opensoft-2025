FROM python:3.10-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
   build-essential \
   && apt-get clean \
   && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Explicitly use pip3 to install dependencies
RUN pip3 install --no-cache-dir -r requirements.txt \
   && pip3 install python-jose[cryptography] passlib[bcrypt] python-multipart

# Copy the rest of the application code
COPY . .

# Ensure the script is executable (in case Windows line endings cause issues)
RUN sed -i 's/\r$//' start.sh && \
   chmod +x start.sh

# Define the command to execute on container startup
CMD ["/app/start.sh"]

# Expose the application port
EXPOSE 8000