# 🌍 Country Data & Exchange Rate API

This is a RESTful API built for **HNG Stage 2**, designed to fetch comprehensive country data and current currency exchange rates, compute an estimated Gross Domestic Product (GDP), and cache all results in a MySQL database.

The API provides endpoints for data refresh, status checks, data retrieval (with filtering and sorting), single-country lookup, and generating a summary image.

---

## 🚀 Features

- **Data Orchestration (POST /countries/refresh):**  
  Fetches country and exchange rate data, computes `estimated_gdp`, and performs an UPSERT (Update or Insert) transaction to cache data.

- **Data Persistence:**  
  Uses MySQL as the primary cache and Knex.js for database interaction and migrations.

- **Comprehensive Queries:**  
  Supports listing, filtering (by region, currency), sorting (by name, population, estimated_gdp), and pagination.

- **Image Generation:**  
  Generates a `cache/summary.png` file with the total country count, refresh timestamp, and top 5 countries by GDP using the `canvas` library.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** MySQL  
- **Database ORM/Query Builder:** Knex.js  
- **External APIs:** [restcountries.com](https://restcountries.com) and [open.er-api.com](https://open.er-api.com)  
- **Image Processing:** canvas  

---

## ⚙️ Setup and Installation

### 1. Prerequisites

You must have the following installed on your local machine:

- Node.js (v18+)  
- npm (v9+)  
- MySQL Server (v8+)  

---

### 2. Clone the Repository

```bash
git clone [YOUR_REPO_LINK]
cd hng-stage2-country-api

Ah! Got it — you want **everything from Step 3 onward fully in Markdown** including commands, code blocks, tables, etc., for easy copy. Here's the complete version:

````markdown
### 3. Install Dependencies

```bash
npm install
````

---

### 4. Configure Environment Variables

Create a file named `.env` in the root directory and populate it with your database and configuration settings.

```env
# Server Configuration
PORT=3000

# Database Configuration 
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=hng_stage2

# External API URLs (DO NOT CHANGE THESE)
COUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD
```

> **Note:** `.env` contains sensitive information and should **not** be committed. Use `.env.example` as a template for others.

---

### 5. Database Setup (Migrations)

Run the Knex migrations to create the required `countries` and `status` tables:

```bash
npm run migrate
```

*(To reverse migrations for development, use `npm run rollback`)*

---

## ▶️ Running the Application

To run the application locally with auto-restarts using nodemon:

```bash
npm run dev
```

The server will be running at `http://localhost:3000`.

---

## 🧪 API Endpoints and Testing

Use `curl` or any API client (like Postman or Insomnia) to test the endpoints.

### 1. Data Refresh (Initial Setup)

This is the first endpoint you must call to populate the database and generate the summary image.

| Method | Endpoint           | Description                                                      |
| ------ | ------------------ | ---------------------------------------------------------------- |
| POST   | /countries/refresh | Fetches data, calculates GDP, caches records, and updates status |

```bash
# Execute the refresh
curl -X POST http://localhost:3000/countries/refresh
```

---

### 2. Status & Image Endpoints

| Method | Endpoint          | Description                                         |
| ------ | ----------------- | --------------------------------------------------- |
| GET    | /countries/status | Returns total countries and `last_refreshed_at`     |
| GET    | /countries/image  | Serves the generated `cache/summary.png` image file |

```bash
# Get cache status
curl http://localhost:3000/countries/status

# Download the summary image
curl -o summary.png http://localhost:3000/countries/image
```

---

### 3. Data Retrieval and Manipulation

| Method | Endpoint         | Description                                            |
| ------ | ---------------- | ------------------------------------------------------ |
| GET    | /countries       | Lists countries with filters, sorting, and pagination  |
| GET    | /countries/:name | Gets one country by name or capital (case-insensitive) |
| DELETE | /countries/:name | Deletes a country record by name (case-insensitive)    |

**Examples:**

```bash
# List with Filters
curl "http://localhost:3000/countries?region=africa&currency=USD"

# Pagination & Sorting
curl "http://localhost:3000/countries?sortBy=population&sortOrder=desc&limit=5"

# Lookup by Name
curl http://localhost:3000/countries/Nigeria

# Delete Record
curl -X DELETE http://localhost:3000/countries/Nigeria
```

---

## 📦 Submission Notes

* **API Base URL:** Submit your URL from an approved hosting provider (e.g., Heroku, Railway, AWS).
* **Dependencies:** All dependencies are listed in `package.json`. Run `npm install` before deployment.
* **Database:** Ensure your production database is configured via environment variables on the hosting platform, and run the migrations (`npm run migrate`) on the production server if required by your host's setup process.

```

```
