const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'ea97a714a43a0e3481592c37d2c7178a';

app.use(cors());

app.get('/movie/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    res.status(400).send('Invalid or missing TMDB ID');
    return;
  }

  try {
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,images,release_dates,credits,external_ids,translations`);
    if (!tmdbRes.ok) throw new Error('TMDB fetch failed');

    const data = await tmdbRes.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch data from TMDB');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
