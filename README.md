# Data Collection Prototype

A full-stack prototype demonstrating ChainGuard's data collection resources for Supply Chain Security. This project showcases how various data sources (package metadata, dependencies, vulnerabilities, licenses, etc.) are collected and structured for ML training.

## 🏗️ Project Structure

```
data-collection-prototype/
├── backend/                 # Node.js + Express API
│   ├── routes/             # API route definitions
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic & mock data
│   ├── utils/              # Utility functions
│   └── server.js           # Express server entry point
│
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── config/         # Resource configurations
│   │   └── App.jsx         # Main application
│   └── package.json
│
└── DATA_COLLECTION_GUIDE.md # Comprehensive data collection guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Two terminal windows (one for backend, one for frontend)

### Installation & Running

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

4. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

5. **Open your browser:**
   Navigate to `http://localhost:3000` to see the Data Collection Playground

## 📡 API Endpoints

All endpoints return mock JSON responses demonstrating the structure of real data:

### 1. Package Metadata
- **GET** `/api/metadata?packageName=express&version=4.18.2`
- Returns package metadata from npm registry

### 2. Dependency Graph
- **GET** `/api/dependencies?packageName=express&version=4.18.2`
- Returns direct dependencies from package.json

### 3. Indirect Dependencies
- **GET** `/api/dependencies/indirect?packageName=express&depth=5`
- Returns complete transitive dependency graph

### 4. Vulnerability Data
- **GET** `/api/vulnerabilities?packageName=express&source=all`
- Aggregates vulnerabilities from NVD, OSV, GitHub, npm audit, OSS Index

### 5. License Information
- **GET** `/api/license-info?packageName=express&includeTransitive=true`
- Returns license information and compatibility analysis

### 6. Package Registry Data
- **GET** `/api/package-registry?packageName=express`
- Returns comprehensive registry data including download stats

### 7. SBOM Generation
- **GET** `/api/sbom?packageName=express&format=spdx`
- Generates Software Bill of Materials in JSON, SPDX, or CycloneDX format

## 🎨 Frontend Features

- **Resource Selector**: Choose from 7 different data collection resources
- **Request Preview**: Configure parameters and see the request URL
- **Response Viewer**: View formatted JSON responses with syntax highlighting
- **Real API Information**: See what real APIs are used for each resource

## 🔧 Technology Stack

### Backend
- **Node.js** with ES modules
- **Express.js** for REST API
- **CORS** enabled for frontend communication

### Frontend
- **React 18** with hooks
- **Vite** for fast development
- **TailwindCSS** for styling
- **Axios** for API calls (via fetch API)

## 📚 Documentation

See `DATA_COLLECTION_GUIDE.md` for:
- Detailed explanation of each data collection resource
- Real API endpoints and implementation details
- Data structures and schemas
- Collection strategies and best practices

## 🧪 Testing the API

You can test endpoints directly using curl:

```bash
# Package Metadata
curl "http://localhost:3001/api/metadata?packageName=express"

# Dependencies
curl "http://localhost:3001/api/dependencies?packageName=express"

# Vulnerabilities
curl "http://localhost:3001/api/vulnerabilities?packageName=express&source=all"

# Health Check
curl "http://localhost:3001/health"
```

## 🏗️ Real Implementation Notes

This is a **prototype** with mock data. In production, the services would:

1. **Package Metadata**: Call `https://registry.npmjs.org/{packageName}` directly
2. **Dependencies**: Parse `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`
3. **Vulnerabilities**: Query multiple APIs:
   - NVD: `https://services.nvd.nist.gov/rest/json/cves/2.0`
   - OSV: `https://api.osv.dev/v1/query`
   - GitHub: `https://api.github.com/advisories`
   - npm audit: Run programmatically
   - OSS Index: `https://ossindex.sonatype.org/api/v3/component-report`
4. **Licenses**: Parse package.json and check LICENSE files
5. **SBOM**: Build complete dependency tree and format per standards

All service files include comments explaining the real implementation approach.

## 📝 License

MIT

## 🤝 Contributing

This is a prototype project. For production implementation, refer to `DATA_COLLECTION_GUIDE.md` for detailed specifications.

