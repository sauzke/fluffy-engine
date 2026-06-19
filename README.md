# Budget Tracker Application

A lightweight Vue 3 budget tracking application with automatic credit card statement parsing, spending analytics, and historical month-over-month comparisons.

## Features

- 📊 **Dashboard**: View total spending and transaction count at a glance
- 📈 **Charts & Analytics**: Pie charts, doughnut charts, and category breakdowns
- � **CSV Import**: Upload transaction exports for automatic statement parsing
- 📅 **Month Navigation**: Browse previous and current months to track spending patterns
- 💳 **Category Tracking**: Organize transactions by spending categories
- 🔄 **Real-time Updates**: Data refreshes automatically after uploading new statements

## Project Structure

```
budget-tracker/
├── docker-compose.yml          # PostgreSQL container config
├── .env.example                # Environment variables template
├── backend/                    # Node.js + Express API
│   ├── server.js
│   ├── models/                 # Sequelize models
│   ├── routes/api.js           # API endpoints
│   ├── services/               # Business logic
│   ├── middleware/
│   ├── scripts/seed.js         # Database seeding
│   └── package.json
├── frontend/                   # Vue 3 + Vite SPA
│   ├── src/
│   │   ├── components/         # Vue components
│   │   ├── pages/              # Page components
│   │   ├── stores/             # Pinia state management
│   │   ├── api/                # API client
│   │   ├── styles/             # CSS
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── database/                   # Migration files (future)
```

## Prerequisites

- Node.js 16+ (download from https://nodejs.org/)
- Docker & Docker Compose (download from https://www.docker.com/)
- npm (comes with Node.js)

## Setup Instructions

### 1. Clone/Navigate to the project

```bash
cd d:\Dev\budget-tracker
```

### 2. Environment Setup

Copy the environment template:

```bash
copy .env.example .env
```

The `.env` file includes:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL connection
- `BACKEND_PORT` — Express server port (default: 5000)
- `VITE_API_URL` — Frontend API endpoint

### 3. Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify the container is running:

```bash
docker-compose logs postgres
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 5. Initialize Database

Seed the database with default categories:

```bash
cd backend
npm run seed
cd ..
```

This creates the `categories` table with predefined categories:
- Dining
- Groceries
- Transportation
- Utilities
- Health & Fitness
- Shopping
- Subscriptions
- Travel
- Other

### 6. Start Backend Server

```bash
cd backend
npm run dev
```

The server will run on `http://localhost:5000`

You should see:
```
Database connection established
Database models synchronized
Server running on http://localhost:5000
```

### 7. Install Frontend Dependencies

In a new terminal:

```bash
cd frontend
npm install
cd ..
```

### 8. Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The application will open at `http://localhost:5173`

## Usage

1. **View Dashboard**: The main page displays your current month's spending summary
2. **Navigate Months**: Use the "Prev" / "Next" buttons to browse previous months
3. **Upload Statements**: Click "� Upload CSV" and select a transaction CSV export
   - Drag and drop also works
   - Works with American Express activity exports or any CSV with Date and Amount columns
4. **View Charts**: Category breakdown appears in pie and doughnut charts
5. **Browse Transactions**: View all transactions in the table, sorted by date

## API Endpoints

All endpoints return JSON and are prefixed with `/api`:

### Transactions
- `GET /transactions?month=YYYY-MM` — Get transactions for a specific month
- `GET /summary?month=YYYY-MM` — Get spending summary by category

### Upload
- `POST /upload` — Upload a PDF file (multipart form data)

### Categories
- `GET /categories` — Get all categories
- `POST /categories` — Create a new category (body: `{ name, color }`)

## Database Schema

### Categories
```sql
id (INTEGER, PK)
name (STRING, UNIQUE)
color (STRING)
createdAt, updatedAt
```

### Transactions
```sql
id (INTEGER, PK)
description (STRING)
amount (DECIMAL)
date (DATE)
external_id (STRING) -- For future duplicate detection
uploadId (INTEGER, FK)
categoryId (INTEGER, FK)
createdAt, updatedAt
```

### Uploads
```sql
id (INTEGER, PK)
filename (STRING)
filepath (STRING)
status (ENUM: pending, processing, completed, failed)
transactionCount (INTEGER)
errorMessage (TEXT)
createdAt, updatedAt
```

## PDF Parsing Framework

The backend includes extensible framework functions in `backend/services/pdfParsingService.js`:

- `parseTransactions(pdfBuffer)` — Extracts transactions from PDF
- `extractCategoryFromDescription(description)` — Maps description to category
- `formatAmount(rawAmount)` — Normalizes amounts

These currently return mock data and can be easily replaced with real logic when test PDFs are provided.

## Development Notes

### Adding Test Transactions

To manually add test transactions without uploading a PDF:

1. Connect to PostgreSQL:
   ```bash
   docker exec -it budget_tracker_db psql -U budgetuser -d budget_tracker
   ```

2. Run SQL:
   ```sql
   INSERT INTO transactions (description, amount, date, "categoryId", "createdAt", "updatedAt")
   VALUES ('Coffee Shop', 5.50, '2024-01-15', 1, NOW(), NOW());
   ```

### Troubleshooting

**Port Already in Use**
- Backend: Change `BACKEND_PORT` in `.env`
- Frontend: Frontend automatically finds available port

**Database Connection Error**
- Verify Docker is running: `docker ps`
- Check env variables in `.env`
- Reset database: `docker-compose down -v && docker-compose up -d`

**CORS Errors**
- Verify `VITE_API_URL` matches your backend URL in frontend `.env`

## Next Steps

1. **PDF Parsing**: When test credit card statements are provided:
   - Update `parseTransactions()` in `pdfParsingService.js`
   - Implement category detection logic
   - Add duplicate detection using transaction UUIDs

2. **Features**:
   - Add spending trend line chart over multiple months
   - Implement budget limits per category
   - Add expense filtering and search
   - Export reports as CSV

3. **Improvements**:
   - Add data validation and error handling
   - Implement transaction editing/deletion
   - Add bulk import support
   - Create mobile app version

## Production Build

### Build Frontend

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`

### Production Deployment

For production use, consider:
- Setting `NODE_ENV=production` in `.env`
- Using a reverse proxy (Nginx) to serve frontend and proxy API
- Implementing authentication (currently skipped)
- Using connection pooling for database
- Setting up automated backups for PostgreSQL

## License

MIT
