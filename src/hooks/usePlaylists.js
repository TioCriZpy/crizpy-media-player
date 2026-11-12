import { useState, useCallback } from 'react';

const API_BASE = '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState({});
  const [playlistDurations, setPlaylistDurations] = useState({});
  const [currentPlaylist, setCurrentPlaylist] = useState(null);

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

  const fetchPlaylists = useCallback(async () => {
    const res = await apiCall('/playlists');
    if (res && res.playlists) {
      setPlaylists(res.playlists);
      setPlaylistDurations(res.durations || {});
    }
  }, []);

  const fetchPlaylist = async (name) => {
    const res = await apiCall(`/playlists/${encodeURIComponent(name)}`);
    if (res) {
      setCurrentPlaylist(res);
      return res;
    }
    return null;
  };

  const createPlaylist = async (name) => {
    const res = await apiCall('/playlists/create', 'POST', { name });
    if (res && res.created) {
      await fetchPlaylists();
      return true;
    }
    return false;
  };

  const addToPlaylist = async (playlistName, track) => {
    const res = await apiCall('/playlists/add', 'POST', { playlist_name: playlistName, track });
    if (res && res.added) {
      await fetchPlaylists();
      if (currentPlaylist && currentPlaylist.name === playlistName) {
        await fetchPlaylist(playlistName);
      }
      return true;
    }
    return false;
  };

  const removeFromPlaylist = async (playlistName, trackUri) => {
    const res = await apiCall('/playlists/remove', 'POST', { playlist_name: playlistName, track_uri: trackUri });
    if (res && res.removed) {
      await fetchPlaylists();
      if (currentPlaylist && currentPlaylist.name === playlistName) {
        await fetchPlaylist(playlistName);
      }
      return true;
    }
    return false;
  };

  const loadPlaylist = async (name, shuffle = false) => {
    const res = await apiCall('/playlists/load', 'POST', { playlist_name: name, shuffle });
    return res;
  };

  const renamePlaylist = async (oldName, newName) => {
    const res = await apiCall('/playlists/rename', 'POST', { old_name: oldName, new_name: newName });
    if (res && res.renamed) {
      await fetchPlaylists();
      if (currentPlaylist && currentPlaylist.name === oldName) {
        await fetchPlaylist(res.renamed);
      }
      return res;
    }
    return null;
  };

  
  const reorderPlaylist = async (playlistName, fromIndex, toIndex) => {
    const res = await apiCall('/playlists/reorder', 'POST', { playlist_name: playlistName, from_index: fromIndex, to_index: toIndex });
    if (res && res.reordered) {
      await fetchPlaylists();
      if (currentPlaylist && currentPlaylist.name === playlistName) {
        await fetchPlaylist(playlistName);
      }
      return true;
    }
    return false;
  };

  const deletePlaylist = async (name) => {
    const res = await apiCall(`/playlists/${encodeURIComponent(name)}`, 'DELETE');
    if (res && res.deleted) {
      await fetchPlaylists();
      if (currentPlaylist && currentPlaylist.name === name) {
        setCurrentPlaylist(null);
      }
      return true;
    }
    return false;
  };

  const saveQueueAsPlaylist = async (name, includeCurrent = true) => {
    const res = await apiCall('/playlists/save_queue', 'POST', { name, include_current: includeCurrent });
    if (res && res.saved) {
      await fetchPlaylists();
      return res;
    }
    return null;
  };

  const importYoutubePlaylist = async (url, name = null) => {
    const res = await apiCall('/playlists/import_yt', 'POST', { url, name });
    if (res && res.imported) {
      await fetchPlaylists();
      return res;
    }
    return null;
  };

  return {
    playlists,
    playlistDurations,
    currentPlaylist,
    fetchPlaylists,
    fetchPlaylist,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    loadPlaylist,
    renamePlaylist,
    deletePlaylist,
    reorderPlaylist,
    saveQueueAsPlaylist,
    importYoutubePlaylist,
    setCurrentPlaylist
  };
}
