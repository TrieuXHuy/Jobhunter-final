# 📋 Job Hunter Backend API Specification

**Ngày cập nhật:** April 3, 2026  
**Phiên bản:** 1.0  
**Trạng thái:** ⏳ Đang phát triển

---

## 🔴 CRITICAL APIs - Bắt buộc phải có

### 1️⃣ Permission Management

#### GET /api/v1/permissions
Lấy danh sách toàn bộ permissions

**Request:**
```
Method: GET
URL: /api/v1/permissions?page=1&pageSize=10&sort=-createdAt
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Fetch permissions successfully",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 10,
      "pages": 2,
      "total": 15
    },
    "result": [
      {
        "id": "67a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Create Company",
        "apiPath": "/api/v1/companies",
        "method": "POST",
        "module": "company",
        "createdAt": "2026-04-01T10:30:00Z",
        "updatedAt": null,
        "createdBy": "admin@example.com",
        "updatedBy": null
      }
    ]
  }
}
```

---

#### GET /api/v1/permissions/{id}
Lấy chi tiết permission theo ID

**Request:**
```
Method: GET
URL: /api/v1/permissions/67a1b2c3d4e5f6g7h8i9j0k1
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Fetch permission successfully",
  "data": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Create Company",
    "apiPath": "/api/v1/companies",
    "method": "POST",
    "module": "company",
    "createdAt": "2026-04-01T10:30:00Z",
    "updatedAt": null,
    "createdBy": "admin@example.com",
    "updatedBy": null
  }
}
```

---

#### POST /api/v1/permissions
Tạo permission mới

**Request:**
```
Method: POST
URL: /api/v1/permissions
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "name": "Create Company",
  "apiPath": "/api/v1/companies",
  "method": "POST",
  "module": "company"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Create permission successfully",
  "data": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Create Company",
    "apiPath": "/api/v1/companies",
    "method": "POST",
    "module": "company",
    "createdAt": "2026-04-03T14:20:00Z",
    "updatedAt": null,
    "createdBy": "admin@example.com",
    "updatedBy": null
  }
}
```

---

#### PUT /api/v1/permissions
Cập nhật permission

**Request:**
```
Method: PUT
URL: /api/v1/permissions
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "id": "67a1b2c3d4e5f6g7h8i9j0k1",
  "name": "Create Company",
  "apiPath": "/api/v1/companies",
  "method": "POST",
  "module": "company"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Update permission successfully",
  "data": {
    "id": "67a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Create Company",
    "apiPath": "/api/v1/companies",
    "method": "POST",
    "module": "company",
    "createdAt": "2026-04-01T10:30:00Z",
    "updatedAt": "2026-04-03T14:25:00Z",
    "createdBy": "admin@example.com",
    "updatedBy": "admin@example.com"
  }
}
```

---

#### DELETE /api/v1/permissions/{id}
Xóa permission (soft delete)

**Request:**
```
Method: DELETE
URL: /api/v1/permissions/67a1b2c3d4e5f6g7h8i9j0k1
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Delete permission successfully"
}
```

---

### 2️⃣ Role Management

#### GET /api/v1/roles
Lấy danh sách toàn bộ roles

**Request:**
```
Method: GET
URL: /api/v1/roles?page=1&pageSize=10&sort=-createdAt
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Fetch roles successfully",
  "data": {
    "meta": {
      "page": 1,
      "pageSize": 10,
      "pages": 1,
      "total": 3
    },
    "result": [
      {
        "id": "67b1c2d3e4f5g6h7i8j9k0l1",
        "name": "ADMIN",
        "description": "Administrator role with full permissions",
        "active": true,
        "permissions": [
          {
            "id": "67a1b2c3d4e5f6g7h8i9j0k1",
            "name": "Create Company",
            "apiPath": "/api/v1/companies",
            "method": "POST",
            "module": "company"
          }
        ],
        "createdAt": "2026-04-01T10:30:00Z",
        "updatedAt": null,
        "createdBy": "admin@example.com",
        "updatedBy": null
      }
    ]
  }
}
```

---

#### GET /api/v1/roles/{id}
Lấy chi tiết role theo ID

**Request:**
```
Method: GET
URL: /api/v1/roles/67b1c2d3e4f5g6h7i8j9k0l1
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Fetch role successfully",
  "data": {
    "id": "67b1c2d3e4f5g6h7i8j9k0l1",
    "name": "ADMIN",
    "description": "Administrator role with full permissions",
    "active": true,
    "permissions": [
      {
        "id": "67a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Create Company",
        "apiPath": "/api/v1/companies",
        "method": "POST",
        "module": "company"
      }
    ],
    "createdAt": "2026-04-01T10:30:00Z",
    "updatedAt": null,
    "createdBy": "admin@example.com",
    "updatedBy": null
  }
}
```

---

#### POST /api/v1/roles
Tạo role mới

**Request:**
```
Method: POST
URL: /api/v1/roles
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "name": "RECRUITER",
  "description": "Recruiter role for job posting and resume review",
  "active": true,
  "permissions": ["67a1b2c3d4e5f6g7h8i9j0k1", "67a1b2c3d4e5f6g7h8i9j0k2"]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Create role successfully",
  "data": {
    "id": "67b1c2d3e4f5g6h7i8j9k0l2",
    "name": "RECRUITER",
    "description": "Recruiter role for job posting and resume review",
    "active": true,
    "permissions": [
      {
        "id": "67a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Create Company",
        "apiPath": "/api/v1/companies",
        "method": "POST",
        "module": "company"
      }
    ],
    "createdAt": "2026-04-03T14:20:00Z",
    "updatedAt": null,
    "createdBy": "admin@example.com",
    "updatedBy": null
  }
}
```

---

#### PUT /api/v1/roles
Cập nhật role

**Request:**
```
Method: PUT
URL: /api/v1/roles
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "id": "67b1c2d3e4f5g6h7i8j9k0l2",
  "name": "RECRUITER",
  "description": "Updated recruiter description",
  "active": true,
  "permissions": ["67a1b2c3d4e5f6g7h8i9j0k1"]
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Update role successfully",
  "data": {
    "id": "67b1c2d3e4f5g6h7i8j9k0l2",
    "name": "RECRUITER",
    "description": "Updated recruiter description",
    "active": true,
    "permissions": [
      {
        "id": "67a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Create Company",
        "apiPath": "/api/v1/companies",
        "method": "POST",
        "module": "company"
      }
    ],
    "createdAt": "2026-04-03T14:20:00Z",
    "updatedAt": "2026-04-03T14:25:00Z",
    "createdBy": "admin@example.com",
    "updatedBy": "admin@example.com"
  }
}
```

---

#### DELETE /api/v1/roles/{id}
Xóa role (soft delete)

**Request:**
```
Method: DELETE
URL: /api/v1/roles/67b1c2d3e4f5g6h7i8j9k0l2
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Delete role successfully"
}
```

---

### 3️⃣ File Upload

#### POST /api/v1/files
Upload file (resume, logo, etc.)

**Request:**
```
Method: POST
URL: /api/v1/files
Headers: 
  Authorization: Bearer {token}
  Content-Type: multipart/form-data
Body:
  - file: <binary file>
  - folder: "resume" | "logo"
```

**Validation Rules:**
- Max file size: 5MB
- Resume folder: .pdf, .doc, .docx only
- Logo folder: .png, .jpg, .jpeg, .webp only

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Upload file successfully",
  "data": {
    "fileName": "uploads/resume/d3a4f5a6-b8c9-4f4a-a8a9-3aaac3bbaa5f.pdf"
  }
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit",
  "error": "FILE_SIZE_EXCEEDED"
}
```

---

### 4️⃣ Get Resumes by User

#### POST /api/v1/resumes/by-user
Lấy danh sách resumes của user hiện tại

**Request:**
```
Method: POST
URL: /api/v1/resumes/by-user
Headers: Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Fetch user resumes successfully",
  "data": [
    {
      "id": "67c1d2e3f4g5h6i7j8k9l0m1",
      "email": "user@example.com",
      "userId": "67a1b2c3d4e5f6g7h8i9j0k1",
      "url": "uploads/resume/d3a4f5a6-b8c9-4f4a-a8a9-3aaac3bbaa5f.pdf",
      "status": "PENDING",
      "companyId": "67a1b2c3d4e5f6g7h8i9j0k1",
      "jobId": "67a1b2c3d4e5f6g7h8i9j0k2",
      "history": [
        {
          "status": "PENDING",
          "updatedAt": "2026-04-03T14:20:00Z",
          "updatedBy": {
            "id": "67a1b2c3d4e5f6g7h8i9j0k1",
            "email": "recruiter@example.com"
          }
        }
      ],
      "createdAt": "2026-04-03T14:20:00Z",
      "updatedAt": "2026-04-03T14:20:00Z"
    }
  ]
}
```

---

## 🟡 OPTIONAL - Nice to have

### 5️⃣ Advanced Job Filtering

#### GET /api/v1/jobs (Enhancement)
Support filter queries

**Request:**
```
Method: GET
URL: /api/v1/jobs?page=1&pageSize=10&filter=level=='JUNIOR',salary<=50000000,location=='HCM'
Headers: Authorization: Bearer {token}
```

**Supported Filters:**
- `level` – INTERN, FRESHER, JUNIOR, MIDDLE, SENIOR
- `salary` – range: salary>=X AND salary<=Y
- `location` – string
- `active` – true/false
- `skills` – comma separated skill ids
- `company` – company id

---

## ✅ Implementation Checklist

### Permission Endpoints
- [ ] `GET /api/v1/permissions` (list with pagination)
- [ ] `GET /api/v1/permissions/{id}` (get by id)
- [ ] `POST /api/v1/permissions` (create)
- [ ] `PUT /api/v1/permissions` (update)
- [ ] `DELETE /api/v1/permissions/{id}` (soft delete)

### Role Endpoints
- [ ] `GET /api/v1/roles` (list with pagination)
- [ ] `GET /api/v1/roles/{id}` (get by id)
- [ ] `POST /api/v1/roles` (create)
- [ ] `PUT /api/v1/roles` (update)
- [ ] `DELETE /api/v1/roles/{id}` (soft delete)

### File Upload
- [ ] `POST /api/v1/files` (multipart upload)
- [ ] File validation (size, type, folder)
- [ ] Folder structure creation

### Resume Features
- [ ] `POST /api/v1/resumes/by-user` (get user's resumes)

### Optional Enhancements
- [ ] Advanced job filtering
- [ ] API documentation in Swagger/OpenAPI
- [ ] Postman collection

---

## 🔒 Security Requirements

All endpoints (except Auth) must include:

1. **JWT Token Validation**
   - Check `Authorization: Bearer {token}` header
   - Verify token signature and expiration

2. **Permission Check**
   - Verify user has permission to access this endpoint
   - Match: `method + apiPath` with user's role permissions

3. **Audit Logging**
   - Store `createdBy` and `updatedBy` for all operations
   - Track `createdAt` and `updatedAt` timestamps

---

## 📝 Error Responses

All error responses should follow this format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "ERROR_CODE" // optional
}
```

**Common Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (no permission)
- 404: Not Found
- 500: Server Error

---

## 📦 Deliverables

When submitting completed APIs, include:

- [ ] Source code (controllers, services, repositories)
- [ ] Database migration scripts (if schema changed)
- [ ] Seeding data (permissions, roles)
- [ ] Postman collection (API examples)
- [ ] API documentation (if different from this spec)

---

## 📞 Questions & Support

For clarifications or issues, contact Frontend team at: **frontend@jodhunter.dev**

**Last Updated:** April 3, 2026
