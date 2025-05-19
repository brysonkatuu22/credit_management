FINTACK: DIGITALIZING CREDIT LOAN MANAGEMENT

Overview
The Credit Loan Management Portal is a full-stack web application designed to help users monitor their credit scores, manage multiple loan accounts, and generate credit reports. It leverages Machine Learning (ML) for credit scoring, Natural Language Processing (NLP) for sentiment analysis, and Robotic Process Automation (RPA) for automation tasks such as sending payment reminders and generating reports.

Contributors
•	Bryson Katuu
•	Ian Kones
•	Tania Maina

Features
User Authentication
•	Secure user registration and login using JWT authentication.
•	Authentication managed via Django backend with React frontend.

Dashboard
•	Displays user's credit score with a visual gauge.
•	Provides insights into financial health and creditworthiness.

Loan Accounts
•	Lists all pending loans from different platforms.
•	Data integration from Kaggle datasets.

Credit Report
•	Users can request a detailed credit report.
•	Reports are emailed to the user upon request.

Learn More
•	Offers insights on sentiment analysis and financial tips using NLP techniques.

Technology Stack
Backend
•	Django & Django REST Framework (DRF)
•	PostgreSQL (Database)
•	Machine Learning Models for credit scoring
•	RPA for automation tasks
Frontend
•	React.js with Tailwind CSS for styling
•	React Router for navigation
•	Axios for API communication

Setup Instructions
Backend Setup
1.	Clone the repository: 
2.	git clone https://github.com/your-username/credit-loan-management.git
3.	cd credit-loan-management/backend
4.	Create a virtual environment and install dependencies: 
5.	python -m venv venv
6.	source venv/bin/activate  # On Windows use `venv\Scripts\activate`
7.	pip install -r requirements.txt
8.	Apply migrations and run the server: 
9.	python manage.py migrate
10.	python manage.py runserver

Frontend Setup
1.	Navigate to the frontend directory: 
2.	cd ../frontend
3.	Install dependencies: 
4.	npm install
5.	Start the React development server: 
6.	npm run dev


Future Enhancements
•	Implement AI-powered financial recommendations.
•	Add multi-factor authentication (MFA) for enhanced security.
•	Expand loan integration sources beyond Kaggle datasets.

