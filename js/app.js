// Uncomment this line if you set up the optional "online" counter (see js/presence.js)
// import './presence.js';

const $ = (id) => document.getElementById(id);
let tracks = [], i = 0, player, muted = false;

const shuffle = (a) => {
  for (let n = a.length - 1; n > 0; n--) {
    const k = Math.floor(Math.random() * (n + 1));
    [a[n], a[k]] = [a[k], a[n]];
  }
  return a;
};

const coverOf = (t) => t.cover || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`;

function render() {
  const t = tracks[i];
  $('title').textContent = t.title;
  $('artist').textContent = t.artist;
  const coverUrl = coverOf(t);
  $('mini-cover').src = coverUrl;
  document.title = `${t.title} · My Playlist`;

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      artwork: [{ src: coverUrl }]
    });
  }

  renderCarousel();
}

function renderCarousel() {
  const el = $('carousel');
  el.innerHTML = '';
  const range = 2; // cards shown on each side of the centered one
  for (let offset = -range; offset <= range; offset++) {
    const idx = (i + offset + tracks.length) % tracks.length;
    const t = tracks[idx];
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.pos = offset;
    card.innerHTML = `
      <img src="${coverOf(t)}" alt="">
      <div class="label"><b>${t.title}</b>${t.artist}</div>
    `;
    card.onclick = () => go(idx);
    el.appendChild(card);
  }
}

function go(n) {
  i = (n + tracks.length) % tracks.length;
  render();
  player.loadVideoById(tracks[i].id);
}

function onState(e) {
  const S = YT.PlayerState;
  $('play').textContent = e.data === S.PLAYING ? '⏸' : '▶';
  if (e.data === S.ENDED) go(i + 1);
}

function onError() {
  // Skip tracks that are unavailable or block embedding
  go(i + 1);
}

const toggle = () =>
  player.getPlayerState() === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();

const toggleMute = () => {
  muted = !muted;
  muted ? player.mute() : player.unMute();
  $('mute').textContent = muted ? '🔇' : '🔊';
};

// ---------- Fullscreen ----------
function updateFullscreenIcon() {
  $('fullscreen').textContent = document.fullscreenElement ? '⤡' : '⤢';
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen not available:', err);
  }
}

document.addEventListener('fullscreenchange', updateFullscreenIcon);

// ---------- Theme ----------
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('theme-toggle').textContent = theme === 'dark' ? '🌙' : '☀️';
  try { localStorage.setItem('theme', theme); } catch {}
}

function initTheme() {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch {}
  const preferred = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(preferred);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('yt', {
    width: 200,
    height: 200,
    videoId: tracks[i].id,
    playerVars: { playsinline: 1, controls: 0, rel: 0 },
    events: { onStateChange: onState, onError }
  });

  $('play').onclick = toggle;
  $('next').onclick = () => go(i + 1);
  $('prev').onclick = () => go(i - 1);
  $('mute').onclick = toggleMute;
  $('fullscreen').onclick = toggleFullscreen;
  $('theme-toggle').onclick = toggleTheme;

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('nexttrack', () => go(i + 1));
    navigator.mediaSession.setActionHandler('previoustrack', () => go(i - 1));
    navigator.mediaSession.setActionHandler('play', () => player.playVideo());
    navigator.mediaSession.setActionHandler('pause', () => player.pauseVideo());
  }
};

(async () => {
  initTheme();
  tracks = shuffle(await (await fetch('data/tracks.json')).json());
  render();
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
})();