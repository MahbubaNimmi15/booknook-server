# BookNook Backend

Express.js and MongoDB API for the BookNook online library.

## Technologies
- Node.js
- Express.js
- MongoDB
- CORS
- dotenv

## Local Development

1. Install dependencies using npm install.
2. Create a .env file in the project root.
3. Configure MONGODB_URI, DB_NAME, and INTERNAL_API_SECRET.
4. Start the server using npm start.

Never commit the .env file or database credentials.

## API Endpoints

### Public
- GET / — Server status
- GET /api/health — Health check
- GET /api/books — Get all books
- GET /api/books/:id — Get book details

### Protected
- POST /api/books — Add a book
- PATCH /api/books/:id — Update a book
- DELETE /api/books/:id — Delete a book
- POST /api/borrow — Borrow a book
- POST /api/return — Return a book

Protected endpoints require the x-internal-api-key header.
