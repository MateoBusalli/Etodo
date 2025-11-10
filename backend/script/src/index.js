const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
  console.log('Loaded .env file from:', envPath);
} else {
  console.log('No .env file found');
}

const db = require("./config/db.js");
const todosRoutes = require('./routes/todos/todos.js');
const authRoutes = require('./routes/auth/auth.js');
const userRoutes = require('./routes/user/user.js');
const { errorHandler } = require('./middleware/errorHandler.js');


//lignes de debug
console.log('todosRoutes:', typeof todosRoutes, todosRoutes);
console.log('authRoutes:', typeof authRoutes, authRoutes);
console.log('userRoutes:', typeof userRoutes, userRoutes);



const app = express();
const port = process.env.PORT || 3001;

console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('PORT:', port);


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
app.use("/api/auth", authRoutes);
app.use("/api", todosRoutes);
app.use("/api", userRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'DoNext API is running' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    error: "Route not found",
    path: req.originalUrl
  });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log("Server started to " + port);
});
