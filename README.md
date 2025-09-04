# Jopia Backend

A modern job portal backend built with Node.js, Express, and Prisma.

## Features

- User authentication and authorization
- Job posting and management
- Company profiles
- Application tracking
- Skill management
- REST API endpoints for all operations

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL (via Prisma ORM)
- **Testing**: REST Client (`.rest` files)
- **Containerization**: Docker

## Project Structure

```
jopia_backend/
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── prisma/
│   ├── migrations/       # Database migrations
│   ├── schema.prisma    # Prisma schema
│   └── seed.ts          # Database seeding
├── src/
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API route handlers
│   ├── tests/           # API test files
│   └── server.ts        # Server entry point
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy `.env.example` to `.env` and configure)
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed the database (optional):
   ```bash
   npx prisma db seed
   ```

### Running the Application

- Development:
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```
- With Docker:
  ```bash
  docker-compose up --build
  ```

## API Documentation

API endpoints can be tested using the `.rest` files in the `src/tests/` directory. The following routes are available:

- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/companies` - Company profiles
- `/api/jobs` - Job postings
- `/api/applications` - Job applications
- `/api/skills` - Skill management
- `/api/profiles` - User profiles

## Testing

Test API endpoints directly from VS Code using the REST Client extension with the `.rest` files in `src/tests/`.

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

[MIT](https://choosealicense.com/licenses/mit/)