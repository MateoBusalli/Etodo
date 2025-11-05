const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config({ 
  path: path.join(__dirname, '../../.env') 
});

const db = require("./config/db.js");
const todosRoutes = require('./routes/todos/todos.js');
const authRoutes = require('./routes/auth/auth.js');
const userRoutes = require('./routes/user/user.js');

const app = express();
const port = process.env.PORT || 3001;

console.log('Loaded env from:', path.join(__dirname, '../../.env'));
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", authRoutes);
app.use("/api", todosRoutes);
app.use("/api", userRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'DoNext API is running!' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: "Route non trouvée au port: " + port,
    path: req.originalUrl
  });
});

// Start server
app.listen(port, () => {
  console.log("Le serveur a démarré au port " + port);
});