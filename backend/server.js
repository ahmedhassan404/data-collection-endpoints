import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import metadataRoutes from './routes/metadata.js';
import dependenciesRoutes from './routes/dependencies.js';
import vulnerabilitiesRoutes from './routes/vulnerabilities.js';
import licenseRoutes from './routes/license.js';
import registryRoutes from './routes/registry.js';
import sbomRoutes from './routes/sbom.js';
import githubRoutes from './routes/github.js';
import staticAnalysisRoutes from './routes/static-analysis.js';
import maliciousPackagesRoutes from './routes/malicious-packages.js';
import benignPackagesRoutes from './routes/benign-packages.js';
import collectionRoutes from './routes/collection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/metadata', metadataRoutes);
app.use('/api/dependencies', dependenciesRoutes);
app.use('/api/vulnerabilities', vulnerabilitiesRoutes);
app.use('/api/license-info', licenseRoutes);
app.use('/api/package-registry', registryRoutes);
app.use('/api/sbom', sbomRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/static-analysis', staticAnalysisRoutes);
app.use('/api/malicious-packages', maliciousPackagesRoutes);
app.use('/api/benign-packages', benignPackagesRoutes);
app.use('/api/collection', collectionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

