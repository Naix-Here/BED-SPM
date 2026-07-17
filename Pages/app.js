require('dotenv').config();

const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const patronRoutes = require('./routes/patronRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use('/api/auth', authRoutes);
app.use('/api/patron', patronRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`HawkerHub is running at http://localhost:${port}`));
