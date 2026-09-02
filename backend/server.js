require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const tripRoutes = require('./routes/tripRoutes');


const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/trips', tripRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend server is running',
        timestamp: new Date().toISOString(),
    });
});

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});