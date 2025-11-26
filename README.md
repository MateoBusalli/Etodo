# ETodo Project

## Overview

Etodo is a todo list app.

## Features

- User authentication (register, login, JWT)
- CRUD operations for todos (create, read, update, delete)
- User-specific todo lists
- Responsive React frontend
- Error handling and middleware
- Dockerized backend and frontend

## Project Structure

```
B-WEB-101-NCE-1-1-etodo-4/
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── config/
│       │   └── db.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── auth/
│       │   │   └── auth.js
│       │   ├── todos/
│       │   │   ├── todos.js
│       │   │   └── todos.query.js
│       │   └── user/
│       │       ├── user.js
│       │       └── user.query.js
│       └── script/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.js
│       ├── App.css
│       └── ...
│
├── docker-compose.yml
├── e-todo.sql
└── README.md
```

## Prerequisites

- Docker & Docker Compose
- Node.js
- npm or yarn

## Setup & Usage

### 1. Clone the Repository

```sh
git clone <repository-url>
cd B-WEB-101-NCE-1-1-etodo-4
```

### 2. Environment Variables

Create environment variable files as needed for backend and frontend.
#### Backend example (`backend/.env`):
```
DB_HOST=database
DB_USER=youruser
DB_PASSWORD=yourpassword
DB_NAME=etodo
JWT_SECRET=your_jwt_secret
```

#### Frontend example (`frontend/.env`):
```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Database Setup

- The `e-todo.sql` file contains the schema for the MARIADB database.
- Docker Compose will automatically set up the database container.

### 4. Running with Docker Compose

```sh
docker-compose up --build
```

- The backend will be available at `http://localhost:5000`
- The frontend will be available at `http://localhost:3000`

### 5. Running Locally (Without Docker)

#### Backend
```sh
cd backend
npm install
npm start
```

#### Frontend
```sh
cd frontend
npm install
npm start
```

## API

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and receive JWT

### Todos
- `GET /api/todos` — Get all todos for the authenticated user
- `POST /api/todos` — Create a new todo
- `PUT /api/todos/:id` — Update a todo
- `DELETE /api/todos/:id` — Delete a todo

### Users
- `GET /api/user/profile` — Get user profile

## Technologies Used
- **Backend:** Node.js, Express, MARIADB, JWT
- **Frontend:** React, JavaScript, CSS
- **DevOps:** Docker, Docker Compose

## Authors
- Matéo Busalli & Hugo Abrino