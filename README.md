# geBackend Documentation

## Overview
geBackend is an Express + Prisma backend for an industrial automation website/CMS. It provides APIs for:
- Admin authentication and profile lookup
- Blog management
- Category and sub-category management
- Product catalog management
- Lead capture and lead management

Core integrations:
- PostgreSQL via Prisma ORM
- Supabase Storage for image hosting
- SMTP email (lead notifications and password reset OTP)
- JWT-based auth for admin-protected endpoints

## Tech Stack
- Runtime: Node.js (ES modules)
- Framework: Express 5
- ORM: Prisma
- DB: PostgreSQL
- Auth: JSON Web Token (`jsonwebtoken`)
- Password hashing: `bcrypt`
- File upload: `multer` (memory storage)
- Storage CDN: Supabase Storage (bucket: `uploads`)
- Email: `nodemailer`

## Project Structure
```text
geBackend/
  prisma/
    schema.prisma          # Database schema + enums
    seed.js                # Seeds default admin user
  src/
    app.js                 # App bootstrap, middleware, route mounting
    config/
      env.js               # Environment loading and validation
      prisma.js            # Prisma client singleton
      supabase.js          # Supabase client
    middleware/
      authMiddleware.js    # JWT auth + admin role guard
      uploadMiddleware.js  # Multer image upload config
    modules/
      auth/
      blogs/
      categories/
      subCategories/
      products/
      leads/
    utils/
      throwError.js
      supabaseStorage.js
      email.js
  prisma.config.ts         # Prisma config
  package.json
```

## Application Flow (Top to Base)
1. `src/app.js` initializes Express, security middleware, CORS, body parsing, and route registration.
2. Route files map HTTP endpoints to controllers.
3. Controllers parse/transform request payloads and orchestrate upload/deletion side effects.
4. Services enforce business validation and perform DB operations via Prisma.
5. Utilities handle shared concerns (errors, email, Supabase storage).
6. Prisma writes/reads PostgreSQL, while uploaded images go to Supabase Storage.

## Runtime and Middleware
### Global Middleware
- `helmet` with `crossOriginResourcePolicy: cross-origin`
- `cors` with `origin` from `FRONTEND_URL` and `credentials: true`
- JSON body limit: `10mb`
- URL encoded parser enabled
- Static mount: `/uploads` -> local `uploads/` directory (note: most images are hosted in Supabase public URLs)

### Error Handling
- Central error middleware returns:
  - `500` + full message in development
  - `500` + generic error object in non-dev
- Catch-all 404 handler returns `{"message":"Route not found"}`

## Environment Variables
`src/config/env.js` requires these variables at startup:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`
- `JWT_SECRET`
- `PORT`

Optional/used variables:
- `NODE_ENV` (default: `development`)
- `FRONTEND_URL` (default: `*`)
- `ADMIN_EMAIL`
- `JWT_EXPIRES_IN` (used in auth service; default `7d`)
- SMTP settings:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

## Getting Started
### Install
```bash
npm install
```

### Prisma Setup
```bash
npx prisma generate
npx prisma migrate dev
```

### Seed Admin User
```bash
npx prisma db seed
```
Default seeded admin from `prisma/seed.js`:
- Email: `admin@gmail.com`
- Password: `123456`

### Run
```bash
npm run dev
# or
npm start
```

### Health Check
- `GET /api/health`

## Database Model Summary
Defined in `prisma/schema.prisma`.

### User
- Fields: `email` (unique), `password`, `name`, `role`, soft-delete flags, reset OTP fields.
- Role enum: `admin | user`

### BlogPost
- SEO/content fields + publish controls
- Soft-delete with `isDeleted`, `deletedAt`

### Category
- Basic taxonomy + optional images
- Soft-delete and active flag

### SubCategory
- Belongs to `Category` (`categoryId` required)
- Has `displayOrder`, active + soft-delete flags

### Product
- Belongs to optional `Category` and `SubCategory`
- `specifications` and `galleryImages` are JSON
- `isFeatured`, `isActive`, soft-delete flags

### Lead
- Contact info + inquiry metadata
- Optional relation to `Product`
- Status lifecycle enum: `new | contacted | qualified | closed`

### InquiryType Enum
Includes both simple and extended values:
- `general`, `product`, `support`, `partnership`
- `General_Inquiry`, `Request_for_Quote`, `Technical_Support`, `Product_Information`, `Other`, `product_inquiry`

## Authentication and Authorization
### JWT Auth
- Middleware: `authenticateToken`
- Expected header: `Authorization: Bearer <token>`
- On success, decoded payload is attached to `req.user`

### Admin Guard
- Middleware: `adminAuth`
- Requires `req.user.role === "admin"`

### Auth Endpoints
Base path: `/api/auth`

1. `POST /login`
- Public
- Body: `{ "email": "...", "password": "..." }`
- Returns JWT + user profile

2. `GET /me`
- Protected (JWT)
- Returns current user profile

3. `POST /forgot-password`
- Public
- Body: `{ "email": "..." }`
- Stores OTP and expiry (10 minutes), sends OTP mail

4. `POST /verify-otp`
- Public
- Body: `{ "email": "...", "otp": "..." }`
- Returns temporary reset token (15m)

5. `POST /reset-password`
- Public endpoint, but requires `Authorization: Bearer <resetToken>`
- Body: `{ "email": "...", "newPassword": "..." }`
- Resets password and clears OTP fields

## API Reference

### Blogs
Base path: `/api/blogs`

Public:
1. `GET /` - list published, non-deleted blogs
2. `GET /:slug` - get published blog by slug

Admin-only:
1. `GET /admin` - list all non-deleted blogs
2. `GET /admin/:id` - get blog by id
3. `POST /` - create blog (`multipart/form-data`, optional `featuredImage`)
4. `PUT /:id` - update blog (`multipart/form-data`, optional `featuredImage`)
5. `PATCH /publish/:id` - toggle publish status
6. `DELETE /:id` - soft-delete blog

Key rules:
- `slug` must be unique among non-deleted rows
- Publishing sets `publishDate`; unpublishing clears it
- Uploaded images stored at Supabase `uploads/blogs/...`

### Categories
Base path: `/api/categories`

Public:
1. `GET /` - list active and non-deleted categories
2. `GET /:slug` - get active category by slug

Admin-only:
1. `GET /admin`
2. `GET /admin/:id`
3. `POST /` - create category (`multipart/form-data`; `imageUrl`, `bannerUrl` files)
4. `PUT /:id` - update category (same upload fields)
5. `DELETE /:id` - soft-delete category

Key rules:
- `slug` unique
- delete marks `isDeleted=true`, `isActive=false`
- Supabase image cleanup runs on update/delete

### SubCategories
Base path: `/api/sub-categories`

Public:
1. `GET /` - list active/non-deleted subcategories with category relation
2. `GET /:slug` - get subcategory by slug

Admin-only:
1. `GET /admin`
2. `GET /admin/:id`
3. `POST /` - create (`multipart/form-data`; `imageUrl`, `bannerUrl`)
4. `PUT /:id` - update
5. `PATCH /active/:id` - update `isActive`
6. `DELETE /:id` - soft-delete

Key rules:
- `categoryId` required on create
- referenced category must exist and not be deleted
- `slug` unique

### Products
Base path: `/api/products`

Public:
1. `GET /` - list active/non-deleted products with category/subcategory
2. `GET /:slug` - get active product by slug

Admin-only:
1. `GET /admin`
2. `GET /admin/:id`
3. `POST /` - create (`multipart/form-data`; `galleryImages[]` up to 10 files)
4. `PUT /:id` - update (`multipart/form-data`; `galleryImages[]` optional)
5. `PATCH /active/:id` - set `isActive`
6. `PATCH /featured/:id` - set `isFeatured`
7. `DELETE /:id` - soft-delete

Key rules:
- `slug` unique
- `specifications` and `galleryImages` may be passed as JSON string or object/array
- optional category/subcategory references are validated
- if both are present, subcategory must belong to chosen category
- deleted/removed gallery URLs are cleaned from Supabase

### Leads
Base path: `/api/leads`

Public:
1. `POST /` - create lead

Admin-only:
1. `GET /admin` - list leads
2. `GET /admin/:id` - get lead by id
3. `PATCH /status/:id` - update status (`new|contacted|qualified|closed`)
4. `DELETE /:id` - soft-delete lead

Key rules:
- `name` and `email` required
- `inquiryType` must match enum set from schema/service
- `productId` optional, validated if provided
- on create, notification email is sent to `ADMIN_EMAIL`

## File Upload and Storage
- Upload middleware uses in-memory buffers (`multer.memoryStorage()`)
- Accepts only `image/*` mime types
- Max file size: `5MB`
- Supabase bucket fixed to `uploads`
- Generated file path: `<folder>/<timestamp>-<originalname>`

## Email Workflows
Handled in `src/utils/email.js`:
- `sendLeadNotification` for new leads
- `generateOTP` and `sendForgotPasswordOTP` for password reset

SMTP transporter uses `env.smtp` settings.

## Soft Delete Convention
Most domain models use:
- `isDeleted` boolean
- `deletedAt` timestamp

List/read methods generally filter out deleted rows. Delete endpoints usually perform soft-delete instead of hard delete.

## Known Implementation Notes
1. In `src/modules/subCategories/subCategories.service.js`, `updateSubCategory` has a guard:
```js
if (!existing && existing.isDeleted)
```
This can throw when `existing` is `null`; logically it should be `if (!existing || existing.isDeleted)`.

2. In `src/utils/email.js`, transporter `secure` config compares with string (`env.smtp.secure === "true"`) even though `env.smtp.secure` is already boolean from env parsing.

3. In `src/utils/email.js` OTP template includes an encoding artifact in the warning text (`⚠️`) that should be cleaned.

4. `src/app.js` serves `/uploads` local static directory, but primary image path currently comes from Supabase public URLs.

## Suggested Future Improvements
1. Add Joi validation schemas per endpoint for strict payload contracts.
2. Add OpenAPI/Swagger spec and auto-generated API docs.
3. Add test coverage for service validation and role-protected routes.
4. Add pagination and filtering for blog/product/lead list endpoints.
5. Harden CORS behavior for production environments.

## License
Project currently uses ISC license (as set in `package.json`).
