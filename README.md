# 🏛️ Digital Government Service Management API

## 📘 Project Overview

The **Digital Citizen Service Management API** is a backend system designed to streamline citizen service requests and administrative document workflows through a secure RESTful API.

The platform enables users to submit applications for essential services such as issuing **national IDs**, **birth certificates**, and upload required supporting documents, track application status, and receive notifications when requests are processed.
  
For administrators, it offers tools for managing applications, tracking service workflows, and sending notifications when documents are ready.  
Overall, it reduces in-person visits, enhances operational efficiency, and improves transparency in local government services.

---
## Engineering Highlights

- Designed RESTful APIs using Django REST Framework
- Implemented JWT authentication and role-based permissions
- Built document submission workflows with status tracking
- Implemented automated email notifications using Django email services
- Created production-ready API structure with versioned endpoints
- Deployed backend using Render
---

## 🌐 Features

### 👥 User-Facing Features (Resident Portal)

#### 🧭 Service Information Hub

- Detailed guides on available services, including:
  - Application procedures for a **new ID**.
  - Renewal process for **existing IDs**.
  - Steps to obtain **birth certificates**.
- Information on **requirements** and **processing timelines** for each service.

#### 📝 Online Registration

- Users can submit applications by providing personal details (name, address, contact info).
- Upload required documents such as photos and proofs.

#### ⏳ Status Tracking

- Real-time updates on application status (e.g., `Pending Review`, `Rejected`, `Ready for Pickup`).

#### 🔔 Notifications

- Automated email notifications when:
  - Documents are ready for pickup.
  - Additional information is required.

#### 🔐 User Authentication

- Secure **login/signup** using email or phone number.
- Includes **password reset** functionality.

#### 🔍 Search and FAQ

- Searchable knowledge base for quick answers to common questions.

---

### 🧑‍💼 Admin-Facing Features (Dashboard)

#### 📊 Dashboard Overview

- Displays metrics such as:
  - Number of applications per service.
  - Names of all applicants and their corresponding information/files.

#### 🗃️ Application Management

- View, review, approve, or reject applications.

#### 📧 User Notification System

- Admins can send notifications via email (e.g., _“Your ID is ready – please visit nearby local office.”_).

#### 📈 Reporting Tools

- Generate reports on service usage:
  - Daily/weekly registrations.
  - Completion rates.
  - User demographics.

#### 🧑‍🔧 Admin Authentication

- Role-based access control:
  - **Super Admin** (for office heads/ managers)
  - **Staff** (for processing tasks)

---

### ⚙️ General Features

- **📱 Responsive Design**: Mobile-friendly for users with limited desktop access.
- **🛡️ Security Measures**: Data encryption and audit logging for key actions.

---

## 🧩 APIs and Technologies

### 🖥️ Backend API

The backend is implemented as a **RESTful API** using:

- **Python (Django + Django REST Framework)**
- Versioned endpoints under `/api/v1/`

Two main modules:

- **Authentication (users)**
- **Applications (services)**

---

### 🔑 Authentication Endpoints (`/api/v1/auth/`)

| Method | Endpoint          | Description                            |
| ------ | ----------------- | -------------------------------------- |
| `POST` | `/register/`      | Register a new user                    |
| `POST` | `/login/`         | Obtain JWT access and refresh tokens   |
| `POST` | `/token/refresh/` | Refresh an expired access token        |
| `GET`  | `/users/`         | List all registered users (admin only) |
| `GET`  | `/users/<id>/`    | Retrieve details of a specific user    |

---

### 🧾 Application Endpoints (`/api/v1/applications/`)

| Method  | Endpoint | Description                                                                 |
| ------- | -------- | --------------------------------------------------------------------------- |
| `GET`   | `/`      | Retrieve a list of the current user’s applications (or all if admin)        |
| `POST`  | `/`      | Submit a new application (ID request, renewal, birth certificate)           |
| `PATCH` | `/<id>/` | Update an existing application (admins can change status and trigger email) |
| `GET`   | `/<id>/` | Retrieve detailed information for a specific application                    |

---

## 💾 Database Models

The system uses **SQLite** as the primary database during development  
(with the option to migrate to **PostgreSQL** or **MySQL** for production).

Django ORM ensures consistency, validation, and relational integrity.

---

### 🧍‍♂️ 1. User Model (`users.models.User`)

Extends Django’s `AbstractUser`, supporting **role-based access**.

**Fields:**

- `id`: Primary key (auto-generated)
- `username`: Unique identifier for login
- `email`: User’s email address
- `phone_number`: Contact phone number
- `role`: Defines user permissions (`resident`, `admin`)
- `date_joined`: Timestamp of registration

---

### 📄 2. Application Model (`applications.models.Application`)

Represents service requests such as **New ID**, **ID Renewal**, or **Birth Certificate**.

**Fields:**

- `user`: Foreign key (One-to-One) linked to the User model
- `application_type`: (`NEW_ID`, `ID_RENEWAL`, `BIRTH_CERTIFICATE`)
- `status`: (`PENDING`, `READY`, `REJECTED`)
- `full_name`, `dob`, `gender`, `resident_address`, `phone_number`
- **Attachments:**
  - `photo`
  - `residence_proof`
  - `old_id_card`
  - `hospital_proof`
  - `parent_id`
- `created_at`: Automatically set submission timestamp

---

### 📬 3. Notification System

- Notifications are handled dynamically using Django’s **email system** (`send_mail()`).
- Example:
  > “Your ID is ready for pickup.”
- Testing:
  - Emails were tested using Mailtrap to ensure the notification system works without sending emails to real users.
  - All status updates (e.g., Pending Review, Rejected, Ready for Pickup) correctly trigger email notifications captured in Mailtrap.
  - For production, the system can be configured to use real SMTP servers (e.g., Gmail, SendGrid, Mailgun) for actual delivery to users.

---

## 🚀 Summary


The **Digital Citizen Service Management API** demonstrates the development of a secure and scalable backend system for managing citizen service workflows.

The project focuses on backend engineering practices including API design, authentication, authorization, database modeling, file handling, workflow management, and automated notifications.

The architecture can be extended to support additional digital services and administrative workflows.

---

### 🛠️ Tech Stack Summary

- **Backend:** Django, Django REST Framework
- **Database:** SQLite (development), PostgreSQL/MySQL (production)
- **Authentication:** JWT
- **Email Notifications:** Django `send_mail()`
- **Deployment Options:** Render 

---

### 📂 Postman Collection

A Postman collection has been created to facilitate testing of the API endpoints for User CRUD and Application CRUD.

- The collection is exported as a JSON file and is located in the postman/ folder:

```bash
postman/management-system.postman_collection.json
```

- To use it:

  - Open Postman → Click Import → Select File → Choose the .json file.

  - All API endpoints will be available for testing immediately.

---

## 🚀 Deployment (Render)

The app is deployed on Render and is available at:

**Live URL:** [https://kebele-management-api.onrender.com](https://kebele-management-api.onrender.com)

- Make sure `ALLOWED_HOSTS` in `settings.py` includes your Render domain.
- Static files have been collected using:

```bash
python manage.py collectstatic --noinput
```
## 🔧 Testing Endpoints on Render

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
