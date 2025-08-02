const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const router = express.Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).send('Invalid or missing TMDB ID');
  }

  try {
    const tmdbApiKey = process.env.TMDB_API_KEY || 'ea97a714a43a0e3481592c37d2c7178a';
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}&language=en-US&append_to_response=videos,images,credits,external_ids,release_dates,watch/providers,similar,keywords,recommendations`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.status_message || 'Failed to fetch data' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
