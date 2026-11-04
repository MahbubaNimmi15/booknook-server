
# 📚 BookNook — Backend API

BookNook Backend is the server-side application for the BookNook Online Library platform.

It provides RESTful APIs for managing books, handling borrowing and return operations, and storing library data in MongoDB.

## 🌐 Live Links

- **Frontend:** https://booknook-client-zbaq.vercel.app
- **Backend:** https://booknook-server-gold.vercel.app
- **Books API:** https://booknook-server-gold.vercel.app/api/books

## 🔗 GitHub Repositories

- **Client:** https://github.com/MahbubaNimmi15/booknook-client
- **Server:** https://github.com/MahbubaNimmi15/booknook-server

## ✨ Backend Features

1. MongoDB database integration.
2. RESTful API using Express.js.
3. Retrieve all available books.
4. Retrieve individual book details.
5. Create new book records.
6. Update existing book information.
7. Delete book records.
8. Support book borrowing operations.
9. Support book return operations.
10. Store and manage library-related data.

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- JavaScript
- Vercel
- GitHub

## 🔌 API Overview

**Base URL:**

https://booknook-server-gold.vercel.app

### Confirmed API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/books | Retrieve the book collection |

Additional endpoints handle book details, creation, updates, deletion, borrowing, and returns.

Their exact paths and HTTP methods should be documented after checking the server route definitions.

## ⚙️ Local Installation

### 1. Clone the Repository

bash
git clone https://github.com/MahbubaNimmi15/booknook-server.git


### 2. Navigate to the Project

bash
cd booknook-server


### 3. Install Dependencies

bash
npm install


### 4. Configure Environment Variables

Create a .env file in the server project directory.

Configure the environment variables required by the actual server implementation, including its MongoDB connection.

Never commit database credentials, passwords, API keys, or authentication secrets to GitHub.

### 5. Start the Server

Use the start or development script defined in package.json.

### 6. Test the Books API

Open:

https://booknook-server-gold.vercel.app/api/books

A successful response should return the books data in JSON format.

## 🗄️ Database

MongoDB is used to store and manage library records.

The backend communicates with MongoDB to retrieve, create, update, and delete book information.

## 🔐 Security

The frontend uses Better Auth for user authentication.

Backend authorization must be verified separately to ensure protected operations cannot be performed by unauthorized users.

Sensitive environment variables must remain on the server and must not be committed to the repository.

## 🚀 Deployment

The backend is deployed on Vercel.

**Production Backend:**

https://booknook-server-gold.vercel.app

The frontend communicates with the backend through HTTP API requests.


## 📌 Project Purpose

This backend was developed to demonstrate REST API development, MongoDB integration, CRUD operations, book borrowing functionality, and server deployment as part of a full-stack library management application.
