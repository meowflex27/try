const express = require('express');
const cors = require('cors');
const movieRoute = require('./routes/movie');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/movie', movieRoute);

app.get('/', (req, res) => {
  res.send('Meowflex API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
