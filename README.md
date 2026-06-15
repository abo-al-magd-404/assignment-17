# Social Media Platform - Backend API

**Assignment:** Social Media Project (Final Part) | ASSIGNMENT 17  
**Author:** Mohamed Mahmoud Abo Al Magd  
**Group:** Node_C45_Mon&Thurs_9:00pm (Online)

---

## Overview

A production-grade, full-featured social media backend built with Node.js and TypeScript. This platform delivers comprehensive REST and GraphQL APIs with real-time messaging capabilities via WebSockets, enabling users to connect, share posts, engage through reactions/comments, and communicate instantly.

## Key Features

### 🔐 Authentication & Security
- **Multi-Auth Support:** Traditional email/password registration & login, Google OAuth integration
- **Email Verification:** Confirmation flow with re-send capability
- **Password Recovery:** Secure OTP-based password reset mechanism
- **JWT Token Management:** Dual access/refresh token system with secure rotation
- **Role-Based Access Control (RBAC):** Granular permission management

### 👥 User Management
- Profile creation & management with encrypted data fields (phone)
- Cloud-based profile and cover image uploads with streaming
- User soft-delete & restore with paranoid middleware
- Token rotation for enhanced security

### 📝 Post System
- **Create, Read, Update, Post Management:** Full CRUD operations with authentication
- **Multi-File Attachments:** Support for image uploads (max 2 files per post)
- **Pagination Support:** Efficient large-scale data retrieval
- **Post Reactions:** Interactive like system with granular tracking
- **Comments Integration:** Nested comment support on posts

### 💬 Real-Time Messaging
- **WebSocket Support:** Socket.io integration for instant messaging
- **Direct Messaging:** One-to-one user conversations with pagination
- **Group Chats:** Create and manage group conversations with members
- **Typing Indicators & Online Status:** Real-time user presence tracking
- **Message History:** Persistent conversation storage with efficient retrieval

### 🎯 GraphQL API
- **Query Interface:** Access user and post data via GraphQL endpoint at `/GraphQL`
- **Mutation Support:** Modify data through GraphQL mutations
- **Authentication:** Protected GraphQL queries with JWT tokens

### ☁️ Cloud Storage Integration
- **S3-Compatible Upload/Download:** AWS S3 or Cloudinary support
- **Presigned URLs:** Secure, time-limited asset URLs for download/streaming
- **File Streaming:** Efficient large-file handling with automatic cleanup
- **AWS Lambda Integration:** Automated S3 event handling for media processing

### 🔧 Developer Experience
- **Strict TypeScript:** Strict mode with isolated modules for type safety
- **Comprehensive Validation:** Zod-based request validation across all endpoints
- **Centralized Error Handling:** Global Express error middleware with detailed logging
- **CORS Configuration:** Environment-driven cross-origin resource sharing
- **Multi-Environment Setup:** Separate `.env.development` and `.env.production` configs

---

## Tech Stack

| Category | Technologies |
|----------|---------------|
| **Runtime** | Node.js (ES2023, CommonJS) |
| **Language** | TypeScript (strict, isolated modules) |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB with Mongoose ODM |
| **Cache/Queue** | Redis |
| **Real-Time** | Socket.io |
| **API** | REST + GraphQL (with graphql-http) |
| **Cloud Storage** | AWS S3 SDK + Cloudinary |
| **Auth** | JWT, Google OAuth, Firebase Admin |
| **Validation** | Zod |
| **File Upload** | Multer |
| **Encryption** | bcrypt, crypto |
| **Email** | Nodemailer |
| **Utilities** | Axios, dotenv, CORS |

---

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.bootstrap.ts                 # Express app initialization & middleware setup
├── config/
│   └── config.ts                    # Environment configuration loader
├── DB/
│   ├── connection.db.ts             # MongoDB connection
│   ├── repository/                  # Data access layer (CRUD patterns)
│   └── models/                      # Mongoose schemas with middleware
├── modules/
│   ├── auth/                        # Authentication logic
│   │   ├── auth.controller.ts       # Route handlers
│   │   ├── auth.service.ts          # Business logic
│   │   ├── auth.validation.ts       # Request validation schemas
│   │   └── auth.entity.ts           # TypeScript interfaces
│   ├── user/                        # User profile & management
│   ├── post/                        # Post CRUD & reactions
│   ├── comment/                     # Comment system
│   ├── chat/                        # Direct messaging & groups
│   ├── realtime/                    # Socket.io gateway
│   │   └── realtime.gateway.ts      # WebSocket initialization
│   └── graphql/                     # GraphQL schema definitions
├── middleware/
│   ├── authentication.ts            # JWT token verification
│   ├── authorization.ts             # RBAC enforcement
│   ├── validation.ts                # Zod schema validation
│   ├── errorHandler.ts              # Centralized error handling
│   └── cors.ts                      # CORS configuration
├── common/
│   ├── services/
│   │   ├── cloudinary.service.ts    # File upload/download
│   │   ├── token.service.ts         # JWT operations
│   │   └── redis.service.ts         # Cache management
│   ├── response/                    # Standardized response helpers
│   ├── utils/                       # Utilities (multer config, etc.)
│   ├── types/                       # Global TypeScript interfaces
│   ├── enums/                       # Shared enumerations
│   └── validation/                  # Reusable validation schemas
└── dist/                            # Compiled JavaScript output
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register with email/password |
| `POST` | `/auth/login` | Login with credentials |
| `POST` | `/auth/signup/gmail` | Google sign-up via ID token |
| `POST` | `/auth/login/gmail` | Google login via ID token |
| `PATCH` | `/auth/confirm-email` | Verify email confirmation token |
| `PATCH` | `/auth/resend-confirm-email` | Re-send confirmation email |
| `POST` | `/auth/forget-password` | Initiate password reset (OTP) |
| `POST` | `/auth/reset-password` | Complete password reset |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user` | Fetch authenticated user profile |
| `PATCH` | `/user/profile-image` | Upload/update profile image |
| `PATCH` | `/user/cover-image` | Upload/update cover image |
| `POST` | `/user/rotate-token` | Refresh access token |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/post` | Create post with attachments |
| `GET` | `/post` | List posts (paginated) |
| `PATCH` | `/post/:postId` | Update post |
| `PATCH` | `/post/:postId/react` | Like/react to post |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/post/:postId/comment` | Add comment to post |
| `GET` | `/post/:postId/comment` | Fetch comments (paginated) |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chat/:userId` | Get direct message conversation |
| `POST` | `/chat/group` | Create group chat |
| `GET` | `/chat/group/:groupId` | Get group conversation |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/uploads/*path` | Download/stream file from S3 |
| `GET` | `/presigned/*path` | Generate presigned S3 URL |

### GraphQL

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/GraphQL` | Query/Mutation endpoint |

---

## Real-Time Events (WebSockets)

### Chat Events
- `send_message` – Send direct message
- `typing_indicator` – User is typing
- `online_status` – User online/offline
- `message_read` – Message read receipt

### Notifications
- `new_reaction` – Post reaction event
- `new_comment` – Comment on post
- `offline_user` – User disconnected

---

## Setup & Installation

### Prerequisites
- Node.js ≥ 18.x
- MongoDB instance (local or cloud)
- Redis server
- AWS S3 bucket or Cloudinary account
- Google OAuth credentials

### 1. Clone & Install

```bash
git clone <repository-url>
cd assignment-17
npm install
```

### 2. Environment Configuration

Copy environment templates and configure:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

Update the following in `.env.development`:

```env
# Server
PORT=30000
NODE_ENV=development

# Database
DB_URI=mongodb://localhost:27017/social-media

# Redis
REDIS_URL=redis://localhost:6379

# JWT Tokens
USER_ACCESS_TOKEN_SIGNATURE=your_secret_key_here
USER_REFRESH_TOKEN_SIGNATURE=your_refresh_secret_here
ACCESS_TOKEN_EXPIRES_IN=1800
REFRESH_TOKEN_EXPIRES_IN=31536000

# Email (Nodemailer)
APP_EMAIL=your-email@gmail.com
APP_EMAIL_PASSWORD=your-app-password
APPLICATION_NAME=SocialMedia

# Cloud Storage (Choose one: Cloudinary OR AWS S3)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OR AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_BUCKET_NAME=your-bucket-name

# Google OAuth
CLIENT_IDS=your-google-client-id.apps.googleusercontent.com

# CORS Origins
ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Run Development Server

```bash
npm run start:dev
```

Server starts on `http://localhost:30000`

### 4. Run Production Build

```bash
npm run start:prod
```

---

## Architecture Patterns

### Repository Pattern
Data access layer abstraction with CRUD operations:
- `UserRepository`, `PostRepository`, `ChatRepository`, etc.
- Implements filtering, pagination, and soft-delete logic
- Middleware triggers on create/update/delete operations

### Service Layer
Business logic encapsulation:
- `AuthService` – Auth workflows (signup, login, token refresh)
- `PostService` – Post operations and reactions
- `ChatService` – Messaging and group management
- `CloudinaryService` – File upload/download orchestration
- `TokenService` – JWT generation and validation
- `RedisService` – Cache and session management

### Middleware Pipeline
```
Request → Validation → Authentication → Authorization → Controller → Response
        ↓
     Error Handler
```

### Soft Delete Implementation
- `deletedAt` field marks deleted records
- Repository queries filter soft-deleted by default
- `paranoid: false` option includes deleted records
- `force: true` option for permanent deletion

---

## Security Best Practices

✅ **Implemented**
- Strict TypeScript with no implicit `any`
- Password hashing with bcrypt (12 salt rounds)
- Phone encryption with AES-256-CBC
- JWT token validation on protected routes
- RBAC middleware for authorization
- Input validation with Zod schemas
- CORS with environment-driven origins
- Secure password reset flow with OTP
- Soft-delete protection against accidental data loss
- Presigned URLs with expiration (time-limited access)

---

## Development Workflow

### Watch & Rebuild
TypeScript compilation with file watching:
```bash
npm run start:dev
```

### Testing Middleware
The bootstrap process validates:
- User creation (pre-save middleware)
- User updates (pre-update + encryption)
- Soft delete/restore lifecycle
- Paranoid filtering (soft-delete queries)
- Force delete capability

### Debugging
- Console logs throughout the bootstrap process
- Error logging in global error handler
- Detailed validation error messages
- MongoDB connection status logging

---

## Performance Considerations

- **Pagination:** All list endpoints support limit/offset
- **Indexing:** Database indexes on frequently queried fields
- **Redis Cache:** User sessions and real-time connections cached
- **Presigned URLs:** Direct S3 downloads bypass server
- **Socket.io Adapters:** Redis adapter for multi-instance scaling
- **Soft Delete:** Indexes on `deletedAt` field for fast queries

---

## Deployment

### Environment Variables
Production `.env` differs from development:
- Stricter CORS origins
- Production database URI
- Real AWS S3 credentials
- Cloud storage CDN for static assets

### Build Process
```bash
tsc --build
npm run start:prod
```

### Docker (Optional)
Create `Dockerfile` with Node.js image and expose port `30000`.

### Monitoring
- Server logs on startup
- Bootstrap process validation on each restart
- Unhandled error capture in global middleware
- Redis connection status on startup

---

## Database Schema Highlights

### User
```typescript
{
  firstName: string
  lastName: string
  slug: string (unique)
  email: string (unique, lowercased)
  password: string (hashed)
  phone: string (encrypted)
  isEmailConfirmed: boolean
  profileImage?: string (S3 URL)
  coverImage?: string (S3 URL)
  role: enum ['user', 'admin']
  deletedAt?: Date (soft delete)
  restoredAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Post
```typescript
{
  content: string
  attachments: string[] (S3 URLs)
  author: ObjectId (ref: User)
  reactions: { type: string, count: number }[]
  comments: ObjectId[] (ref: Comment)
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

### Chat
```typescript
{
  participants: ObjectId[] (ref: User)
  isGroup: boolean
  groupName?: string
  groupImage?: string
  messages: { sender, content, attachments, timestamp }[]
  createdAt: Date
}
```

---

## Contributing

Follow these guidelines:
1. Use TypeScript strictly (no `any` types)
2. Add validation schemas for new endpoints
3. Write service methods for business logic
4. Use repository pattern for data access
5. Test middleware behavior in bootstrap
6. Document API changes in comments

---

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check `DB_URI` in `.env` file
- Verify network access if using MongoDB Atlas

### Redis Connection Failed
- Ensure Redis is running: `redis-server`
- Check `REDIS_URL` in `.env` file

### File Upload Failures
- Verify AWS S3 credentials or Cloudinary config
- Check bucket permissions and region settings
- Ensure file size within limits (2 files, configurable)

### Token Validation Errors
- Verify JWT signatures match between generation and validation
- Check token expiration times
- Ensure headers send `Authorization: Bearer <token>`

---

## License

ISC

---

## Contact

**Author:** Mohamed Mahmoud Abo Al Magd  
**Group:** Node_C45_Mon&Thurs_9:00pm (Online)

For issues, questions, or contributions, reach out through the repository's issue tracker.

---

**Last Updated:** June 15, 2026 | **Status:** Production-Ready ⚡
