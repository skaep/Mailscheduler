const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow requests from both localhost:5173 and your production domain
const whitelist = process.env.DOMAIN ? process.env.DOMAIN.split(',') : [];
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl)
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Request niet toegestaan vanaf huidige URL"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/schedules', require('./routes/schedules'));
app.use('/recipients', require('./routes/recipients'));

app.get('/', (req, res) => {
  res.send('schedule API is running');
});

const PORT = process.env.PORT || 6002;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
