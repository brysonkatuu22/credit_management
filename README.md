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
2.	cd credit_management-main/
3.	remove restrictions by running 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser'
4.	run 'python manage.py runserver'

Frontend Setup

Open a new terminal, do not terminate the backend terminal started above

1.	Navigate to the frontend directory: 
2.	cd credit_management/credit_frontend
3.  Ensure Node.js and npm are Installed
4.  run node -v, and npm -v. If these commands return version numbers, Node.js and npm are installed.
5.	if not there, navigate cd credit_management/credit_frontend and run npm install, and install node.js as well.
6.	If npm install doesn’t fix it, install Vite manually: 'npm install vite --save-dev'
7. npm run dev
8. click on the host link : http://localhost:5173/


Future Enhancements
•	Implement AI-powered financial recommendations.
•	Add multi-factor authentication (MFA) for enhanced security.
•	Expand loan integration sources beyond Kaggle datasets.

