const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
app.use(cors());

app.get('/movie/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).send('Invalid or missing TMDB ID');
  }

  try {
    const tmdbApiKey = process.env.TMDB_API_KEY || 'ea97a714a43a0e3481592c37d2c7178a';
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${tmdbApiKey}`);
    const tmdbData = await tmdbRes.json();

    const title = tmdbData.title || 'Untitled';
    const year = tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : '';
    const backdrop = tmdbData.backdrop_path || tmdbData.poster_path || '';
    const backdropUrl = backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} (${year})</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    html, body { margin: 0; background: black; height: 100vh; color: white; font-family: sans-serif; }
    video { width: 100vw; height: 100vh; object-fit: cover; }
    #title { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.5); padding: 6px 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <div id="title">${title} ${year ? `(${year})` : ''}</div>
  <video id="video" controls autoplay poster="${backdropUrl}"></video>
  <script>
    async function load() {
      const res = await fetch('https://railway-production-b773.up.railway.app/movie/${id}');
      const data = await res.json();
      const video = document.getElementById('video');

      if (data.url && data.url.endsWith('.m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(data.url);
          hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = data.url;
        }
      } else if (data.url) {
        video.src = data.url;
      }
    }
    load();
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error('[Error]:', err);
    res.status(500).send('Internal Server Error');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
