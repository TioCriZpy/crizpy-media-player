import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws`;
const API_KEY = import.meta.env.VITE_API_KEY || '';
const searchCache = new Map();
const SEARCH_CACHE_TTL_MS = 600 * 1000; // 10 minutos

export function usePlayer() {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [progress, setProgress] = useState({ position: 0, duration: 0 });
  const [listeners, setListeners] = useState([]);
  const [channelName, setChannelName] = useState('');

  useEffect(() => {
    let ws;
    let reconnectTimer;
    let isMounted = true;

    const connectWS = () => {
      const token = localStorage.getItem('session_token');
      const wsUrl = `${WS_URL}?api_key=${API_KEY}${token ? `&session_token=${token}` : ''}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Sincronizar estado inicial por REST
        fetchStatus();
        fetchNowPlaying();
        fetchQueue();
        fetchHistory();
        fetchActivity();
        fetchListeners();
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;
          
          if (type === 'progress') {
            const pos = data.position_ms || 0;
            const dur = data.duration_ms || 0;
            // Actualización directa al DOM para evitar re-renders masivos
            const formatTime = (ms) => {
              if (!ms) return '0:00';
              const sTotal = Math.floor(ms / 1000);
              const m = Math.floor(sTotal / 60);
              const s = sTotal % 60;
              return `${m}:${s < 10 ? '0' : ''}${s}`;
            };
            
            const timeCur = document.getElementById('time-current');
            const timeTot = document.getElementById('time-total');
            const slider = document.getElementById('seek-slider');
            const npTime = document.getElementById('np-time-total');
            
            if (timeCur) timeCur.innerText = formatTime(pos);
            if (timeTot) timeTot.innerText = formatTime(dur);
            if (npTime) npTime.innerText = formatTime(dur);
            
            if (slider && slider.dataset.isSeeking !== 'true') {
              const pct = dur > 0 ? (pos / dur) * 100 : 0;
              slider.value = pct;
              slider.style.setProperty('--val', `${pct}%`);
              slider.dataset.duration = dur; // Guardamos para el seek
            } else if (slider) {
              slider.dataset.duration = dur; // Solo guardar duración sin mover
            }
          } else if (type === 'track_change') {
            setNowPlaying(data);
          } else if (type === 'queue_update') {
            setQueue(data || []);
          } else if (type === 'history_update') {
            setHistory(prev => [data, ...prev].slice(0, 100));
          } else if (type === 'activity_update') {
            setActivityLog(prev => [data, ...prev].slice(0, 400));
          } else if (type === 'listeners_update') {
            setListeners(data.listeners || []);
            setChannelName(data.channel_name || '');
          } else if (type === 'state_change') {
            setStatus((prev) => ({ ...prev, ...data }));
          } else if (type === 'track_added') {
            if (window.showToastCallback) window.showToastCallback(`Se agregó: ${data.title}`);
          } else if (type === 'toast') {
            if (window.showToastCallback) window.showToastCallback(data.message);
          } else if (type === 'channel_switched') {
            fetchStatus();
            fetchNowPlaying();
            fetchQueue();
            fetchHistory();
            fetchActivity();
            fetchListeners();
          }
        } catch (e) {
          console.error("Error parseando WS:", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!isMounted) return;
        // Intentar reconectar en 3 segundos si se cae
        reconnectTimer = setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error("WS Error:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // Funciones REST helper
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      };
      const token = localStorage.getItem('session_token');
      if (token) {
        options.headers['x-session-token'] = token;
      }
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      if (res.status === 401) {
        localStorage.removeItem('session_token');
        localStorage.removeItem('user');
        window.location.reload();
        return null;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.detail && window.showToastCallback) {
          window.showToastCallback(errorData.detail);
        }
        throw new Error(`API Error: ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      console.error(`Error en ${endpoint}:`, e);
      return null;
    }
  };

  const fetchStatus = () => apiCall('/status').then(res => res && setStatus(res));
  const fetchNowPlaying = () => apiCall('/now').then(res => {
    if (res && res.playing) {
      setNowPlaying(res);
      setStatus(prev => ({ 
        ...prev, 
        paused: res.paused, 
        volume: res.volume, 
        repeat: res.repeat, 
        shuffle: res.shuffle 
      }));
    } else {
      setNowPlaying(null);
    }
  });
  const fetchQueue = () => apiCall('/queue').then(res => res && setQueue(res.queue || []));
  const fetchHistory = () => apiCall('/history').then(res => res && setHistory(res.history || []));
  const fetchActivity = () => apiCall('/activity').then(res => res && setActivityLog(res.activity || []));
  const fetchListeners = () => apiCall('/listeners').then(res => {
    if (res) {
      setListeners(res.listeners || []);
      setChannelName(res.channel_name || '');
    }
  });

  const play = (query, index = null, play_next = false) => apiCall('/play', 'POST', { query, index, play_next });
  const clearQueue = () => apiCall('/queue/clear', 'POST');
  const summon = () => apiCall('/summon', 'POST');
  const pause = () => apiCall('/pause', 'POST');
  const skip = () => apiCall('/skip', 'POST');
  const prev = () => apiCall('/prev', 'POST');
  const stop = () => apiCall('/stop', 'POST');
  const setVolume = (vol) => apiCall('/volume', 'POST', { volume: parseInt(vol) });
  const seek = (pos) => apiCall('/seek', 'POST', { position: parseInt(pos) });
  const search = async (q) => {
    const key = (q || '').trim().toLowerCase();
    if (!key) return { results: [] };
    const cached = searchCache.get(key);
    if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL_MS) {
      return cached.data;
    }
    const res = await apiCall(`/search?q=${encodeURIComponent(q)}`);
    if (res && res.results) {
      if (searchCache.size > 120) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
      }
      searchCache.set(key, { ts: Date.now(), data: res });
    }
    return res;
  };
  const remove = (index) => apiCall('/remove', 'POST', { index: parseInt(index) });
  const reorder = (from_index, to_index) => apiCall('/reorder', 'POST', { from_index: parseInt(from_index), to_index: parseInt(to_index) });
  const disconnect = () => apiCall('/disconnect', 'POST');
  const toggleShuffle = () => apiCall('/shuffle', 'POST').then(() => fetchStatus());
  const toggleRepeat = () => apiCall('/repeat', 'POST').then(() => fetchStatus());

  return {
    isConnected,
    status,
    nowPlaying,
    queue,
    history,
    activityLog,
    fetchActivity,
    progress,
    listeners,
    channelName,
    play,
    clearQueue,
    summon,
    pause,
    skip,
    prev,
    stop,
    setVolume,
    seek,
    search,
    remove,
    reorder,
    disconnect,
    toggleShuffle,
    toggleRepeat
  };
}
