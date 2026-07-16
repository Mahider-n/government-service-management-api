# Digital Government Service Management 

## Project Overview

The Digital Government Service Management system is a modern digital platform that streamlines the delivery of government services by providing citizens and administrators with an efficient, secure, and user-friendly experience.

Residents can apply for essential government services such as new National ID registration, National ID renewal, and birth certificate requests, upload the required supporting documents, and track the status of their applications in real time. Administrators can securely review applications, verify submitted documents, manage application status updates, and oversee registered users through a professional administrative dashboard.

The platform significantly reduces the need for in-person visits to government offices, minimizing long queues, unnecessary travel, paperwork, and administrative delays. By digitizing the entire application and review process, it improves service accessibility, increases transparency through real-time status tracking, accelerates processing times, and enhances communication between citizens and government agencies. This results in a more efficient, reliable, and citizen-centered public service experience.

---

##  What’s Included

- Secure JWT-based authentication and role-based access
- Application submission for new ID requests, renewals, and birth certificates
- Status tracking for applications
- Admin review flow for application status changes
- User profile update page
- Responsive, professional React UI integrated with the Django backend

 
---

## Backend API

The backend is built with Django and Django REST Framework and is exposed under the versioned API namespace:

- Authentication endpoints under /api/v1/auth/
- Application endpoints under /api/v1/applications/

### Authentication Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| POST | /api/v1/auth/register/ | Register a new user |
| POST | /api/v1/auth/login/ | Obtain JWT tokens |
| POST | /api/v1/auth/token/refresh/ | Refresh access tokens |
| GET | /api/v1/auth/users/ | List users (admin only) |
| GET/PATCH | /api/v1/auth/users/<id>/ | View or update a user profile |

### Application Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | /api/v1/applications/ | List applications for the current user or all users for admins |
| POST | /api/v1/applications/ | Submit a new application |
| PATCH | /api/v1/applications/<id>/ | Update an application status |
| DELETE | /api/v1/applications/<id>/ | Delete an application |

---

## Tech Stack

- Backend: Django, Django REST Framework
- Frontend: React + Vite
- Authentication: JWT
- Database: SQLite for development
- Email notifications: Django email backend

---

## Run the Project

### Backend

```bash
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

- backend logic and API routes live in the Django app folders
- the integrated web UI lives in the frontend/ directory
- API documentation and sample requests are available in the postman/ folder

```bash
postman/management-system.postman_collection.json
```

- To use it:

  - Open Postman → Click Import → Select File → Choose the .json file.

  - All API endpoints will be available for testing immediately.

---

## Deployment (Render)

The backend is deployed on Render and is available at:

**Live URL:** [https://kebele-management-api.onrender.com](https://kebele-management-api.onrender.com)

- Make sure `ALLOWED_HOSTS` in `settings.py` includes your Render domain.
- Static files have been collected using:

```bash
python manage.py collectstatic --noinput
```
## Testing Endpoints on Render

- Use Postman to test all endpoints:

1. Import the Postman collection:
```bash
postman/management-system.postman_collection.json
```

2. Update the base URL to:
```bash
https://kebele-management-api.onrender.com
```

3. Test all API endpoints (User CRUD, Application CRUD) live.

- Or use curl in terminal:
```bash
curl https://kebele-management-api.onrender.com/
```

- Should return:
```bash
{"message": "Kebele Management API is live!"}
```
---

## ⚡ Installation & Setup (Local)

1. Clone the repository:

```bash

git clone <repo-url>
cd government-service-management-api

```

2. Create a virtual environment and activate it:

```bash

python -m venv venv
source venv/bin/activate   # Linux/macOS
venv\Scripts\activate      # Windows

```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Apply migrations:

```bash

python manage.py migrate
```

5. Create a superuser (admin):

```bash

python manage.py createsuperuser
```

6. Run the development server:

```bash

python manage.py runserver
```
