export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || isNaN(id)) {
    res.status(400).send('Invalid or missing TMDB ID');
    return;
  }

  try {
    const tmdbId = id;
    const tmdbApiKey = 'ea97a714a43a0e3481592c37d2c7178a';
    const tmdbRes = await fetch(https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${tmdbApiKey});
    const tmdbData = await tmdbRes.json();
    const backdropPath = tmdbData.backdrop_path || tmdbData.poster_path || '';
    const movieTitle = tmdbData.title || 'Untitled Movie';

    const html = <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #000;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    #videoContainer {
      position: relative;
      width: 100%;
      height: calc(100vh - 100px);
      background: #000;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    #backdrop {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 2;
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }

    #moviePlayer {
      width: 100%;
      height: 100%;
      background: black;
      z-index: 1;
      object-fit: contain;
    }

    .custom-controls {
      width: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      padding: 10px;
      z-index: 3;
    }

    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .progress-bar input[type="range"] {
      width: 100%;
    }

    .button {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      margin: 0 5px;
      cursor: pointer;
    }

    .center-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 60px;
      background: rgba(0,0,0,0.5);
      border: none;
      color: white;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3;
      cursor: pointer;
    }

    #movieTitle {
      position: absolute;
      top: calc(50% + 60px);
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 22px;
      font-weight: bold;
      text-align: center;
      z-index: 3;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.8);
    }

    #volumeSlider {
      position: absolute;
      bottom: 60px;
      left: 100px;
      transform: rotate(-90deg);
      transform-origin: bottom left;
      width: 100px;
      display: none;
      z-index: 5;
    }

    .subtitle-wrapper {
      position: relative;
      display: inline-block;
    }

    #subtitleOptions {
      position: absolute;
      bottom: 40px;
      right: 0;
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 8px 10px;
      border-radius: 6px;
      display: none;
      flex-direction: column;
      z-index: 6;
    }

    #subtitleOptions button {
      background: none;
      border: none;
      color: white;
      margin: 3px 0;
      cursor: pointer;
      text-align: left;
    }

    #resolutionSelect {
      background-color: rgba(30, 30, 30, 0.95);
      color: white;
      border: 1px solid #555;
      padding: 5px;
      border-radius: 4px;
      font-size: 16px;
      cursor: pointer;
    }

    ::cue {
      background: rgba(0,0,0,0.8);
      color: #fff;
      font-size: 18px;
      line-height: 1.4;
      text-align: center;
      bottom: 80px !important;
    }

    #progress, #centerPlay {
      cursor: pointer;
    }

    /* Loading Spinner */
    #loadingSpinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 6px solid rgba(255, 255, 255, 0.3);
      border-top: 6px solid white;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      z-index: 4;
      display: none;
    }

    @keyframes spin {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="videoContainer">
    <img id="backdrop" src="${backdropPath ? 'https://image.tmdb.org/t/p/original' + backdropPath : ''}" />
    <video id="moviePlayer" playsinline crossorigin="anonymous" preload="auto"></video>
    <button id="centerPlay" class="center-play">▶</button>
    <div id="movieTitle">${movieTitle}</div>
    <input type="range" id="volumeSlider" min="0" max="1" step="0.01" />
    <div id="loadingSpinner"></div>
  </div>

  <div class="custom-controls">
    <div class="progress-bar">
      <input type="range" id="progress" value="0" min="0" step="0.1">
    </div>
    <div class="control-row">
      <div>
        <button class="button" id="playPause">⏯️</button>
        <button class="button" id="backward">⏪</button>
        <button class="button" id="forward">⏩</button>
        <button class="button" id="muteToggle">🔊</button>
      </div>
      <div>
        <select id="resolutionSelect" class="button"></select>
        <div class="subtitle-wrapper">
          <button class="button" id="subtitleBtn">CC</button>
          <div id="subtitleOptions"></div>
        </div>
        <button class="button" id="fullscreenBtn">⛶</button>
      </div>
    </div>
  </div>

  <script>
    const player = document.getElementById('moviePlayer');
    const playPauseBtn = document.getElementById('playPause');
    const muteToggle = document.getElementById('muteToggle');
    const backward = document.getElementById('backward');
    const forward = document.getElementById('forward');
    const progress = document.getElementById('progress');
    const centerPlay = document.getElementById('centerPlay');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const subtitleBtn = document.getElementById('subtitleBtn');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const volumeSlider = document.getElementById('volumeSlider');
    const subtitleOptions = document.getElementById('subtitleOptions');
    const backdrop = document.getElementById('backdrop');
    const spinner = document.getElementById('loadingSpinner');

    let sources = [];
    let captions = [];
    let currentTrack = null;

    function showSpinner() {
      spinner.style.display = 'block';
    }

    function hideSpinner() {
      spinner.style.display = 'none';
    }

    function hideBackdrop() {
      backdrop.style.display = 'none';
      centerPlay.style.display = 'none';
      document.getElementById('movieTitle').style.display = 'none';
    }

    function showBackdrop() {
      backdrop.style.display = 'block';
      centerPlay.style.display = 'flex';
      document.getElementById('movieTitle').style.display = 'block';
    }

centerPlay.addEventListener('click', async () => {
  centerPlay.style.display = 'none';
  showSpinner();
  try {
    await loadMovie('${tmdbId}');

    // only after video is fully loaded
    player.addEventListener('loadeddata', () => {
      player.play();
      hideSpinner();
      hideBackdrop();
    }, { once: true });

  } catch (e) {
    console.error('Error loading movie:', e);
    centerPlay.style.display = 'flex';
    hideSpinner();
  }
});




    playPauseBtn.addEventListener('click', () => {
      if (player.paused) {
        player.play();
        hideBackdrop();
      } else {
        player.pause();
        showBackdrop();
      }
    });

    player.addEventListener('click', () => {
      if (player.paused) {
        player.play();
        hideBackdrop();
      } else {
        player.pause();
        showBackdrop();
      }
    });

    player.addEventListener('play', () => {
      hideBackdrop();
      playPauseBtn.textContent = '⏸️';
    });

    player.addEventListener('pause', () => {
      showBackdrop();
      playPauseBtn.textContent = '▶️';
    });

    muteToggle.addEventListener('click', () => {
      volumeSlider.style.display = volumeSlider.style.display === 'block' ? 'none' : 'block';
    });

    volumeSlider.addEventListener('input', () => {
      player.volume = volumeSlider.value;
      player.muted = player.volume === 0;
      muteToggle.textContent = player.muted ? '🔇' : '🔊';
    });

    backward.addEventListener('click', () => player.currentTime -= 10);
    forward.addEventListener('click', () => player.currentTime += 10);

    player.addEventListener('timeupdate', () => {
      progress.value = player.currentTime;
      progress.max = player.duration;
    });

    progress.addEventListener('input', () => {
      player.currentTime = progress.value;
    });

    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) player.requestFullscreen();
      else document.exitFullscreen();
    });

    subtitleBtn.addEventListener('click', () => {
      subtitleOptions.style.display = subtitleOptions.style.display === 'flex' ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
      if (!subtitleOptions.contains(e.target) && !subtitleBtn.contains(e.target)) {
        subtitleOptions.style.display = 'none';
      }
    });

    resolutionSelect.addEventListener('change', async () => {
      const selected = resolutionSelect.value;
      const newSource = sources.find(s => s.resolution == selected);
      if (newSource) {
        const proxyUrl = \https://movie-proxy-gules.vercel.app/api/proxy?video=\${encodeURIComponent(newSource.url)}\;
        const time = player.currentTime;
        player.src = proxyUrl;
        player.load();
        player.currentTime = time;
        player.play();
      }
    });

    async function loadMovie(id) {
      const res = await fetch(\https://railway-production-b773.up.railway.app/movie/\${id}\);
      const data = await res.json();

      sources = data.downloadData?.data?.downloads || [];
      captions = data.downloadData?.data?.captions || [];

      if (sources.length) {
        resolutionSelect.innerHTML = '';
        sources.forEach(src => {
          const opt = document.createElement('option');
          opt.value = src.resolution;
          opt.text = src.resolution + 'p';
          if (src.resolution === 1080) opt.selected = true;
          resolutionSelect.appendChild(opt);
        });

        const best = sources.find(s => s.resolution === 1080) || sources[0];
        const proxyUrl = \https://movie-proxy-gules.vercel.app/api/proxy?video=\${encodeURIComponent(best.url)}\;
        player.src = proxyUrl;
      }

      if (captions.length) {
        subtitleOptions.innerHTML = '';
        let englishLoaded = false;
        for (let c of captions) {
          const btn = document.createElement('button');
          btn.textContent = languageMap[c.lan] || c.lan.toUpperCase();
          btn.onclick = async () => {
            if (currentTrack) currentTrack.remove();
            const vtt = await convertSrtToVtt(c.url);
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = c.lan;
            track.srclang = c.lan;
            track.src = vtt;
            track.default = true;
            player.appendChild(track);
            currentTrack = track;
            subtitleOptions.style.display = 'none';
          };
          subtitleOptions.appendChild(btn);

          if (!englishLoaded && c.lan === 'en') {
            englishLoaded = true;
            btn.click();
          }
        }
      }

      player.volume = 1;
      volumeSlider.value = 1;
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

    const languageMap = {
      en: 'English',
      fr: 'French',
      es: 'Spanish',
      de: 'German',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      it: 'Italian',
      tl: 'Tagalog',
      pt: 'Portuguese'
    };
  </script>
</body>
</html>;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    console.error('[handler error]:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
  }
}