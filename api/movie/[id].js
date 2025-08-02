const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/movie/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).send('Invalid or missing TMDB ID');
  }

  try {
    const tmdbId = id;
    const tmdbApiKey = process.env.TMDB_API_KEY || 'ea97a714a43a0e3481592c37d2c7178a';

    const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey}`);
    const tmdbData = await tmdbRes.json();

    const backdropPath = tmdbData.backdrop_path || tmdbData.poster_path || '';
    const movieTitle = tmdbData.title || 'Untitled Movie';
    const releaseYear = tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${movieTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    html, body { margin:0; padding:0; background:black; width:100vw; height:100vh; overflow:hidden; color:white; font-family:sans-serif; }
    #videoContainer { position:relative; width:100vw; height:100vh; background:black; }
    #moviePlayer { position:absolute; top:0; left:0; width:100vw; height:100vh; object-fit:cover; z-index:1; }
    #movieTitleText { position:absolute; top:20px; left:20px; font-size:20px; background:rgba(0,0,0,0.5); padding:4px 10px; border-radius:5px; z-index:5; }
    #resolutionLabel { position:absolute; top:20px; right:20px; background:rgba(0,0,0,0.6); padding:4px 10px; font-size:14px; border-radius:4px; z-index:5; display:none; }
    .custom-controls { position:absolute; bottom:0; left:0; right:0; z-index:5; background:rgba(0,0,0,0.7); padding:10px; display:flex; align-items:center; gap:10px; }
    .custom-controls button, .custom-controls input[type="range"], .custom-controls select { background:none; border:none; color:white; cursor:pointer; }
    .custom-controls button i { font-size:20px; }
    .custom-controls input[type="range"] { width:100px; }
    #seekBar { flex:1; }
    #centerPlayButton { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:60px; color:white; background:rgba(0,0,0,0.4); border:none; border-radius:50%; padding:20px; z-index:6; cursor:pointer; }
    #centerPlayButton.hidden { opacity:0; pointer-events:none; }
    #subtitleMenu { position:absolute; bottom:60px; right:100px; background:rgba(0,0,0,0.8); padding:10px; border-radius:6px; display:none; z-index:10; }
    #subtitleMenu button { display:block; background:none; color:white; border:none; text-align:left; padding:5px; cursor:pointer; font-size:14px; }
  </style>
</head>
<body>
  <main id="videoContainer">
    <video id="moviePlayer" playsinline crossorigin="anonymous" preload="auto" poster="${backdropPath ? 'https://image.tmdb.org/t/p/original' + backdropPath : ''}">
      <source id="movieSource" src="" type="video/mp4" />
    </video>

    <div class="custom-controls" id="controls">
      <button id="playPause"><i class="fas fa-play"></i></button>
      <button id="rewind"><i class="fas fa-rotate-left"></i></button>
      <button id="forward"><i class="fas fa-rotate-right"></i></button>
      <input type="range" id="seekBar" value="0" min="0" max="100" step="0.1">
      <span id="timeDisplay">0:00 / 0:00</span>
      <input type="range" id="volume" min="0" max="1" step="0.01" value="1">
      <select id="speed">
        <option value="0.5">0.5x</option>
        <option value="1" selected>1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
      </select>
      <button id="toggleCaptions"><i class="fas fa-closed-captioning"></i></button>
      <button id="resolutionSwitch"><i class="fas fa-cog"></i></button>
      <button id="fullscreen"><i class="fas fa-expand"></i></button>
    </div>

    <div id="subtitleMenu"></div>
    <button id="centerPlayButton" aria-label="Play">&#9658;</button>
    <div id="movieTitleText">${movieTitle}${releaseYear ? ` (${releaseYear})` : ''}</div>
    <div id="resolutionLabel"></div>
  </main>

  <script>
    const player = document.getElementById('moviePlayer');
    const source = document.getElementById('movieSource');
    const playBtn = document.getElementById('centerPlayButton');
    const controls = document.getElementById('controls');
    const playPause = document.getElementById('playPause');
    const rewind = document.getElementById('rewind');
    const forward = document.getElementById('forward');
    const seekBar = document.getElementById('seekBar');
    const timeDisplay = document.getElementById('timeDisplay');
    const volume = document.getElementById('volume');
    const speed = document.getElementById('speed');
    const fullscreenBtn = document.getElementById('fullscreen');
    const resolutionLabel = document.getElementById('resolutionLabel');
    const toggleCaptions = document.getElementById('toggleCaptions');
    const resolutionSwitch = document.getElementById('resolutionSwitch');
    const subtitleMenu = document.getElementById('subtitleMenu');

    let selected = null;
    let bufferedUrl = '';
    let subtitleTracks = [];

    function formatTime(s) {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60).toString().padStart(2, '0');
      return m + ":" + sec;
    }

    function updateUI() {
      seekBar.max = player.duration;
      seekBar.value = player.currentTime;
      timeDisplay.textContent = formatTime(player.currentTime) + " / " + formatTime(player.duration);
    }

    async function convertSrtToVtt(srtUrl) {
      const res = await fetch(srtUrl);
      const srtText = await res.text();
      const vttText = "WEBVTT\\n\\n" + srtText
        .replace(/\\r/g, "")
        .replace(/(\\d+)\\n(\\d{2}:\\d{2}:\\d{2}),(\\d{3}) --> (\\d{2}:\\d{2}:\\d{2}),(\\d{3})/g,
                "$2.$3 --> $4.$5");
      const blob = new Blob([vttText], { type: "text/vtt" });
      return URL.createObjectURL(blob);
    }

    async function loadSubtitles(captions) {
      subtitleTracks = [];
      for (let c of captions) {
        const vtt = await convertSrtToVtt(c.url);
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = c.label || c.lan || 'Subtitle';
        track.srclang = c.lan || 'en';
        track.src = vtt;
        player.appendChild(track);
        subtitleTracks.push(track);
      }
      buildSubtitleMenu();
    }

    function buildSubtitleMenu() {
      subtitleMenu.innerHTML = '';
      subtitleTracks.forEach((track, i) => {
        const btn = document.createElement('button');
        btn.textContent = track.label;
        btn.onclick = () => {
          for (let t of player.textTracks) t.mode = 'disabled';
          player.textTracks[i].mode = 'showing';
          subtitleMenu.style.display = 'none';
        };
        subtitleMenu.appendChild(btn);
      });
      const offBtn = document.createElement('button');
      offBtn.textContent = 'Turn Off';
      offBtn.onclick = () => {
        for (let t of player.textTracks) t.mode = 'disabled';
        subtitleMenu.style.display = 'none';
      };
      subtitleMenu.appendChild(offBtn);
    }

    async function preloadMovieWithStream(id) {
      const res = await fetch(\`https://railway-production-b773.up.railway.app/movie/\${id}\`);
      const data = await res.json();
      const sources = data.downloadData?.data?.downloads || [];
      const captions = data.downloadData?.data?.captions || [];
      const preferredOrder = [1080, 720, 480, 360];

      for (let res of preferredOrder) {
        selected = sources.find(s => (s.resolution || '').toString().replace(/[pP]/g, '') == res.toString());
        if (selected) break;
      }

      if (!selected) {
        alert("No playable resolution available.");
        return;
      }

      bufferedUrl = \`https://movie-proxy-gules.vercel.app/api/proxy?video=\${encodeURIComponent(selected.url)}\`;
      resolutionLabel.textContent = selected.resolution + 'p';
      resolutionLabel.style.display = 'block';

      if (!selected.url.endsWith('.m3u8')) {
        source.src = bufferedUrl;
        player.load();
      } else if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 10 });
        hls.loadSource(bufferedUrl);
        hls.attachMedia(player);
      }

      loadSubtitles(captions);
    }

    window.addEventListener('DOMContentLoaded', () => {
      preloadMovieWithStream('${tmdbId}');

      playBtn.onclick = () => player.paused ? player.play() : player.pause();
      player.addEventListener('click', () => player.paused ? player.play() : player.pause());

      player.addEventListener('play', () => {
        playBtn.classList.add('hidden');
        playPause.innerHTML = '<i class="fas fa-pause"></i>';
      });

      player.addEventListener('pause', () => {
        playBtn.classList.remove('hidden');
        playPause.innerHTML = '<i class="fas fa-play"></i>';
      });

      player.addEventListener('timeupdate', updateUI);
      seekBar.addEventListener('input', () => player.currentTime = seekBar.value);
      volume.addEventListener('input', () => player.volume = volume.value);
      speed.addEventListener('change', () => player.playbackRate = parseFloat(speed.value));
      rewind.onclick = () => player.currentTime -= 10;
      forward.onclick = () => player.currentTime += 10;
      playPause.onclick = () => player.paused ? player.play() : player.pause();
      fullscreenBtn.onclick = () => {
        if (document.fullscreenElement) document.exitFullscreen();
        else player.requestFullscreen();
      };
      toggleCaptions.onclick = () => {
        subtitleMenu.style.display = subtitleMenu.style.display === 'block' ? 'none' : 'block';
      };
      resolutionSwitch.onclick = () => {
        alert('Resolution switching not yet implemented.');
      };
    });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error('[handler error]:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
