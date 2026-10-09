/**
 * CRISTEL LACEA PORTFOLIO — NODE.JS SERVER
 * Express backend serving portfolio static assets, projects API, and contact endpoints.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all projects
app.get('/api/projects', (req, res) => {
  const dataPath = path.join(__dirname, 'public', 'data', 'projects.json');
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading projects.json:', err);
      return res.status(500).json({ error: 'Unable to load projects database' });
    }
    try {
      const projects = JSON.parse(data);
      res.json(projects);
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse projects data' });
    }
  });
});

// API: Handle contact form submissions
app.post('/api/contact', (req, res) => {
  const { name, email, project_type, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide name, email, and project message.' 
    });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    name,
    email,
    project_type: project_type || 'unspecified',
    message
  };

  console.log('⚡ New Client Inquiry Received:', logEntry);

  // Return success response to user
  res.json({
    success: true,
    message: `Thank you ${name}! Transmission received. Cristel will review your brief shortly.`
  });
});

// Fallback to index.html for SPA-style routing if needed
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  CRISTEL LACEA PORTFOLIO — NODE.JS SERVER`);
  console.log(`  Live at: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
