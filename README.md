# Wave — Full-Stack Social Media Platform

<p align="center">
  A modern full-stack social media platform built with React, Node.js, TypeScript, MongoDB, Redis, and Socket.IO.
</p>

<p align="center">
  <a href="https://social-media-black-nine.vercel.app/">Live Demo</a>
  ·
  <a href="https://github.com/you752/Social_Media">GitHub Repository</a>
</p>

---

## Overview

**Wave** is a full-stack social media platform designed to provide users with a complete social networking experience.

The application combines a RESTful backend with real-time communication to support authentication, user profiles, posts, comments, friendships, notifications, and private messaging.

The project focuses on building a scalable backend architecture, secure authentication flow, real-time communication, and clean integration between the frontend and backend.

---

## Live Application

### 🌐 Frontend

https://social-media-black-nine.vercel.app/

### 📦 Repository

https://github.com/you752/Social_Media

> Backend deployment URL can be added here once the production backend is deployed.

---

# ✨ Features

## 🔐 Authentication

* User registration and login
* Email account verification
* OTP-based verification
* Resend verification OTP
* JWT authentication
* Access token + refresh token architecture
* Secure logout
* Redis-based token blacklist
* Google OAuth authentication
* Password hashing with bcrypt
* Login rate limiting
* Protected routes
* Role-based authorization

---

## 👤 User Management

* User profiles
* Update profile information
* Profile image upload
* Account verification
* User search
* User roles
* Authentication provider support
* Protected user operations

---

## 📝 Posts

* Create posts
* Update posts
* Delete posts
* Retrieve posts
* Post interactions
* Post ownership validation
* Real-time post-related events

---

## 💬 Comments

* Create comments
* Update comments
* Delete comments
* Comment authorization
* Real-time comment notifications

---

## 👥 Friends System

* Send friend requests
* Accept friend requests
* Reject friend requests
* Remove friends
* View friends
* Real-time friend request notifications

---

## 💬 Real-Time Messaging

Wave uses **Socket.IO** to provide real-time communication between users.

Features include:

* Private messaging
* Real-time message delivery
* Socket-based communication
* Real-time chat events
* Real-time notifications

---

## 🔔 Notifications

Users can receive real-time notifications for important social interactions, including:

* Friend requests
* Comments
* Messages
* Other real-time events

---

# 🛠️ Technology Stack

### Frontend

| Technology       | Purpose                 |
| ---------------- | ----------------------- |
| React            | UI development          |
| Vite             | Frontend tooling        |
| Axios            | HTTP requests           |
| React Router     | Client-side routing     |
| Context API      | Global state management |
| Socket.IO Client | Real-time communication |

### Backend

| Technology | Purpose                    |
| ---------- | -------------------------- |
| Node.js    | Runtime                    |
| Express.js | REST API                   |
| TypeScript | Type safety                |
| MongoDB    | Database                   |
| Mongoose   | ODM                        |
| Redis      | Token management & caching |
| Socket.IO  | Real-time communication    |
| JWT        | Authentication             |
| bcrypt     | Password hashing           |
| Zod        | Validation                 |
| Multer     | File uploads               |
| Nodemailer | Email delivery             |

### External Services

* MongoDB Atlas
* Redis
* Cloudinary
* Google OAuth
* Vercel

---

# 🏗️ Architecture

The application follows a client-server architecture.

```text
┌──────────────────────┐
│      React Client    │
│                      │
│  Pages / Components  │
│  Context / API       │
│  Socket.IO Client    │
└──────────┬───────────┘
           │
           │ HTTP / REST
           │
           ▼
┌──────────────────────┐
│    Node.js Server    │
│                      │
│ Express + TypeScript │
│ Authentication       │
│ Authorization        │
│ Business Logic       │
│ Socket.IO            │
└───────┬────────┬─────┘
        │        │
        ▼        ▼
┌────────────┐ ┌────────────┐
│  MongoDB   │ │   Redis    │
│            │ │            │
│ App Data   │ │ Token Data │
└────────────┘ └────────────┘
```

---

# 📁 Project Structure

```text
Social_Media/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── comment/
│   │   │   ├── friend/
│   │   │   ├── post/
│   │   │   └── user/
│   │   │
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── assets/
│   │   └── ...
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── post/
│   │   │   ├── comment/
│   │   │   ├── friend/
│   │   │   └── chat/
│   │   │
│   │   ├── common/
│   │   ├── middleware/
│   │   ├── database/
│   │   └── ...
│   │
│   └── package.json
│
└── README.md
```

---

# 🔐 Authentication Architecture

Wave uses a JWT-based authentication system with separate access and refresh tokens.

```text
                 ┌──────────────┐
                 │     User     │
                 └──────┬───────┘
                        │
                  Login / Signup
                        │
                        ▼
              ┌──────────────────┐
              │ Authentication   │
              │     Service      │
              └────────┬─────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
       Access Token        Refresh Token
             │                   │
             ▼                   ▼
       API Requests       Token Renewal
```

### Logout Flow

When a user logs out, the access token can be invalidated through a Redis blacklist.

```text
Access Token
     │
     ▼
Logout
     │
     ▼
Redis Blacklist
     │
     ▼
Token rejected
```

---

# ⚡ Real-Time Architecture

Socket.IO is used for real-time communication between connected clients.

```text
User A
   │
   │ Socket Connection
   ▼
┌──────────────────┐
│   Socket.IO      │
│      Server      │
└────────┬─────────┘
         │
         ├──────────────► User B
         │
         ├──────────────► Notifications
         │
         └──────────────► Real-Time Events
```

This architecture allows users to receive updates without manually refreshing the application.

---

# 🗄️ Data Layer

MongoDB is used as the primary database, with Mongoose providing schema modeling and database interaction.

Core entities include:

```text
User
 │
 ├── Posts
 ├── Comments
 ├── Friends
 ├── Friend Requests
 ├── Conversations
 └── Messages
```

Redis is used alongside MongoDB for fast temporary data access and token blacklist management.

---

# 🔒 Security

Security was considered throughout the application architecture.

### Authentication

* JWT access tokens
* JWT refresh tokens
* Password hashing
* Email verification
* Google OAuth

### Authorization

* Protected routes
* Authentication middleware
* Role-based access control
* Resource ownership validation

### API Protection

* Login rate limiting
* Input validation with Zod
* Token blacklist using Redis
* CORS configuration
* Secure password handling

---

# 📧 Email Verification

New accounts can be verified through an OTP sent to the user's email.

```text
Signup
   │
   ▼
Generate OTP
   │
   ▼
Send Email
   │
   ▼
User submits OTP
   │
   ▼
Verify OTP
   │
   ▼
Account Activated
```

OTP verification helps prevent unverified accounts from accessing protected functionality.

---

# ☁️ File Uploads

The application supports user profile image uploads.

The upload flow is handled through the backend and integrated with cloud storage.

```text
React Client
     │
     │ Multipart Request
     ▼
Backend
     │
     ▼
Upload Processing
     │
     ▼
Cloud Storage
     │
     ▼
Image URL
     │
     ▼
MongoDB
```

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB or MongoDB Atlas
* Redis
* Git

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/you752/Social_Media.git
cd Social_Media
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

---

# ⚙️ Environment Variables

Create the required environment files for the frontend and backend.

Example backend configuration:

```env
PORT=
NODE_ENV=

MONGO_URI=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

REDIS_URL=

EMAIL_USER=
EMAIL_PASSWORD=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

> Never commit `.env` or other files containing secrets to GitHub.

---

# ▶️ Running the Application

### Start Backend

```bash
cd server
npm run start:dev
```

### Start Frontend

```bash
cd client
npm run dev
```

The frontend will then be available through the Vite development server.

---

# 🧪 Testing

The project can be tested through the application's main user flows:

* Registration
* Email verification
* Login
* Logout
* Profile management
* Posts
* Comments
* Friend requests
* Real-time messaging
* Notifications
* Google authentication

---

# 🌍 Deployment

### Frontend

The frontend is deployed using **Vercel**.

### Backend

The backend can be deployed using a Node.js-compatible hosting provider such as:

* Render
* Railway
* VPS
* Other Node.js hosting platforms

### Database

MongoDB Atlas is used for cloud database hosting.

### Redis

Redis is used for temporary and authentication-related data.

---

# 📸 Screenshots

> Add project screenshots here.

### Login

```text
[ Add Login Screenshot ]
```

### Home

```text
[ Add Home Screenshot ]
```

### Profile

```text
[ Add Profile Screenshot ]
```

### Chat

```text
[ Add Chat Screenshot ]
```

### Friends

```text
[ Add Friends Screenshot ]
```

---

# 📌 Project Highlights

* Full-stack architecture
* RESTful API
* JWT authentication
* Access & refresh token system
* Redis integration
* Real-time communication
* Socket.IO
* Google OAuth
* Email OTP verification
* Role-based authorization
* Rate limiting
* MongoDB data modeling
* Cloud image storage
* React frontend
* Production deployment

---

# 👨‍💻 Author

## Youssef Ahmed

Computer Science & Artificial Intelligence Student

**Backend Development | Node.js | TypeScript | AI**

### GitHub

https://github.com/you752

---

# ⭐ License

This project was developed for educational and portfolio purposes.

If you find the project useful or interesting, feel free to ⭐ the repository.
