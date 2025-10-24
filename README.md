# UBND API - Hướng dẫn chạy dự án

## Yêu cầu hệ thống

- Node.js >= 18.x
- PostgreSQL >= 13.x

## Hướng dẫn chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Setup Database

```bash
# Generate Prisma Client (database đã có sẵn tables)
npx prisma generate
```

### 3. Chạy ứng dụng

```bash
# Development
npm run dev

# Production
npm start
```

Server chạy tại: `http://localhost:8080`  
API Docs: `http://localhost:8080/api-docs`  
Prisma Studio: `npx prisma studio` (http://localhost:5555)
