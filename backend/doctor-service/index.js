const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const doctorRoutes = require('./routes/doctorRoutes');
const specializationRoutes = require('./routes/specializationRoutes');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctordb';

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Doctor Service API',
      version: '1.0.0',
      description: 'Doctor Service API for Healthcare Appointment System',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/specializations', specializationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'doctor-service' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Default error response
  const errorResponse = {
    message: err.message || 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.stack : {},
  };

  // Set appropriate status code
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json(errorResponse);
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Doctor service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
