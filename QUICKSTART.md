# Quick Start Guide

This file provides the fastest way to get the budget tracker up and running.

## Prerequisites
- Node.js 16+ installed
- Docker installed and running
- Two terminal windows ready

## One-Time Setup (5 minutes)

### Terminal 1: Database & Backend

```powershell
# 1. Start PostgreSQL
docker-compose up -d

# 2. Install backend dependencies
cd backend
npm install

# 3. Seed database with default categories
npm run seed

# 4. Start backend (leave running)
npm run dev
```

Backend is ready when you see: `Server running on http://localhost:5000`

### Terminal 2: Frontend

```powershell
# 1. Install frontend dependencies
cd frontend
npm install

# 2. Start frontend dev server
npm run dev
```

Application opens automatically at `http://localhost:5173`

## Daily Usage

Simply run these two commands in separate terminals:

**Terminal 1:**
```powershell
cd backend && npm run dev
```

**Terminal 2:**
```powershell
cd frontend && npm run dev
```

## Quick Verification

- Dashboard should load with mock data
- Month picker works (Prev/Next buttons)
- File upload button is visible
- Charts display (even if empty)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `EADDRINUSE` (port in use) | Change `BACKEND_PORT` in `.env` files |
| Database connection error | Run `docker-compose ps` to verify container is running |
| `Can't find module 'express'` | Run `npm install` in the respective directory |
| CORS error | Verify `VITE_API_URL` in `frontend/.env` matches backend URL |

## Next Steps

1. Test with the mock data currently in the app
2. Prepare credit card statement PDFs for testing
3. Update `backend/services/pdfParsingService.js` with real PDF parsing logic
4. Add duplicate detection using transaction UUIDs

## Files to Remember

- **Backend config**: `backend/.env`
- **Frontend config**: `frontend/.env`
- **Database config**: `docker-compose.yml`
- **PDF parsing logic**: `backend/services/pdfParsingService.js`
- **API endpoints**: `backend/routes/api.js`
