import { useState, useEffect, useRef } from 'react';

import { usePlayer } from './hooks/usePlayer';

import { useAuth } from './hooks/useAuth';

import { usePlaylists } from './hooks/usePlaylists';

import './App.css';



function App() {

  const [currentView, setCurrentView] = useState('home'); // 'player' or 'home'
  const [mobileView, setMobileView] = useState('lists'); // 'lists' or 'queue'

  const [authMenuOpen, setAuthMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('wmp-activeTab') || 'playlists');

  const [contextMenu, setContextMenu] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [searchResults, setSearchResults] = useState([]);

  const [isSearching, setIsSearching] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem('wmp-theme') || 'default');

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const [helpMenuOpen, setHelpMenuOpen] = useState(false);



  useEffect(() => {

    document.body.dataset.theme = theme;

    localStorage.setItem('wmp-theme', theme);

  }, [theme]);



  const [vizMode, setVizMode] = useState(() => {
    const saved = parseInt(localStorage.getItem('wmp-vizMode') || '0', 10);
    return Number.isNaN(saved) ? 0 : saved;
  }); // 0-9

  const [showVizLabel, setShowVizLabel] = useState(false);

  const [toast, setToast] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activityFilter, setActivityFilter] = useState('');
  const [activitySourceFilter, setActivitySourceFilter] = useState('all');
  const [xpModal, setXpModal] = useState(null);
  const [isMiniMode, setIsMiniMode] = useState(() => localStorage.getItem('wmp-miniMode') === 'true');
  const [searchPlaylistInfo, setSearchPlaylistInfo] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('');
  const [playlistFilter, setPlaylistFilter] = useState('');
  const searchDebounceRef = useRef(null);



  const [localVolume, setLocalVolume] = useState(null);

  // Non-linear volume mapping to give more control at low volumes

  const displayToRealVolume = (val) => Math.round(Math.pow(val / 100, 2) * 100);

  const realToDisplayVolume = (val) => Math.round(Math.sqrt(val / 100) * 100);



  const [isMiddleCollapsed, setIsMiddleCollapsed] = useState(() => localStorage.getItem('wmp-middleCollapsed') === 'true');

  const [playlistDragIndex, setPlaylistDragIndex] = useState(null);

  const [playlistDragOverIndex, setPlaylistDragOverIndex] = useState(null);

  const [historyPage, setHistoryPage] = useState(0);



  // Resize Handlers

  const [middlePanelWidth, setMiddlePanelWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem('wmp-middleWidth') || '300', 10);
    return Number.isNaN(saved) ? 300 : Math.min(600, Math.max(200, saved));
  });

  const [queuePanelWidth, setQueuePanelWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem('wmp-queueWidth') || '320', 10);
    return Number.isNaN(saved) ? 320 : Math.min(600, Math.max(200, saved));
  });

  useEffect(() => { localStorage.setItem('wmp-activeTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('wmp-vizMode', String(vizMode)); }, [vizMode]);
  useEffect(() => { localStorage.setItem('wmp-miniMode', String(isMiniMode)); }, [isMiniMode]);
  useEffect(() => { localStorage.setItem('wmp-middleCollapsed', String(isMiddleCollapsed)); }, [isMiddleCollapsed]);
  useEffect(() => { localStorage.setItem('wmp-middleWidth', String(middlePanelWidth)); }, [middlePanelWidth]);
  useEffect(() => { localStorage.setItem('wmp-queueWidth', String(queuePanelWidth)); }, [queuePanelWidth]);



  const startResizeMiddle = (e) => {

    e.preventDefault();

    const startX = e.clientX || (e.touches && e.touches[0].clientX);

    const startWidth = middlePanelWidth;

    

    const onMouseMove = (moveEvent) => {

      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);

      const diff = startX - currentX; 

      let newWidth = startWidth + diff;

      if (newWidth < 200) newWidth = 200;

      if (newWidth > 600) newWidth = 600;

      setMiddlePanelWidth(newWidth);

    };

    

    const onMouseUp = () => {

      document.removeEventListener('mousemove', onMouseMove);

      document.removeEventListener('touchmove', onMouseMove);

      document.removeEventListener('mouseup', onMouseUp);

      document.removeEventListener('touchend', onMouseUp);

    };

    

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('touchmove', onMouseMove);

    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('touchend', onMouseUp);

  };



  const startResizeQueue = (e) => {

    e.preventDefault();

    const startX = e.clientX || (e.touches && e.touches[0].clientX);

    const startWidth = queuePanelWidth;

    

    const onMouseMove = (moveEvent) => {

      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);

      const diff = startX - currentX; 

      let newWidth = startWidth + diff;

      if (newWidth < 200) newWidth = 200;

      if (newWidth > 600) newWidth = 600;

      setQueuePanelWidth(newWidth);

    };

    

    const onMouseUp = () => {

      document.removeEventListener('mousemove', onMouseMove);

      document.removeEventListener('touchmove', onMouseMove);

      document.removeEventListener('mouseup', onMouseUp);

      document.removeEventListener('touchend', onMouseUp);

    };

    

    document.addEventListener('mousemove', onMouseMove);

    document.addEventListener('touchmove', onMouseMove);

    document.addEventListener('mouseup', onMouseUp);

    document.addEventListener('touchend', onMouseUp);

  };

  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const [dragOverIndex, setDragOverIndex] = useState(null);

  const modes = [

    "Barras Mágicas", 

    "Osciloscopio", 

    "Carátula de Álbum", 

    "Polvo de Estrellas", 

    "Túnel Hipnótico", 

    "Ondas Neón",

    "Viaje Espacial",

    "Fractal Giratorio",

    "Espectro Radial",

    "Vinilo Girando"

  ];

  

  const player = usePlayer();

  const auth = useAuth();

  const playlists = usePlaylists();

  

  const [newPlaylistName, setNewPlaylistName] = useState('');

  const [showSaveMenu, setShowSaveMenu] = useState(null); // track index or null

  

  const audioRef = useRef(null);

  const canvasRef = useRef(null);

  const vinylImgRef = useRef(null);



  useEffect(() => {

    if (player.nowPlaying?.thumbnail) {

      const img = new Image();

      img.crossOrigin = "Anonymous";

      img.src = player.nowPlaying.thumbnail;

      vinylImgRef.current = img;

    }

  }, [player.nowPlaying?.thumbnail]);

  const containerRef = useRef(null);

  const labelTimeoutRef = useRef(null);

  const toastTimeoutRef = useRef(null);



  useEffect(() => {

    const params = new URLSearchParams(window.location.search);

    const code = params.get('code');

    if (code) {

      window.history.replaceState({}, document.title, window.location.pathname);

      auth.handleCallback(code);

    }

  }, []);



  useEffect(() => {

    if (auth.user) {

      playlists.fetchPlaylists();

    }

  }, [auth.user]);



  // Hack para desbloquear el audio fantasma en el primer clic y activar las teclas

  useEffect(() => {

    const unlockAudio = () => {

      if (audioRef.current && audioRef.current.paused) {

        audioRef.current.play().catch(e => console.log("Audio unlock bypass:", e));

      }

    };

    document.addEventListener('click', unlockAudio, { once: true });

    return () => document.removeEventListener('click', unlockAudio);

  }, []);



  // Sincronizar la info de la canción con el menú de Windows (MediaSession)

  useEffect(() => {

    if ('mediaSession' in navigator) {

      if (player.nowPlaying) {

        navigator.mediaSession.metadata = new MediaMetadata({

          title: player.nowPlaying.title,

          artist: player.nowPlaying.author,

          album: 'CriZpy Media Player Web',

          artwork: player.nowPlaying.thumbnail ? [

            { src: player.nowPlaying.thumbnail, sizes: '512x512', type: 'image/jpeg' }

          ] : []

        });

      } else {

        navigator.mediaSession.metadata = null;

      }

    }

  }, [player.nowPlaying]);



  // Actualizar el estado de reproducción para decirle a Windows si estamos sonando o en pausa

  useEffect(() => {

    if ('mediaSession' in navigator) {

      const isPlaying = player.nowPlaying && !player.status?.paused;

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

      

      // Si estamos "reproduciendo", forzar al audio fantasma a sonar para que Windows preste atención

      if (isPlaying && audioRef.current && audioRef.current.paused) {

        audioRef.current.play().catch(e => console.log("Audio unlock failed:", e));

      }

    }

  }, [player.nowPlaying, player.status?.paused]);



  // Capturar las teclas multimedia

  useEffect(() => {

    if ('mediaSession' in navigator) {

      navigator.mediaSession.setActionHandler('play', () => { player.pause(); audioRef.current?.play(); });

      navigator.mediaSession.setActionHandler('pause', () => { player.pause(); });

      navigator.mediaSession.setActionHandler('previoustrack', player.prev);

      navigator.mediaSession.setActionHandler('nexttrack', player.skip);

    }

  }, [player]);



  const isPlaying = player.nowPlaying && !player.status?.paused;

  

  const isPlayingRef = useRef(isPlaying);
  const hasThumbnailRef = useRef(false);

  useEffect(() => {

    isPlayingRef.current = isPlaying;

  }, [isPlaying]);

  useEffect(() => {
    hasThumbnailRef.current = !!player.nowPlaying?.thumbnail;
  }, [player.nowPlaying?.thumbnail]);



  // Animación del Canvas (Visualizador)

  useEffect(() => {

    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;

    const ctx = canvas.getContext('2d');

    let animId;
    let idleTimer;

    let w, h;

    const freqs = new Array(32).fill(0);

    const particles = Array.from({length: 50}, () => ({

      x: Math.random(), 

      y: Math.random(), 

      size: Math.random() * 2 + 1,

      speed: Math.random() * 0.02 + 0.01

    }));

    const stars = Array.from({length: 80}, () => ({

      x: Math.random() * 2 - 1, 

      y: Math.random() * 2 - 1, 

      z: Math.random()

    }));

    let phase = 0;

    let tunnelRadius = 0;



    const resize = () => {

      if(!containerRef.current || !canvas) return;

      const rect = containerRef.current.getBoundingClientRect();

      if (canvas.width !== rect.width || canvas.height !== rect.height) {

        canvas.width = rect.width;

        canvas.height = rect.height;

      }

      w = rect.width;

      h = rect.height;

    };

    

    // Objeto global de la animación

    window._vizObserver?.disconnect();

    window._vizObserver = new ResizeObserver(resize);

    window._vizObserver.observe(containerRef.current);

    resize();



    const loop = () => {

      if (!isPlayingRef.current || document.hidden || (vizMode === 2 && hasThumbnailRef.current)) {

        idleTimer = setTimeout(() => {
          animId = requestAnimationFrame(loop);
        }, 250);

        return;

      }

      

      // Estela / borrado de frame dependiendo del modo

      if (vizMode === 4) {

        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Estela más larga para el túnel

      } else {

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";

      }

      ctx.fillRect(0, 0, w, h);



      // Generar frecuencias (Compartido por Barras y Espectro Radial) - Más suaves

      for (let i = 0; i < freqs.length; i++) {

        freqs[i] += (Math.random() * 30 - 15); // Antes 50-25

        if (freqs[i] < 0) freqs[i] = 0;

        if (freqs[i] > h * 0.8) freqs[i] = h * 0.8;

        freqs[i] *= 0.92; // Más suavizado

      }



      if (vizMode === 0) {

        // Barras

        const barW = w / freqs.length;

        for (let i = 0; i < freqs.length; i++) {

          const barH = freqs[i];

          const x = i * barW;

          const y = h - barH;

          

          const grad = ctx.createLinearGradient(0, y, 0, h);

          grad.addColorStop(0, "#39b54a");

          grad.addColorStop(1, "#1a4a7a");

          

          ctx.fillStyle = grad;

          ctx.fillRect(x + 1, y, barW - 2, barH);

        }

      } else if (vizMode === 1) {

        // Osciloscopio

        ctx.beginPath();

        ctx.strokeStyle = "#3d8ae0";

        ctx.lineWidth = 2;

        phase += 0.04; // Antes 0.1

        for (let x = 0; x < w; x++) {

          const mod = Math.sin(phase + x * 0.05) * Math.cos(phase * 0.5 + x * 0.01);

          const y = h/2 + (Math.random() * 20 * mod) + (mod * h/4); // Menos locura aleatoria

          if (x === 0) ctx.moveTo(x, y);

          else ctx.lineTo(x, y);

        }

        ctx.stroke();

      } else if (vizMode === 3) {

        // Polvo de Estrellas (Partículas)

        ctx.fillStyle = "#fff";

        phase += 0.02; // Aún más lento

        for (let p of particles) {

          p.y -= p.speed * (Math.random() * 0.6 + 0.2); // Movimiento casi nulo

          p.x += Math.sin(phase + p.y * 10) * 0.0005; // Movimiento lateral muy suave

          if (p.y < 0) {

            p.y = 1.1;

            p.x = Math.random();

          }

          const px = p.x * w;

          const py = p.y * h;

          const pulse = Math.abs(Math.sin(phase * 0.5 + p.x * 10)) * 1.5;

          ctx.beginPath();

          ctx.arc(px, py, p.size + pulse, 0, Math.PI * 2);

          ctx.fill();

        }

      } else if (vizMode === 4) {

        // Túnel Hipnótico - Loop infinito perfecto

        tunnelRadius += 0.15 + Math.random() * 0.15; // Mega lento

        if (tunnelRadius >= 40) tunnelRadius -= 40; // El reinicio debe ser exacto a la separación (40)

        

        ctx.lineWidth = 2;

        for (let i = 0; i < 12; i++) {

          const r = tunnelRadius + i * 40;

          if (r > 0 && r < w) {

            // El color ahora depende del radio exacto para que no cambie de golpe al reiniciar el ciclo

            ctx.strokeStyle = `hsl(${(phase * 50 + r * 0.25) % 360}, 100%, 60%)`;

            ctx.beginPath();

            ctx.arc(w/2, h/2, r, 0, Math.PI * 2);

            ctx.stroke();

          }

        }

        phase += 0.015;

      } else if (vizMode === 5) {

        // Ondas Neón

        ctx.lineWidth = 2;

        phase += 0.03; // Antes 0.08

        const drawWave = (offset, color, mult) => {

          ctx.beginPath();

          ctx.strokeStyle = color;

          for (let x = 0; x < w; x++) {

            const mod = Math.sin(phase * 0.5 + x * 0.01);

            const bump = Math.sin(x * 0.05 + phase * mult) * 40 * mod;

            const y = h/2 + bump + offset;

            if (x === 0) ctx.moveTo(x, y);

            else ctx.lineTo(x, y);

          }

          ctx.stroke();

        };

        drawWave(-20, "rgba(255, 50, 100, 0.8)", 1.1);

        drawWave(0, "rgba(50, 255, 100, 0.8)", 1.3);

        drawWave(20, "rgba(50, 100, 255, 0.8)", 1.5);

      } else if (vizMode === 6) {

        // Viaje Espacial

        ctx.fillStyle = "#fff";

        phase += 0.02; // Aún más lento

        for (let s of stars) {

          s.z -= 0.001 + Math.abs(Math.sin(phase)) * 0.004; // Súper despacito

          if (s.z <= 0) {

            s.x = Math.random() * 2 - 1;

            s.y = Math.random() * 2 - 1;

            s.z = 1;

          }

          const sx = (s.x / s.z) * (w/2) + (w/2);

          const sy = (s.y / s.z) * (h/2) + (h/2);

          const size = (1 - s.z) * 3;

          ctx.beginPath();

          ctx.arc(sx, sy, size, 0, Math.PI*2);

          ctx.fill();

        }

      } else if (vizMode === 7) {

        // Fractal Giratorio

        phase += 0.008; // Antes 0.02

        ctx.save();

        ctx.translate(w/2, h/2);

        ctx.rotate(phase);

        for(let i=0; i<6; i++) {

          ctx.rotate((Math.PI * 2) / 6);

          ctx.strokeStyle = `hsl(${(phase * 100 + i * 20) % 360}, 100%, 60%)`;

          ctx.lineWidth = 2;

          const pulse = Math.abs(Math.sin(phase * 4)) * 15; // Antes 20

          ctx.strokeRect(-20 - pulse, -20 - pulse, 40 + pulse*2, 40 + pulse*2);

          ctx.beginPath();

          ctx.arc(50 + pulse, 50 + pulse, 15, 0, Math.PI*2);

          ctx.stroke();

        }

        ctx.restore();

      } else if (vizMode === 8) {

        // Espectro Radial

        ctx.save();

        ctx.translate(w/2, h/2);

        const numBars = 32;

        const radius = Math.min(w, h) / 4;

        phase += 0.005; // Antes 0.01

        ctx.rotate(phase);

        for(let i=0; i<numBars; i++) {

          const angle = (i / numBars) * Math.PI * 2;

          const barH = freqs[i] * 0.6; 

          ctx.save();

          ctx.rotate(angle);

          ctx.fillStyle = `hsl(${(i/numBars)*360 + phase*100}, 100%, 50%)`;

          ctx.fillRect(-2, radius, 4, barH);

          ctx.restore();

        }

        ctx.restore();

      } else if (vizMode === 9) {

        phase += 0.02; 

        ctx.save();

        ctx.translate(w/2, h/2);

        ctx.rotate(phase);

        

        const radius = Math.min(w, h) * 0.4;

        ctx.beginPath();

        ctx.arc(0, 0, radius, 0, Math.PI * 2);

        ctx.fillStyle = "#111";

        ctx.fill();

        ctx.lineWidth = 2;

        ctx.strokeStyle = "#222";

        ctx.stroke();



        ctx.strokeStyle = "#1a1a1a";

        ctx.lineWidth = 1;

        for(let i=1; i<5; i++) {

          ctx.beginPath();

          ctx.arc(0, 0, radius - (i * 15), 0, Math.PI * 2);

          ctx.stroke();

        }



        const centerR = radius * 0.4;

        ctx.beginPath();

        ctx.arc(0, 0, centerR, 0, Math.PI * 2);

        if (vinylImgRef.current && vinylImgRef.current.complete) {

          ctx.save();

          ctx.clip();

          ctx.drawImage(vinylImgRef.current, -centerR, -centerR, centerR*2, centerR*2);

          ctx.restore();

        } else {

          ctx.fillStyle = "var(--wmp-accent, #4ade80)";

          ctx.fill();

        }

        

        ctx.beginPath();

        ctx.arc(0, 0, 5, 0, Math.PI * 2);

        ctx.fillStyle = "#fff";

        ctx.fill();



        ctx.restore();

      }

      

      animId = requestAnimationFrame(loop);

    };



    animId = requestAnimationFrame(loop);

    

    return () => {

      clearTimeout(idleTimer);
      cancelAnimationFrame(animId);

      window._vizObserver?.disconnect();

    };

  }, [vizMode]);



  const handleVizMode = () => {

    setVizMode((prev) => (prev + 1) % modes.length);

    setShowVizLabel(true);

    clearTimeout(labelTimeoutRef.current);

    labelTimeoutRef.current = setTimeout(() => setShowVizLabel(false), 4000);

  };



  

  const timeAgo = (dateStr) => {

    if (!dateStr) return 'Hace poco';

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) return 'Hace poco';

    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Hace unos segundos';

    let interval = Math.floor(seconds / 86400);

    if (interval >= 1) return `Hace ${interval} día${interval === 1 ? '' : 's'}`;

    interval = Math.floor(seconds / 3600);

    if (interval >= 1) return `Hace ${interval} hora${interval === 1 ? '' : 's'}`;

    interval = Math.floor(seconds / 60);

    if (interval >= 1) return `Hace ${interval} min`;

    return 'Hace poco';

  };



  const formatTime = (ms) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTotalDuration = (ms) => {
    if (!ms || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalQueueDurationMs = (player.queue || []).reduce((acc, t) => acc + (t.duration_ms || 0), 0);
  const currentPlaylistDurationMs = (playlists.currentPlaylist?.tracks || []).reduce((acc, t) => acc + (t.duration_ms || 0), 0);



  const showToast = (message) => {

    clearTimeout(toastTimeoutRef.current);

    setToast(message);

    toastTimeoutRef.current = setTimeout(() => setToast(null), 3500);

  };



  const requireAuth = (fn) => {

    return (...args) => {

      if (!auth.user) {

        showToast('Inicia sesión con Discord para controlar el reproductor');

        return;

      }

      return fn(...args);

    };

  };



  useEffect(() => {

    const handleKeyDown = (e) => {

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (!auth.user) return; // Requiere sesión

      

      switch (e.code) {

        case 'Space':

          e.preventDefault();

          player.pause();

          break;

        case 'ArrowLeft': {

          e.preventDefault();

          const p = player.progress?.position || 0;

          player.seek(Math.max(0, p - 10000) / 1000);

          break;

        }

        case 'ArrowRight': {

          e.preventDefault();

          const p = player.progress?.position || 0;

          player.seek((p + 10000) / 1000);

          break;

        }

        case 'ArrowUp':

          e.preventDefault();

          player.setVolume(displayToRealVolume(Math.min(100, realToDisplayVolume(player.status?.volume ?? 100) + 5)));

          break;

        case 'ArrowDown':

          e.preventDefault();

          player.setVolume(displayToRealVolume(Math.max(0, realToDisplayVolume(player.status?.volume ?? 100) - 5)));

          break;

      }

    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [auth.user, player]);







  useEffect(() => {

    window.showToastCallback = showToast;

    

    const handleClickOutside = (e) => {

      setContextMenu(null);

      if (!e.target.closest('.theme-menu-container')) {

        setThemeMenuOpen(false);

      }

      if (!e.target.closest('.help-menu-container')) {

        setHelpMenuOpen(false);

      }

      if (!e.target.closest('.save-menu-container') && !e.target.closest('.queue-star-btn')) {

        setShowSaveMenu(null);

      }

      if (!e.target.closest('.auth-dropdown') && !e.target.closest('.auth-profile-container')) {

        setAuthMenuOpen(false);

      }

    };

    document.addEventListener('click', handleClickOutside);

    

    return () => { 

      window.showToastCallback = null;

      document.removeEventListener('click', handleClickOutside);

    };

  }, []);



  const executeSearch = async (queryText) => {
    const q = (queryText || '').trim();
    if (!q) {
      setSearchResults([]);
      setSearchPlaylistInfo(null);
      setIsSearching(false);
      return;
    }
    if (!auth.user) return;
    setIsSearching(true);
    const res = await player.search(q);
    if (res && res.results) {
      setSearchResults(res.results);
      if (res.is_playlist) {
        setSearchPlaylistInfo({
          name: res.playlist_name || 'Playlist de YouTube',
          url: q,
          count: res.results.length
        });
      } else {
        setSearchPlaylistInfo(null);
      }
    }
    setIsSearching(false);
  };

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchPlaylistInfo(null);
      setIsSearching(false);
      return;
    }
    if (!auth.user || q.length < 2) return;
    searchDebounceRef.current = setTimeout(() => {
      executeSearch(q);
    }, 420);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery, auth.user]);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      clearTimeout(searchDebounceRef.current);
      if (!auth.user) {
        showToast('Inicia sesión con Discord para buscar canciones');
        return;
      }
      await executeSearch(searchQuery);
    }
  };

  const handlePlayTrack = requireAuth(async (uri, title, index = null) => {
    const res = await player.play(uri, index, false);
    if (res?.is_playlist) {
      showToast(`Playlist agregada: ${res.playlist_name} (${res.queued_count} canciones)`);
    }
    setSearchQuery('');
    setSearchResults([]);
    setSearchPlaylistInfo(null);
    setActiveTab('queue');
  });

  const handlePlayNext = requireAuth(async (uri, title, e) => {
    if (e) e.stopPropagation();
    const res = await player.play(uri, 0, true);
    if (res) {
      showToast(res.played_next ? `⏭ Sonar siguiente: ${title}` : `▶ Reproduciendo: ${title}`);
    }
  });

  const handleClearQueue = requireAuth(async () => {
    if (!player.queue || player.queue.length === 0) return;
    const res = await player.clearQueue();
    if (res) {
      showToast(`🧹 Cola limpiada (${res.cleared} canciones)`);
    }
  });

  const openCreatePlaylistModal = requireAuth((afterCreate = null) => {
    setXpModal({
      type: 'single',
      title: 'Nueva Playlist',
      message: 'Escribe el nombre para la nueva playlist:',
      label1: 'Nombre:',
      value1: '',
      placeholder1: 'Ej: Rock Venezolano',
      confirmText: 'Crear',
      onConfirm: async (val1) => {
        const name = (val1 || '').trim();
        if (!name) return;
        const ok = await playlists.createPlaylist(name);
        if (ok) {
          showToast(`📁 Playlist "${name}" creada`);
          if (afterCreate) await afterCreate(name);
        }
      }
    });
  });

  const openRenamePlaylistModal = requireAuth((oldName) => {
    setXpModal({
      type: 'single',
      title: 'Renombrar Playlist',
      message: `Cambiar nombre de "${oldName}":`,
      label1: 'Nuevo nombre:',
      value1: oldName,
      placeholder1: 'Nuevo nombre...',
      confirmText: 'Guardar',
      onConfirm: async (val1) => {
        const newName = (val1 || '').trim();
        if (!newName || newName === oldName) return;
        const res = await playlists.renamePlaylist(oldName, newName);
        if (res && res.renamed) {
          showToast(`✏️ Renombrada a "${res.renamed}"`);
        }
      }
    });
  });

  const openDeletePlaylistModal = requireAuth((name) => {
    setXpModal({
      type: 'confirm',
      title: 'Eliminar Playlist',
      message: `¿Estás seguro de que deseas borrar la playlist "${name}"?`,
      confirmText: 'SÍ, BORRAR',
      onConfirm: async () => {
        const ok = await playlists.deletePlaylist(name);
        if (ok) showToast(`🗑️ Playlist "${name}" eliminada`);
      }
    });
  });

  const handleSaveQueueAsPlaylist = requireAuth(async () => {
    if (!player.nowPlaying && (!player.queue || player.queue.length === 0)) {
      showToast('No hay canciones en la cola para guardar');
      return;
    }
    setXpModal({
      type: 'single',
      title: 'Guardar Cola como Playlist',
      message: 'Guarda la canción actual y la cola en una playlist:',
      label1: 'Nombre de la Playlist:',
      value1: '',
      placeholder1: 'Ej: Sesión de hoy',
      confirmText: 'Guardar',
      onConfirm: async (val1) => {
        const name = (val1 || '').trim();
        if (!name) return;
        const res = await playlists.saveQueueAsPlaylist(name, true);
        if (res && res.saved) {
          showToast(`💾 Playlist "${res.saved}" guardada (${res.count} canciones)`);
        }
      }
    });
  });

  const handleImportYoutubePlaylist = requireAuth(async (presetUrl = null, presetName = null) => {
    if (presetUrl) {
      setXpModal({
        type: 'single',
        title: 'Guardar Playlist de YouTube',
        message: 'Nombre para guardar esta playlist (vacío = usar nombre original):',
        label1: 'Nombre:',
        value1: presetName || '',
        placeholder1: presetName || 'Nombre de la playlist...',
        confirmText: 'Importar',
        onConfirm: async (val1) => {
          showToast('Importando playlist de YouTube... ⏳');
          const res = await playlists.importYoutubePlaylist(presetUrl.trim(), (val1 || '').trim() || null);
          if (res && res.imported) {
            showToast(`📥 Playlist "${res.imported}" importada (${res.count} canciones)`);
            setActiveTab('playlists');
          }
        }
      });
      return;
    }
    setXpModal({
      type: 'double',
      title: 'Importar Playlist de YouTube',
      message: 'Pega el link de una Playlist o Mix de YouTube para guardarla:',
      label1: 'URL de YouTube:',
      value1: '',
      placeholder1: 'https://www.youtube.com/playlist?list=...',
      label2: 'Nombre opcional:',
      value2: '',
      placeholder2: 'Déjalo vacío para usar el título de YouTube',
      confirmText: 'Importar',
      onConfirm: async (val1, val2) => {
        const url = (val1 || '').trim();
        if (!url) return;
        showToast('Importando playlist de YouTube... ⏳');
        const res = await playlists.importYoutubePlaylist(url, (val2 || '').trim() || null);
        if (res && res.imported) {
          showToast(`📥 Playlist "${res.imported}" importada (${res.count} canciones)`);
          setActiveTab('playlists');
        }
      }
    });
  });

  const filteredHistory = (player.history || []).filter((item) => {
    const q = historyFilter.trim().toLowerCase();
    if (!q) return true;
    return (item.title || '').toLowerCase().includes(q) || (item.played_by_name || '').toLowerCase().includes(q);
  });

  const filteredPlaylistEntries = Object.entries(playlists.playlists || {})
    .filter(([name]) => {
      const q = playlistFilter.trim().toLowerCase();
      if (!q) return true;
      return name.toLowerCase().includes(q);
    })
    .sort((a, b) => a[0].localeCompare(b[0]));

  const filteredPlaylistTracks = (playlists.currentPlaylist?.tracks || [])
    .map((track, idx) => ({ track, origIdx: idx }))
    .filter(({ track }) => {
      const q = playlistFilter.trim().toLowerCase();
      if (!q) return true;
      return (track.title || '').toLowerCase().includes(q);
    });



  const progressPercent = player.progress.duration > 0 

    ? (player.progress.position / player.progress.duration) * 100 

    : 0;



  const renderSaveMenu = (track, indexId) => {

    if (showSaveMenu !== indexId) return null;

    const isSearch = indexId.startsWith('s_');

    return (

      <div className="save-menu-dropdown" onClick={(e) => e.stopPropagation()}>

        <div style={{ padding: '4px', fontSize: '11px', borderBottom: '1px solid #444', marginBottom: '4px', color: '#ccc' }}>Guardar en:</div>

        {Object.keys(playlists.playlists || {}).map(pName => (

          <div 

            key={pName} 

            className="save-menu-item"

            onClick={(e) => { e.stopPropagation(); playlists.addToPlaylist(pName, track); setShowSaveMenu(null); }}

          >

            {pName}

          </div>

        ))}

        <div 

          className="save-menu-item new"

          onClick={(e) => { 

            e.stopPropagation(); 

            setShowSaveMenu(null); 

            openCreatePlaylistModal(async (createdName) => {
              await playlists.addToPlaylist(createdName, track);
            });

          }}

        >

          + Nueva Playlist

        </div>

      </div>

    );

  };



  return (
      <div id="app" className={`wmp-layout ${isMiniMode && currentView === 'player' ? 'mini-mode' : ''}`}>

      {/* Audio fantasma de silencio de 1 seg para engañar al navegador */}

      <audio 

        ref={audioRef} 

        src="/silence.wav" 

        loop 

        style={{display: 'none'}} 

      />



      {/* Barra de título de Windows XP */}

      <div className="xp-titlebar" style={{ flexShrink: 0 }}>
        <div className="xp-titlebar-title">

          <span className={`dot ${player.isConnected ? 'connected' : 'disconnected'}`} style={{ marginRight: '8px' }} title={player.isConnected ? 'Conectado al bot' : 'Desconectado'}></span>

          {isMiniMode && currentView === 'player' ? 'CriZpy Mini Player' : 'CriZpy Media Player'}

        </div>

        <div className="xp-titlebar-controls">

          <div
            className="xp-title-btn min"
            title={isMiniMode ? "Restaurar modo completo" : "Modo Mini-Player"}
            onClick={() => {
              if (currentView !== 'player') setCurrentView('player');
              setIsMiniMode(!isMiniMode);
            }}
          >_</div>

          <div
            className="xp-title-btn max"
            title="Modo Completo"
            onClick={() => setIsMiniMode(false)}
          >□</div>

          <div 

            className="xp-title-btn close"

            onClick={requireAuth(async () => {

              const res = await player.disconnect();

              if (res?.disconnected) {

                showToast('Bot desconectado del canal de voz');

              } else if (res?.not_in_voice) {

                showToast('El bot no está en ninguna llamada');

              }

            })}

          >X</div>

        </div>

      </div>



      <div id="wmp-menubar" style={{ flexShrink: 0 }}>
        <span
          onClick={() => {
            player.fetchActivity?.();
            setShowActivityModal(true);
          }}
          title="Ver registro de todos los movimientos (últimas 48 horas)"
          style={{ cursor: 'pointer' }}
        >Archivo</span>

        <span
          onClick={() => {
            if (currentView !== 'player') setCurrentView('player');
            setIsMiniMode(!isMiniMode);
          }}
          title="Cambiar a Mini-Player"
        >Mini Player</span>

        <span>Reproducir</span>

        <span>Herramientas</span>

        <div className="help-menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

          <span 

            onClick={(e) => { e.stopPropagation(); setHelpMenuOpen(!helpMenuOpen); setThemeMenuOpen(false); }}

            style={{ cursor: 'pointer' }}

          >Ayuda</span>

          {helpMenuOpen && (

            <div 

              style={{

                position: 'absolute', top: '24px', left: '0', zIndex: 1000,

                background: 'var(--wmp-color-menubar)', color: 'var(--wmp-text-menubar)', border: '1px solid var(--wmp-color-menubar-border)',

                boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', minWidth: '180px', padding: '4px'

              }}

            >

              <div 

                onClick={() => window.open('https://discord.com/users/618635972707352587', '_blank')}

                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', border: '1px solid transparent' }}

                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--wmp-blue-dark)'; e.currentTarget.style.color = 'var(--wmp-text-light)'; }}

                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--wmp-text-menubar)'; }}

              >

                <img src="https://cdn.discordapp.com/avatars/618635972707352587/cef3c44f838bc7e9fea19c77c548af9c.png?size=128" alt="tiocrizpy" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://cdn.discordapp.com/embed/avatars/0.png'} />

                <div style={{ display: 'flex', flexDirection: 'column' }}>

                  <strong style={{ fontSize: '13px', color: 'inherit', margin: 0 }}>TioCriZpy</strong>

                  <span style={{ fontSize: '11px', color: 'inherit', opacity: 0.7 }}>@tiocrizpy</span>

                </div>

              </div>

            </div>

          )}

        </div>

        <div className="theme-menu-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>

          <span 

            onClick={(e) => { e.stopPropagation(); setThemeMenuOpen(!themeMenuOpen); setHelpMenuOpen(false); }}

            style={{ cursor: 'pointer' }}

          >Temas</span>

          {themeMenuOpen && (

            <div 

              style={{

                position: 'absolute', top: '24px', left: '0', zIndex: 1000,

                background: 'var(--wmp-color-menubar)', color: 'var(--wmp-text-menubar)', border: '1px solid var(--wmp-color-menubar-border)',

                boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', minWidth: '150px'

              }}

            >

              <div 

                onClick={() => { setTheme('default'); setThemeMenuOpen(false); }}

                style={{ padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit' }}

                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--wmp-blue-dark)'; e.currentTarget.style.color = 'var(--wmp-text-light)'; }}

                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--wmp-text-menubar)'; }}

              >

                <span style={{ width: '16px', display: 'inline-block' }}>{theme === 'default' ? '•' : ''}</span> Clásico

              </div>

              <div 

                onClick={() => { setTheme('oscuro'); setThemeMenuOpen(false); }}

                style={{ padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'inherit' }}

                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--wmp-blue-dark)'; e.currentTarget.style.color = 'var(--wmp-text-light)'; }}

                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--wmp-text-menubar)'; }}

              >

                <span style={{ width: '16px', display: 'inline-block' }}>{theme === 'oscuro' ? '•' : ''}</span> Oscuro

              </div>

            </div>

          )}

        </div>

        <div className="spacer"></div>

        {auth.user ? (

          <div className="auth-profile-container" style={{ position: 'relative' }}>

            <button 

              className="auth-profile-btn" 

              onClick={() => setAuthMenuOpen(!authMenuOpen)}

              onBlur={() => setTimeout(() => setAuthMenuOpen(false), 200)}

            >

              <span className="auth-caret" style={{ marginRight: '1px' }}>▼</span>

              <span className="auth-name" style={{ marginRight: '2px' }}>{auth.user.name}</span>

              <img src={auth.user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="avatar" />

            </button>

            

            {authMenuOpen && (

              <div className="auth-dropdown">

                <div className="auth-dropdown-item" onClick={auth.logout}>

                  Cerrar Sesión

                </div>

              </div>

            )}

          </div>

        ) : null}

      </div>



      {player.listeners && player.listeners.length > 0 && (

        <div className="listeners-bar" style={{ flexShrink: 0 }}>

          <div className="listeners-label">

            <span className="listeners-icon">🔊</span>

            <span className="listeners-text">En <b>{player.channelName}</b> ({player.listeners.length})</span>

          </div>

          <div className="listeners-list">

            {player.listeners.map(l => (

              <div key={l.id} className="listener-item" title={l.name}>

                <img src={l.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'} className="listener-avatar" alt={l.name} />

              </div>

            ))}

          </div>

        </div>

      )}



      <div id="wmp-main-area">

        {/* Left Sidebar */}

        <div id="wmp-sidebar" style={{ width: "200px", overflow: "hidden", whiteSpace: "nowrap", flexShrink: 0 }}>

          <button 

            className={`sidebar-btn ${currentView === 'home' ? 'active' : ''}`}

            onClick={() => setCurrentView('home')}

          >

            <span className="icon">🎵</span>

            <span className="text">Guía multimedia</span>

          </button>

          <button 

            className={`sidebar-btn ${currentView === 'player' ? 'active' : ''}`}

            onClick={() => setCurrentView('player')}

          >

            <span className="icon">▶</span>

            <span className="text">Reproducción en curso</span>

          </button>

          <button className="sidebar-btn">

            <span className="icon">💿</span>

            <span className="text">Copiar desde CD de audio</span>

          </button>

          <button className="sidebar-btn">

            <span className="icon">📚</span>

            <span className="text">Biblioteca multimedia</span>

          </button>

          <div className="sidebar-spacer"></div>

          <div className="sidebar-logo" style={{ paddingBottom: "15px", paddingLeft: "15px" }}>

            <img src="/windows-xp-icon-logo.png" alt="Logo" width="40" style={{marginBottom: "4px", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))"}} />

            <div style={{fontWeight: "bold", fontFamily: "'Arial Black', sans-serif", fontSize: "11px", lineHeight: "1"}}>CriZpy</div>

            <div style={{fontFamily: "Arial, sans-serif", fontSize: "11px"}}>Media Player</div>

          </div>

        </div>



        

          <>

            {/* Center: Visualizer & Info */}

            {currentView === 'player' ? (
          <>
            <div id="wmp-center">

              <div id="track-info">

                <div id="track-artist">{player.nowPlaying ? player.nowPlaying.author : "No hay nada sonando"}</div>

                <div id="track-title-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>

                  {player.nowPlaying ? player.nowPlaying.title : "CriZpy Media Player"}

                </div>

              </div>

              <div className="mobile-tab-bar">
                <button className={mobileView === 'lists' ? 'active' : ''} onClick={() => setMobileView('lists')}>Buscar / Playlists</button>
                <button className={mobileView === 'queue' ? 'active' : ''} onClick={() => setMobileView('queue')}>Cola</button>
              </div>
              <div
                id="viz-container" 
                ref={containerRef}
                className={` ${player.nowPlaying?.thumbnail ? "has-art" : ""} ${vizMode === 2 ? "show-art" : ""} `}
                onClick={handleVizMode}
                style={{ cursor: 'pointer' }}
              >
                <canvas id="viz-canvas" ref={canvasRef}></canvas>
                {player.nowPlaying?.thumbnail && (
                  <img id="artwork" src={player.nowPlaying.thumbnail} alt="Album art" />
                )}

                <div id="viz-label" style={{ opacity: showVizLabel ? 1 : '' }}>{modes[vizMode]}</div>

              </div>

            </div>




      
  <div
    id="wmp-middle-panel"
    className={`${mobileView === `lists` ? `` : `mobile-hidden `}${isMiddleCollapsed ? `` : `open`}`}
    style={{
      width: `${middlePanelWidth}px`,
      minWidth: `200px`,
      flexShrink: 0,
      overflow: `hidden`,
      display: (isMiddleCollapsed || currentView !== 'player') ? `none` : `flex`,
      flexDirection: `column`,
    }}
  >
    {!isMiddleCollapsed && (
      <>
        <div id="playlist-header" style={{ flexShrink: 0, minHeight: `32px`, boxSizing: `border-box` }}>
          <div style={{ display: `flex`, width: `100%` }}>
            <button
              className={`playlist-tab-btn ${activeTab === `search` ? `active` : ``}`}
              onClick={() => setActiveTab(`search`)}
              style={{ width: `33.33%`, flexShrink: 0, textAlign: `center`, padding: `4px`, fontSize: `11px` }}
            >
              Buscar
            </button>
            <button
              className={`playlist-tab-btn ${activeTab === `history` ? `active` : ``}`}
              onClick={() => setActiveTab(`history`)}
              style={{ width: `33.33%`, flexShrink: 0, textAlign: `center`, padding: `4px`, fontSize: `11px` }}
            >
              Historial
            </button>
            <button
              className={`playlist-tab-btn ${activeTab === `playlists` ? `active` : ``}`}
              onClick={() => setActiveTab(`playlists`)}
              style={{ width: `33.33%`, flexShrink: 0, textAlign: `center`, padding: `4px`, fontSize: `11px` }}
            >
              Playlists
            </button>
          </div>
        </div>
        <div id="search-section" className={activeTab === `search` ? `` : `hidden`} style={{ flexGrow: 1, display: `flex`, flexDirection: `column`, overflow: `hidden`, minHeight: 0 }}>
          <div id="search-bar" style={{ position: `relative`, flexShrink: 0 }}>
            <input
              type="text"
              id="search-input"
              placeholder="Buscar canción o pegar URL/Playlist..."
              spellCheck={false}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              style={{ paddingRight: `26px`, width: `100%`, boxSizing: `border-box`, background: `#222`, color: `white`, border: `1px solid #444`, padding: `4px`, fontSize: `11px` }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchPlaylistInfo(null); }}
                title="Limpiar búsqueda"
                style={{ position: `absolute`, right: `12px`, top: `50%`, transform: `translateY(-50%)`, background: `none`, border: `none`, color: `#888`, cursor: `pointer`, fontSize: `11px`, padding: `2px 4px` }}
              >
                ✕
              </button>
            )}
          </div>
          {searchPlaylistInfo && (
            <div style={{ padding: `6px 8px`, background: `rgba(74, 222, 128, 0.12)`, borderBottom: `1px solid #2d5a3c`, display: `flex`, flexDirection: `column`, gap: `5px`, flexShrink: 0 }}>
              <div style={{ fontSize: `11px`, color: `#4ade80`, fontWeight: `bold`, whiteSpace: `nowrap`, overflow: `hidden`, textOverflow: `ellipsis` }}>
                📑 {searchPlaylistInfo.name} ({searchPlaylistInfo.count} temas)
              </div>
              <div style={{ display: `flex`, gap: `6px` }}>
                <button
                  onClick={() => handlePlayTrack(searchPlaylistInfo.url, searchPlaylistInfo.name)}
                  style={{ flex: 1, background: `#238E23`, color: `white`, border: `none`, borderRadius: `3px`, padding: `3px 6px`, fontSize: `10px`, cursor: `pointer`, fontWeight: `bold` }}
                >
                  ▶ Encolar toda
                </button>
                <button
                  onClick={() => handleImportYoutubePlaylist(searchPlaylistInfo.url, searchPlaylistInfo.name)}
                  style={{ flex: 1, background: `#2563eb`, color: `white`, border: `none`, borderRadius: `3px`, padding: `3px 6px`, fontSize: `10px`, cursor: `pointer`, fontWeight: `bold` }}
                >
                  💾 Guardar Playlist
                </button>
              </div>
            </div>
          )}
          <ul id="search-results" style={{ listStyle: `none`, padding: 0, margin: 0, background: `#111`, flexGrow: 1, overflowY: `scroll` }}>
            {isSearching ? (
              <li className="queue-empty">Buscando... ⏳</li>
            ) : (
              searchResults.map((e, t) => (
                <li
                  key={t}
                  draggable={true}
                  onDragStart={(t) => t.dataTransfer.setData(`track`, JSON.stringify(e))}
                  onClick={() => handlePlayTrack(e.uri, e.title)}
                  title={e.title}
                  style={{ padding: `6px 8px`, cursor: `pointer`, borderBottom: `1px solid #222`, display: `flex`, justifyContent: `space-between` }}
                >
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: `nowrap`, overflow: `hidden`, textOverflow: `ellipsis`, paddingRight: `8px` }}>
                    {e.title}
                  </div>
                  <div style={{ display: `flex`, alignItems: `center`, gap: `4px`, flexShrink: 0 }}>
                    <span style={{ color: `#888`, fontSize: `10px` }}>{formatTime(e.duration_ms)}</span>
                    <button
                      className="queue-remove-btn"
                      title="Sonar siguiente"
                      onClick={(ev) => handlePlayNext(e.uri, e.title, ev)}
                      style={{ color: `#60a5fa`, marginLeft: `2px` }}
                    >
                      ⏭
                    </button>
                    {auth.user && (
                      <div className="save-menu-container" style={{ position: `relative` }}>
                        <button
                          className="queue-star-btn"
                          title="Añadir a Playlist"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSaveMenu(showSaveMenu === `s_${t}` ? null : `s_${t}`);
                          }}
                        >
                          ⭐
                        </button>
                        {renderSaveMenu(e, `s_${t}`)}
                      </div>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div id="history-section" className={activeTab === `history` ? `` : `hidden`} style={{ flexGrow: 1, display: `flex`, flexDirection: `column`, overflow: `hidden`, minHeight: 0 }}>
          {player.isConnected && player.history && player.history.length > 0 && (
            <div style={{ padding: `6px 8px`, background: `#181818`, borderBottom: `1px solid #333`, position: `relative`, flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Filtrar por canción o usuario..."
                spellCheck={false}
                value={historyFilter}
                onChange={(e) => { setHistoryFilter(e.target.value); setHistoryPage(0); }}
                style={{ width: `100%`, boxSizing: `border-box`, background: `#222`, color: `#fff`, border: `1px solid #444`, padding: `4px 24px 4px 6px`, fontSize: `11px` }}
              />
              {historyFilter && (
                <button
                  onClick={() => { setHistoryFilter(''); setHistoryPage(0); }}
                  style={{ position: `absolute`, right: `12px`, top: `50%`, transform: `translateY(-50%)`, background: `none`, border: `none`, color: `#888`, cursor: `pointer`, fontSize: `11px` }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <ul id="queue-list" style={{ flexGrow: 1, overflowY: `scroll`, minHeight: 0 }}>
            {player.isConnected ? (
              filteredHistory.length === 0 ? (
                <li className="queue-empty">{historyFilter ? 'Sin coincidencias en el historial' : 'El historial está vacío'}</li>
              ) : (
                filteredHistory.slice(historyPage * 15, (historyPage + 1) * 15).map((e, t) => (
                  <li
                    key={t}
                    draggable={true}
                    onDragStart={(t) => t.dataTransfer.setData(`track`, JSON.stringify(e))}
                    style={{ cursor: `pointer`, display: `flex`, justifyContent: `space-between`, padding: `6px 8px`, borderBottom: `1px solid #333` }}
                  >
                    <div className="queue-track-title" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ whiteSpace: `nowrap`, overflow: `hidden`, textOverflow: `ellipsis` }}>
                        <span style={{ opacity: 0.6, marginRight: `4px` }}>🕒</span> {e.title}
                      </div>
                      {e.played_by_name && (
                        <div style={{ fontSize: `9px`, color: `#888`, marginTop: `2px`, marginLeft: `16px` }}>
                          Pedido por: {e.played_by_name}
                        </div>
                      )}
                    </div>
                    <div className="queue-track-controls" style={{ display: `flex`, flexDirection: `column`, alignItems: `flex-end`, justifyContent: `center` }}>
                      <span style={{ fontSize: `10px`, color: `#888`, marginBottom: `4px`, whiteSpace: `nowrap` }}>
                        {timeAgo(e.played_at)}
                      </span>
                      <div style={{ display: `flex`, gap: `4px` }}>
                        {auth.user && (
                          <div className="save-menu-container" style={{ position: `relative` }}>
                            <button
                              className="queue-star-btn"
                              title="Añadir a Playlist"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSaveMenu(showSaveMenu === `h_${t}` ? null : `h_${t}`);
                              }}
                            >
                              ⭐
                            </button>
                            {renderSaveMenu(e, `h_${t}`)}
                          </div>
                        )}
                        <button
                          className="queue-remove-btn"
                          title="Sonar siguiente"
                          onClick={(ev) => handlePlayNext(e.uri, e.title, ev)}
                          style={{ color: `#60a5fa`, marginLeft: `2px` }}
                        >
                          ⏭
                        </button>
                        <button
                          className="queue-remove-btn"
                          title="Reproducir"
                          onClick={() => handlePlayTrack(e.uri, e.title)}
                          style={{ color: `#4ade80`, marginLeft: `2px` }}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )
            ) : (
              <li className="queue-empty">Conéctate a un canal de voz para ver el historial</li>
            )}
          </ul>
          {player.isConnected && filteredHistory.length > 0 && (
            <div style={{ display: `flex`, justifyContent: `space-between`, alignItems: `center`, padding: `8px`, background: `var(--wmp-grad-bottom)`, borderTop: `1px solid var(--wmp-color-bottom-border)`, flexShrink: 0, minHeight: `36px`, boxSizing: `border-box` }}>
              <button
                onClick={() => setHistoryPage((e) => Math.max(0, e - 1))}
                disabled={historyPage === 0}
                style={{ background: `transparent`, border: `1px solid var(--wmp-color-btn-border)`, color: `var(--wmp-text-menubar)`, padding: `2px 8px`, borderRadius: `3px`, cursor: historyPage === 0 ? `not-allowed` : `pointer`, opacity: historyPage === 0 ? 0.5 : 1 }}
              >
                ◀
              </button>
              <span style={{ fontSize: `11px`, color: `var(--wmp-text-menubar)` }}>
                Página {historyPage + 1} de {Math.max(1, Math.ceil(filteredHistory.length / 15))}
              </span>
              <button
                onClick={() => setHistoryPage((e) => e + 1)}
                disabled={historyPage >= Math.ceil(filteredHistory.length / 15) - 1}
                style={{ background: `transparent`, border: `1px solid var(--wmp-color-btn-border)`, color: `var(--wmp-text-menubar)`, padding: `2px 8px`, borderRadius: `3px`, cursor: historyPage >= Math.ceil(filteredHistory.length / 15) - 1 ? `not-allowed` : `pointer`, opacity: historyPage >= Math.ceil(filteredHistory.length / 15) - 1 ? 0.5 : 1 }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
        <div id="playlists-section" className={activeTab === `playlists` ? `` : `hidden`} style={{ flexGrow: 1, display: `flex`, flexDirection: `column`, overflow: `hidden`, minHeight: 0 }}>
          {auth.user ? (
            playlists.currentPlaylist ? (
              <div className="playlist-detail" style={{ flexGrow: 1, display: `flex`, flexDirection: `column`, overflow: `hidden`, minHeight: 0 }}>
                <div style={{ padding: `8px`, borderBottom: `1px solid #444`, display: `flex`, justifyContent: `space-between`, alignItems: `center`, flexShrink: 0, gap: `4px` }}>
                  <div style={{ flex: 1, minWidth: 0, whiteSpace: `nowrap`, overflow: `hidden`, textOverflow: `ellipsis`, paddingRight: `4px`, display: `flex`, alignItems: `center`, gap: `4px` }}>
                    <button onClick={() => { playlists.setCurrentPlaylist(null); setPlaylistFilter(''); }} style={{ background: `none`, color: `#ccc`, border: `none`, cursor: `pointer`, padding: 0 }}>
                      ←
                    </button>
                    <strong style={{ color: `#fff`, overflow: `hidden`, textOverflow: `ellipsis` }} title={playlists.currentPlaylist.name}>{playlists.currentPlaylist.name}</strong>
                    <button
                      onClick={() => openRenamePlaylistModal(playlists.currentPlaylist.name)}
                      title="Renombrar playlist"
                      style={{ background: `none`, border: `none`, color: `#aaa`, cursor: `pointer`, fontSize: `11px`, padding: `0 2px`, flexShrink: 0 }}
                    >
                      ✏️
                    </button>
                  </div>
                  <div style={{ display: `flex`, gap: `4px`, flexShrink: 0 }}>
                    <button
                      onClick={() => playlists.loadPlaylist(playlists.currentPlaylist.name, false)}
                      title="Cargar playlist en orden"
                      style={{ background: `#238E23`, color: `white`, border: `none`, borderRadius: `4px`, padding: `4px 7px`, cursor: `pointer`, fontSize: `10px`, fontWeight: `bold` }}
                    >
                      ▶ Cargar
                    </button>
                    <button
                      onClick={() => playlists.loadPlaylist(playlists.currentPlaylist.name, true)}
                      title="Cargar playlist mezclada (aleatorio)"
                      style={{ background: `#2563eb`, color: `white`, border: `none`, borderRadius: `4px`, padding: `4px 7px`, cursor: `pointer`, fontSize: `10px`, fontWeight: `bold` }}
                    >
                      🔀 Mezclar
                    </button>
                  </div>
                </div>
                {playlists.currentPlaylist.tracks.length > 0 && (
                  <div style={{ padding: `5px 8px`, background: `#181818`, borderBottom: `1px solid #333`, position: `relative`, flexShrink: 0 }}>
                    <input
                      type="text"
                      placeholder="Filtrar canciones en esta playlist..."
                      spellCheck={false}
                      value={playlistFilter}
                      onChange={(e) => setPlaylistFilter(e.target.value)}
                      style={{ width: `100%`, boxSizing: `border-box`, background: `#222`, color: `#fff`, border: `1px solid #444`, padding: `3px 22px 3px 6px`, fontSize: `11px` }}
                    />
                    {playlistFilter && (
                      <button
                        onClick={() => setPlaylistFilter('')}
                        style={{ position: `absolute`, right: `12px`, top: `50%`, transform: `translateY(-50%)`, background: `none`, border: `none`, color: `#888`, cursor: `pointer`, fontSize: `11px` }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
                <ul id="queue-list" style={{ flexGrow: 1, overflowY: `scroll`, minHeight: 0 }}>
                  {filteredPlaylistTracks.length === 0 ? (
                    <li className="queue-empty">{playlistFilter ? 'Sin coincidencias' : 'Vacía'}</li>
                  ) : (
                    filteredPlaylistTracks.map(({ track: e, origIdx: t }) => (
                      <li
                        key={t}
                        draggable={!playlistFilter}
                        onDragStart={(mobileView) => {
                          mobileView.dataTransfer.setData(`track`, JSON.stringify(e));
                          setPlaylistDragIndex(t);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setPlaylistDragOverIndex(t);
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          if (e.dataTransfer.getData(`track`) && playlistDragIndex !== null && playlistDragIndex !== t) {
                            await playlists.reorderPlaylist(playlists.currentPlaylist.name, playlistDragIndex, t);
                          }
                          setPlaylistDragIndex(null);
                          setPlaylistDragOverIndex(null);
                        }}
                        style={{ cursor: `pointer`, display: `flex`, justifyContent: `space-between`, padding: `6px 8px`, borderBottom: `1px solid #333`, borderTop: playlistDragOverIndex === t ? `2px solid #4ade80` : `2px solid transparent` }}
                      >
                        <div className="queue-track-title" style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ opacity: 0.6, marginRight: `4px` }}>🎵</span> {e.title}
                        </div>
                        <div className="queue-track-controls" style={{ flexShrink: 0 }}>
                          <span style={{ fontSize: `10px`, color: `#888` }}>{formatTime(e.duration_ms)}</span>
                          <button className="queue-remove-btn" title="Sonar siguiente" onClick={(ev) => handlePlayNext(e.uri, e.title, ev)} style={{ color: `#60a5fa`, marginLeft: `4px` }}>⏭</button>
                          <button className="queue-remove-btn" title="Reproducir" onClick={() => handlePlayTrack(e.uri, e.title)} style={{ color: `#4ade80`, marginLeft: `4px` }}>▶</button>
                          <button className="queue-remove-btn" title="Quitar de playlist" onClick={() => playlists.removeFromPlaylist(playlists.currentPlaylist.name, e.uri)} style={{ marginLeft: `4px` }}>X</button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                <div id="playlist-footer" style={{ flexShrink: 0 }}>
                  {playlists.currentPlaylist.tracks.length} canciones • {formatTotalDuration(currentPlaylistDurationMs)}
                </div>
              </div>
            ) : (
              <div style={{ flexGrow: 1, display: `flex`, flexDirection: `column`, overflow: `hidden`, minHeight: 0 }}>
                <div style={{ padding: `6px 8px`, borderBottom: `1px solid #333`, display: `flex`, gap: `6px`, flexShrink: 0, background: `#161616` }}>
                  <button
                    onClick={() => openCreatePlaylistModal()}
                    style={{ flex: 1, background: `#222`, color: `#4ade80`, border: `1px solid #333`, borderRadius: `3px`, padding: `4px 6px`, fontSize: `10px`, cursor: `pointer`, fontWeight: `bold` }}
                  >
                    + Nueva
                  </button>
                  <button
                    onClick={() => handleImportYoutubePlaylist()}
                    title="Importar Playlist desde enlace de YouTube"
                    style={{ flex: 1, background: `#222`, color: `#60a5fa`, border: `1px solid #333`, borderRadius: `3px`, padding: `4px 6px`, fontSize: `10px`, cursor: `pointer`, fontWeight: `bold` }}
                  >
                    📥 Importar YT
                  </button>
                </div>
                {Object.keys(playlists.playlists || {}).length > 0 && (
                  <div style={{ padding: `5px 8px`, background: `#181818`, borderBottom: `1px solid #333`, position: `relative`, flexShrink: 0 }}>
                    <input
                      type="text"
                      placeholder="Filtrar playlists..."
                      spellCheck={false}
                      value={playlistFilter}
                      onChange={(e) => setPlaylistFilter(e.target.value)}
                      style={{ width: `100%`, boxSizing: `border-box`, background: `#222`, color: `#fff`, border: `1px solid #444`, padding: `3px 22px 3px 6px`, fontSize: `11px` }}
                    />
                    {playlistFilter && (
                      <button
                        onClick={() => setPlaylistFilter('')}
                        style={{ position: `absolute`, right: `12px`, top: `50%`, transform: `translateY(-50%)`, background: `none`, border: `none`, color: `#888`, cursor: `pointer`, fontSize: `11px` }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
                <ul id="queue-list" style={{ flexGrow: 1, overflowY: `scroll`, minHeight: 0 }}>
                  {filteredPlaylistEntries.length === 0 ? (
                    <li className="queue-empty">{playlistFilter ? 'Sin coincidencias' : 'No tienes playlists guardadas'}</li>
                  ) : (
                    filteredPlaylistEntries.map(([e, t]) => (
                      <li key={e} style={{ cursor: `pointer`, display: `flex`, justifyContent: `space-between`, padding: `6px 8px`, borderBottom: `1px solid #333` }} onClick={() => { setPlaylistFilter(''); playlists.fetchPlaylist(e); }}>
                        <div className="queue-track-title" style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ opacity: 0.6, marginRight: `4px` }}>📁</span> {e}
                        </div>
                        <div className="queue-track-controls" style={{ gap: `6px`, flexShrink: 0 }}>
                          <span style={{ fontSize: `10px`, color: `#888` }}>
                            {t} temas • {formatTotalDuration(playlists.playlistDurations?.[e] || 0)}
                          </span>
                          <button className="queue-remove-btn" title="Renombrar playlist" onClick={(ev) => { ev.stopPropagation(); openRenamePlaylistModal(e); }}>✏️</button>
                          <button className="queue-remove-btn" title="Eliminar playlist" onClick={(ev) => { ev.stopPropagation(); openDeletePlaylistModal(e); }}>🗑️</button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )
          ) : (
            <div style={{ padding: `20px`, textAlign: `center`, color: `#888` }}>Inicia sesión</div>
          )}
        </div>
      </>
    )}
  </div>
  <div className="resize-handle" onMouseDown={startResizeQueue} onTouchStart={startResizeQueue} style={{ cursor: `col-resize`, width: `4px`, background: `var(--wmp-color-menubar-border)`, display: currentView !== 'player' ? 'none' : undefined }}></div>
  <div id="wmp-queue-panel" className={mobileView === `queue` ? `` : `mobile-hidden`} style={{ width: `${queuePanelWidth}px`, minWidth: `200px`, display: currentView !== 'player' ? 'none' : undefined }}>
    <div id="playlist-header" style={{ flexShrink: 0, minHeight: `32px`, boxSizing: `border-box`, display: `flex`, justifyContent: `space-between`, alignItems: `center`, paddingRight: `6px` }}>
      <div style={{ padding: `4px`, fontSize: `11px`, fontWeight: `bold` }}>Cola de Reproducción</div>
      <div style={{ display: `flex`, gap: `4px` }}>
        <button
          onClick={handleSaveQueueAsPlaylist}
          title="Guardar cola actual como Playlist"
          style={{ background: `var(--wmp-grad-btn)`, color: `var(--wmp-text-btn)`, border: `1px solid var(--wmp-color-btn-border)`, borderRadius: `3px`, padding: `2px 6px`, fontSize: `10px`, cursor: `pointer` }}
        >
          💾 Guardar
        </button>
        {player.queue && player.queue.length > 0 && (
          <button
            onClick={handleClearQueue}
            title="Limpiar cola sin detener la canción actual"
            style={{ background: `var(--wmp-grad-btn)`, color: `var(--wmp-text-btn)`, border: `1px solid var(--wmp-color-btn-border)`, borderRadius: `3px`, padding: `2px 6px`, fontSize: `10px`, cursor: `pointer` }}
          >
            🧹 Limpiar
          </button>
        )}
      </div>
    </div>
    <div id="queue-section" style={{ flexGrow: 1, overflowY: `scroll` }} onDragOver={(e) => e.preventDefault()} onDrop={async (e) => { e.preventDefault(); let t = e.dataTransfer.getData(`track`); if (t) { let e = JSON.parse(t); await handlePlayTrack(e.uri, e.title); } }}>
      <ul id="queue-list" style={{ minHeight: `100%`, paddingBottom: `40px` }}>
        {player.nowPlaying && (
          <li className="now-playing-indicator">
            <span className="np-icon">▶</span>
            <span className="np-title">{player.nowPlaying.title}</span>
            <span style={{ fontSize: `10px` }}>{formatTime(player.nowPlaying.duration_ms)}</span>
          </li>
        )}
        {!player.queue || player.queue.length === 0 ? (
          <li className="queue-empty">La cola está vacía</li>
        ) : (
          player.queue.map((e, t) => (
            <li key={t} draggable={!!auth.user} onDragStart={auth.user ? (e) => { setDraggedItemIndex(t); e.dataTransfer.effectAllowed = `move`; } : undefined} onDragOver={auth.user ? (e) => { e.preventDefault(); setDragOverIndex(t); } : undefined} onDrop={auth.user ? (e) => { e.preventDefault(); e.stopPropagation(); let mobileView = e.dataTransfer.getData(`track`); if (mobileView) { let e = JSON.parse(mobileView); handlePlayTrack(e.uri, e.title, t); } else if (draggedItemIndex !== null && draggedItemIndex !== t) { player.reorder(draggedItemIndex, t); } setDraggedItemIndex(null); setDragOverIndex(null); } : undefined} style={{ cursor: auth.user ? `grab` : `default`, display: `flex`, justifyContent: `space-between`, padding: `6px 8px`, borderBottom: `1px solid #333`, borderTop: dragOverIndex === t ? `2px solid #4ade80` : `2px solid transparent` }}>
              <div className="queue-track-title" title={e.title}>
                <span style={{ opacity: 0.6 }}>≡ {t + 1}.</span> {e.title}
              </div>
              <div className="queue-track-controls" style={{ display: `flex`, gap: `4px`, alignItems: `center` }}>
                <span style={{ fontSize: `10px` }}>{formatTime(e.duration_ms)}</span>
                {auth.user && (
                  <div className="save-menu-container" style={{ position: `relative` }}>
                    <button className="queue-star-btn" title="Añadir a Playlist" onClick={(e) => { e.stopPropagation(); setShowSaveMenu(showSaveMenu === `q_${t}` ? null : `q_${t}`); }}>⭐</button>
                    {showSaveMenu === `q_${t}` && renderSaveMenu(e, `q_${t}`)}
                  </div>
                )}
                <button className="queue-remove-btn" onClick={requireAuth(() => player.remove(t))}>X</button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
    <div id="playlist-footer">
      {player.queue?.length || 0} canciones • {formatTotalDuration(totalQueueDurationMs)}
    </div>
  </div>
          </>
        ) : (
<div className="xp-login-screen">
              <div className="xp-login-top"></div>
              <div className="xp-login-middle">
                <div className="xp-login-left">
                  <div className="xp-left-content" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginRight: "20px" }}>
                    <div className="xp-logo" style={{ marginBottom: "15px", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <img src="/windows-xp-icon-logo.png" alt="Windows XP" style={{ height: "64px", marginBottom: "8px", filter: "drop-shadow(2px 2px 3px rgba(0,0,0,0.4))" }} />
                      <div style={{ fontWeight: "bold", fontFamily: "'Arial Black', sans-serif", fontSize: "26px", lineHeight: "1", color: "white", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>CriZpy</div>
                      <div style={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", fontSize: "20px", lineHeight: "1.2", color: "#ff6600", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>Media Player</div>
                    </div>
                    <div className="xp-welcome-text" style={{ fontFamily: "Tahoma, sans-serif", fontSize: "18px", textShadow: "1px 1px 2px rgba(0,0,0,0.8)", textAlign: "left", lineHeight: "1.2", margin: "0" }}>Haga clic en su nombre<br/>para comenzar</div>
                  </div>
                </div>
                
                <div className="xp-divider"></div>
  
                <div className="xp-login-right">
                  {auth.user ? (
                    <div className="xp-user-card" onClick={() => setCurrentView("player")}>
                      <div className="xp-avatar">
                        <img 
                          src={auth.user.avatar ? (auth.user.avatar.startsWith("http") ? auth.user.avatar : `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png`) : "https://cdn.discordapp.com/embed/avatars/0.png"} 
                          alt="Avatar" 
                          style={{ objectFit: "cover", width: "100%", height: "100%" }} 
                          onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn.discordapp.com/embed/avatars/0.png"; }}
                        />
                      </div>
                      <div className="xp-user-info">
                        <div className="xp-user-name">{auth.user.name || auth.user.username}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="xp-user-card" onClick={auth.login}>
                      <div className="xp-avatar">
                        <img src="/michis.jpg" alt="Guest" style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      </div>
                      <div className="xp-user-info">
                        <div className="xp-user-name">Usuario</div>
                        <div className="xp-user-status">Haga clic para iniciar sesión</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="xp-login-bottom">
                <div className="xp-power-btn" onClick={() => { if (auth.user) setShowLogoutModal(true); }}>
                  <div className="xp-power-icon">⏻</div>
                  <span style={{ color: "white" }}>Cerrar sesión</span>
                </div>
                {!auth.user && (
                  <div style={{ fontFamily: "Tahoma, sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.7)", textShadow: "1px 1px 2px rgba(0,0,0,0.6)", textAlign: "right" }}>Debes de iniciar sesión para poder usar el Player</div>
                )}
              </div>
            </div>
        )}

  
      {showLogoutModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            width: "350px",
            backgroundColor: "#ece9d8",
            border: "1px solid #0054e3",
            borderTopLeftRadius: "5px",
            borderTopRightRadius: "5px",
            boxShadow: "2px 2px 10px rgba(0,0,0,0.5)",
            fontFamily: "Tahoma, sans-serif",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}>
            {/* XP Title Bar */}
            <div style={{
              background: "linear-gradient(180deg, #0058e6 0%, #3a93ff 9%, #288eff 18%, #127dff 27%, #036bfe 46%, #0262ee 50%, #0054e3 53%, #0054e3 76%, #0055eb 87%, #005bf5 100%)",
              padding: "4px 6px",
              color: "white",
              fontWeight: "bold",
              fontSize: "13px",
              textShadow: "1px 1px 1px rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ marginLeft: "2px" }}>Cerrar sesión</span>
              <div 
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: "linear-gradient(180deg, #e59779 0%, #da5f38 100%)",
                  border: "1px solid white",
                  borderRadius: "3px",
                  width: "21px",
                  height: "21px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: 1,
                  boxShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}
              >×</div>
            </div>
            
            {/* Modal Body */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", background: "linear-gradient(180deg, #fff 0%, #ece9d8 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px", width: "100%", justifyContent: "center" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  background: "url('/windows-xp-icon-logo.png') center/contain no-repeat",
                  marginRight: "15px",
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"
                }}></div>
                <div style={{ fontSize: "14px", color: "black", maxWidth: "200px", lineHeight: "1.3" }}>
                  Estás a punto de cerrar sesión ¿Estás de acuerdo?
                </div>
              </div>
              
              {/* Buttons */}
              <div style={{ display: "flex", gap: "20px" }}>
                <button 
                  onClick={() => {
                    auth.logout();
                    setShowLogoutModal(false);
                  }}
                  style={{
                    padding: "4px 20px",
                    background: "linear-gradient(180deg, #4da4ff 0%, #0060fb 100%)",
                    border: "1px solid #003c74",
                    borderRadius: "3px",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.3)",
                    minWidth: "75px"
                  }}
                >SÍ</button>
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  style={{
                    padding: "4px 20px",
                    background: "linear-gradient(180deg, #ff7b7b 0%, #e60000 100%)",
                    border: "1px solid #8b0000",
                    borderRadius: "3px",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.3)",
                    minWidth: "75px"
                  }}
                >NO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {xpModal && (
        <div
          onClick={() => setXpModal(null)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "360px",
              maxWidth: "92vw",
              backgroundColor: "#ece9d8",
              border: "1px solid #0054e3",
              borderTopLeftRadius: "5px",
              borderTopRightRadius: "5px",
              boxShadow: "2px 2px 12px rgba(0,0,0,0.6)",
              fontFamily: "Tahoma, sans-serif",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* XP Title Bar */}
            <div style={{
              background: "linear-gradient(180deg, #0058e6 0%, #3a93ff 9%, #288eff 18%, #127dff 27%, #036bfe 46%, #0262ee 50%, #0054e3 53%, #0054e3 76%, #0055eb 87%, #005bf5 100%)",
              padding: "4px 6px",
              color: "white",
              fontWeight: "bold",
              fontSize: "13px",
              textShadow: "1px 1px 1px rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ marginLeft: "2px" }}>{xpModal.title}</span>
              <div
                onClick={() => setXpModal(null)}
                style={{
                  background: "linear-gradient(180deg, #e59779 0%, #da5f38 100%)",
                  border: "1px solid white",
                  borderRadius: "3px",
                  width: "21px",
                  height: "21px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: 1,
                  boxShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}
              >×</div>
            </div>

            {/* XP Modal Body */}
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px", background: "linear-gradient(180deg, #fff 0%, #ece9d8 100%)", color: "#111" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                  background: "url('/windows-xp-icon-logo.png') center/contain no-repeat",
                  filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"
                }}></div>
                <div style={{ fontSize: "12px", color: "#111", lineHeight: "1.35" }}>
                  {xpModal.message}
                </div>
              </div>

              {(xpModal.type === 'single' || xpModal.type === 'double') && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    {xpModal.label1 && <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "3px", color: "#222" }}>{xpModal.label1}</div>}
                    <input
                      type="text"
                      autoFocus
                      value={xpModal.value1 || ''}
                      placeholder={xpModal.placeholder1 || ''}
                      onChange={(e) => setXpModal({ ...xpModal, value1: e.target.value })}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const fn = xpModal.onConfirm;
                          const v1 = xpModal.value1;
                          const v2 = xpModal.value2;
                          setXpModal(null);
                          if (fn) await fn(v1, v2);
                        } else if (e.key === 'Escape') {
                          setXpModal(null);
                        }
                      }}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "5px 6px",
                        fontSize: "12px",
                        fontFamily: "Tahoma, sans-serif",
                        border: "1px solid #7f9db9",
                        backgroundColor: "#fff",
                        color: "#000"
                      }}
                    />
                  </div>
                  {xpModal.type === 'double' && (
                    <div>
                      {xpModal.label2 && <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "3px", color: "#222" }}>{xpModal.label2}</div>}
                      <input
                        type="text"
                        value={xpModal.value2 || ''}
                        placeholder={xpModal.placeholder2 || ''}
                        onChange={(e) => setXpModal({ ...xpModal, value2: e.target.value })}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const fn = xpModal.onConfirm;
                            const v1 = xpModal.value1;
                            const v2 = xpModal.value2;
                            setXpModal(null);
                            if (fn) await fn(v1, v2);
                          } else if (e.key === 'Escape') {
                            setXpModal(null);
                          }
                        }}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "5px 6px",
                          fontSize: "12px",
                          fontFamily: "Tahoma, sans-serif",
                          border: "1px solid #7f9db9",
                          backgroundColor: "#fff",
                          color: "#000"
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
                <button
                  onClick={async () => {
                    const fn = xpModal.onConfirm;
                    const v1 = xpModal.value1;
                    const v2 = xpModal.value2;
                    setXpModal(null);
                    if (fn) await fn(v1, v2);
                  }}
                  style={{
                    padding: "4px 16px",
                    background: "linear-gradient(180deg, #4da4ff 0%, #0060fb 100%)",
                    border: "1px solid #003c74",
                    borderRadius: "3px",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.3)",
                    minWidth: "75px"
                  }}
                >
                  {xpModal.confirmText || 'Aceptar'}
                </button>
                <button
                  onClick={() => setXpModal(null)}
                  style={{
                    padding: "4px 16px",
                    background: "linear-gradient(180deg, #ff7b7b 0%, #e60000 100%)",
                    border: "1px solid #8b0000",
                    borderRadius: "3px",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.3)",
                    minWidth: "75px"
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div
          onClick={() => setShowActivityModal(false)}
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "540px",
              maxWidth: "94vw",
              maxHeight: "82vh",
              backgroundColor: "#ece9d8",
              border: "1px solid #0054e3",
              borderTopLeftRadius: "5px",
              borderTopRightRadius: "5px",
              boxShadow: "2px 2px 14px rgba(0,0,0,0.65)",
              fontFamily: "Tahoma, sans-serif",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* XP Title Bar */}
            <div style={{
              background: "linear-gradient(180deg, #0058e6 0%, #3a93ff 9%, #288eff 18%, #127dff 27%, #036bfe 46%, #0262ee 50%, #0054e3 53%, #0054e3 76%, #0055eb 87%, #005bf5 100%)",
              padding: "4px 6px",
              color: "white",
              fontWeight: "bold",
              fontSize: "13px",
              textShadow: "1px 1px 1px rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0
            }}>
              <span style={{ marginLeft: "2px" }}>📁 Archivo — Registro de Movimientos (Últimas 48 horas)</span>
              <div
                onClick={() => setShowActivityModal(false)}
                style={{
                  background: "linear-gradient(180deg, #e59779 0%, #da5f38 100%)",
                  border: "1px solid white",
                  borderRadius: "3px",
                  width: "21px",
                  height: "21px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: 1,
                  boxShadow: "1px 1px 2px rgba(0,0,0,0.3)"
                }}
              >×</div>
            </div>

            {/* Filter & Toolbar */}
            <div style={{ padding: "8px 10px", background: "#dcd9c8", borderBottom: "1px solid #b5b2a3", display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Buscar por usuario, canción o acción..."
                  spellCheck={false}
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "4px 6px",
                    fontSize: "11px",
                    fontFamily: "Tahoma, sans-serif",
                    border: "1px solid #7f9db9",
                    backgroundColor: "#fff",
                    color: "#000"
                  }}
                />
                {activityFilter && (
                  <button
                    onClick={() => setActivityFilter('')}
                    style={{ padding: "3px 7px", fontSize: "11px", cursor: "pointer", border: "1px solid #7f9db9", background: "#f5f4ea", color: "#333" }}
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={() => player.fetchActivity?.()}
                  title="Refrescar registro"
                  style={{ padding: "3px 8px", fontSize: "11px", cursor: "pointer", border: "1px solid #7f9db9", background: "#f5f4ea", color: "#111", fontWeight: "bold" }}
                >
                  🔄 Actualizar
                </button>
              </div>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {[
                  { id: 'all', label: '📋 Todos' },
                  { id: 'web', label: '🌐 Player Web' },
                  { id: 'discord', label: '💬 Discord' },
                  { id: 'bot', label: '🤖 Automático' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivitySourceFilter(tab.id)}
                    style={{
                      padding: "2px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                      border: activitySourceFilter === tab.id ? "1px solid #003c74" : "1px solid #999",
                      borderRadius: "3px",
                      background: activitySourceFilter === tab.id ? "linear-gradient(180deg, #4da4ff 0%, #0060fb 100%)" : "#f5f4ea",
                      color: activitySourceFilter === tab.id ? "#fff" : "#222",
                      fontWeight: activitySourceFilter === tab.id ? "bold" : "normal"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity List */}
            <div style={{ flex: 1, overflowY: "auto", background: "#141414", color: "#eee", padding: "4px 0", minHeight: "240px", maxHeight: "360px" }}>
              {(() => {
                const list = (player.activityLog || []).filter((item) => {
                  if (activitySourceFilter !== 'all' && item.source !== activitySourceFilter) return false;
                  const q = activityFilter.trim().toLowerCase();
                  if (!q) return true;
                  return (item.text || '').toLowerCase().includes(q);
                });
                if (list.length === 0) {
                  return (
                    <div style={{ padding: "30px 16px", textAlign: "center", color: "#888", fontSize: "12px" }}>
                      No hay movimientos registrados en las últimas 48 horas con este filtro.
                    </div>
                  );
                }
                return list.map((item, idx) => {
                  const dt = item.timestamp ? new Date(item.timestamp) : null;
                  const exactTime = dt && !isNaN(dt.getTime())
                    ? dt.toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '';
                  const badgeColor = item.source === 'discord' ? '#5865F2' : item.source === 'web' ? '#16a34a' : '#555';
                  const badgeText = item.source === 'discord' ? 'Discord' : item.source === 'web' ? 'Web' : 'Bot';
                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 10px",
                        borderBottom: "1px solid #262626",
                        fontSize: "11px"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                        <span style={{
                          background: badgeColor,
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: "bold",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          flexShrink: 0
                        }}>
                          {badgeText}
                        </span>
                        <span style={{ color: "#e5e7eb", wordBreak: "break-word", lineHeight: "1.3" }}>
                          {item.text}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, color: "#9ca3af", fontSize: "10px" }}>
                        <span>{timeAgo(item.timestamp)}</span>
                        {exactTime && <span style={{ fontSize: "9px", opacity: 0.7 }}>{exactTime}</span>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: "8px 12px", background: "#ece9d8", borderTop: "1px solid #b5b2a3", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "11px", color: "#333" }}>
                Total en últimas 48h: <b>{(player.activityLog || []).length}</b> movimientos
              </span>
              <button
                onClick={() => setShowActivityModal(false)}
                style={{
                  padding: "4px 18px",
                  background: "linear-gradient(180deg, #4da4ff 0%, #0060fb 100%)",
                  border: "1px solid #003c74",
                  borderRadius: "3px",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
</>
  </div>
  {isMiniMode && currentView === 'player' && (
    <div className="mini-mode-bar">
      <div className="mini-next-track" title={player.queue?.[0]?.title || 'Cola vacía'}>
        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>Siguiente:</span>{' '}
        {player.queue?.[0] ? player.queue[0].title : 'Fin de la cola'}
      </div>
      <div className="mini-queue-meta">
        <span>{player.queue?.length || 0} en cola ({formatTotalDuration(totalQueueDurationMs)})</span>
        <button className="mini-expand-btn" onClick={() => setIsMiniMode(false)} title="Volver al reproductor completo">
          🗖 Expandir
        </button>
      </div>
    </div>
  )}
  <div id="wmp-bottom-area" style={{ flexShrink: 0 }}>
    <div id="bottom-info-bar">
      <span id="time-current">0:00</span>
      <marquee scrollAmount="3" id="bottom-marquee">Hecho por: TioCriZpy</marquee>
      <span id="time-total">0:00</span>
    </div>
    <div id="controls-row">
      <div className="play-btn-wrapper">
        <button id="btn-play" className="control-btn play-btn" title="Play / Pausa" onClick={requireAuth(player.pause)}>
          {isPlaying ? (
            <svg id="icon-pause" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg id="icon-play" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
      <div className="small-controls">
        <button id="btn-stop" className="control-btn sm-btn" title="Detener" onClick={requireAuth(player.stop)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
        <button id="btn-prev" className="control-btn sm-btn" title="Anterior (Reiniciar)" onClick={requireAuth(player.prev)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button id="btn-next" className="control-btn sm-btn" title="Siguiente" onClick={requireAuth(player.skip)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
        <button id="btn-mute" className="control-btn sm-btn" title="Mute" onClick={requireAuth(() => { player.setVolume(player.status?.volume > 0 ? 0 : displayToRealVolume(100)); setLocalVolume(null); })}>
          {player.status?.volume === 0 ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
        <div id="volume-section">
          <input type="range" id="volume-slider" min="0" max="100" value={localVolume ?? realToDisplayVolume(player.status?.volume ?? 100)} onChange={requireAuth((e) => setLocalVolume(e.target.value))} onMouseUp={requireAuth((e) => { player.setVolume(displayToRealVolume(e.target.value)); setLocalVolume(null); })} onTouchEnd={requireAuth((e) => { player.setVolume(displayToRealVolume(e.target.value)); setLocalVolume(null); })} style={{ "--val": `${localVolume ?? realToDisplayVolume(player.status?.volume ?? 100)}%` }} />
        </div>
      </div>
      <button className={`toggle-btn ${player.status?.shuffle ? `active` : ``}`} title={player.status?.shuffle ? `Aleatorio: ON` : `Aleatorio: OFF`} onClick={requireAuth(player.toggleShuffle)}>🔀</button>
      <button className={`toggle-btn ${player.status?.repeat ? `active` : ``}`} title={player.status?.repeat ? `Repetir: ON` : `Repetir: OFF`} onClick={requireAuth(player.toggleRepeat)}>🔁</button>
      <div id="progress-section">
        <input type="range" id="seek-slider" min="0" max="100" defaultValue="0" onMouseDown={(e) => { e.target.dataset.isSeeking = `true`; }} onTouchStart={(e) => { e.target.dataset.isSeeking = `true`; }} onChange={(e) => { e.target.style.setProperty(`--val`, `${e.target.value}%`); }} onMouseUp={requireAuth((e) => { e.target.dataset.isSeeking = ``; let t = e.target.dataset.duration || 0; t > 0 && player.seek((e.target.value / 100) * (t / 1e3)); })} onTouchEnd={requireAuth((e) => { e.target.dataset.isSeeking = ``; let t = e.target.dataset.duration || 0; t > 0 && player.seek((e.target.value / 100) * (t / 1e3)); })} />
      </div>
    </div>
  </div>
  
  {contextMenu && (
    <div style={{ position: `absolute`, top: contextMenu.y, left: contextMenu.x, zIndex: 1e3, background: `var(--wmp-bg-dark)`, border: `1px solid var(--wmp-silver)`, borderRadius: `4px`, boxShadow: `2px 2px 10px rgba(0,0,0,0.8)`, color: `white`, minWidth: `150px`, fontSize: `13px` }}>
      <div style={{ padding: `8px 12px`, cursor: `pointer`, borderBottom: `1px solid #333` }} onClick={() => { player.reorder(contextMenu.index, 0); setContextMenu(null); }} onMouseEnter={(e) => (e.target.style.background = `#333`)} onMouseLeave={(e) => (e.target.style.background = `transparent`)}>
        ⬆️ Mover al tope
      </div>
      <div style={{ padding: `8px 12px`, cursor: `pointer` }} onClick={async () => { await player.reorder(contextMenu.index, 0); await player.skip(); setContextMenu(null); }} onMouseEnter={(e) => (e.target.style.background = `#333`)} onMouseLeave={(e) => (e.target.style.background = `transparent`)}>
        ▶️ Reproducir ahora
      </div>
    </div>
  )}
  
  <div className={`toast-notification ${toast ? `visible` : ``}`}>
    {toast}
  </div>

    </div>
  )
}

export default App;
