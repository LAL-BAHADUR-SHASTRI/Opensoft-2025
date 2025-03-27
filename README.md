# Opensoft-2025

## Backend Setup

### Prerequisites
Ensure you have the following installed:
- Python 3.8 or higher
- PostgreSQL
- Git

### Installation

#### Clone the Repository:
```sh
git clone https://github.com/LAL-BAHADUR-SHASTRI/Opensoft-2025
cd Opensoft-2025
```

#### Create and Activate a Virtual Environment:
```sh
python -m venv venv
source venv/bin/activate  # On macOS/Linux
venv\Scripts\activate     # On Windows
```

#### Install Dependencies:
```sh
pip install -r requirements.txt
```

## Database Setup

### Local Development Database
1. Create a PostgreSQL database:
   ```sh
   createdb vibemeter
   ```
2. Configure your environment variables in `.env`.

### Docker Database Setup
If using Docker, run:
```sh
docker-compose up -d
```

## Database Migrations
We use SQLAlchemy's declarative models for database management.

### Initialize Database
Run the initialization script to create all tables and add an HR user:
```sh
python initialize_db.py
```
This script:
- Creates all database tables based on SQLAlchemy models.
- Adds an HR user (`username: hruser`, `password: hruser`).
- Adds a sample employee (`username: emp0048`, `password: emp0048`).

### Manual Migrations
If you need to modify the database schema:
1. Update the model definitions in `app/models/`
2. Recreate the database tables:
   ```sh
   python reset_db.py
   ```

## Running the Application

### Development Mode
```sh
uvicorn main:app --reload
```

### Production Mode
```sh
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Authentication
- `POST /token` - Login to get access token
- `GET /users/me` - Get current user information

### Data Management
- `POST /upload-csv/` - Upload CSV files (HR role required)
- `POST /create-users/` - Create user accounts from employee data in CSV files (HR role required)
- `GET /tables/` - Get list of all tables and record counts
- `GET /tables/{table_name}` - Get data from a specific table
- `GET /tables/{table_name}/{employee_id}` - Get data for a specific employee from a table

## CSV Data Import
The system supports importing data from CSV files:
1. Log in as an HR user.
2. Use the `/upload-csv/` endpoint to upload CSV files.
3. After upload, use the `/create-users/` endpoint to create user accounts for all employee IDs.

### Supported CSV files:
- `activity_tracker_dataset.csv`
- `leave_dataset.csv`
- `onboarding_dataset.csv`
- `performance_dataset.csv`
- `rewards_dataset.csv`
- `vibemeter_dataset.csv`

Sample CSV files are available in the `data` directory.

## Environment Variables
Create a `.env` file in the Backend directory with these variables:
```env
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your_secret_key
```

### Database URL Format
| Component  | Example     | Description          |
|------------|------------|----------------------|
| username   | postgres   | Database user       |
| password   | your_password | Database password |
| host       | localhost  | Server address      |
| port       | 5432       | PostgreSQL port     |
| database   | vibemeter  | Database name       |

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running.
- Verify database credentials in `.env`.
- If using Docker, ensure the `db` service is running.

### CSV Upload Issues
- Ensure the CSV headers match the expected format.
- Verify the HR user has the correct permissions.
- Check the logs for detailed error messages.

---

### License
This project is licensed under the MIT License.

