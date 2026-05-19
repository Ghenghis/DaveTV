/**
 * store.js — IndexedDB persistence layer
 * Replaces SQLite (sqlx) from the Rust backend.
 */
(function (window) {
  'use strict';

  const DB_NAME = 'davetv';
  const DB_VERSION = 1;

  let _db = null;

  function openDb() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('channels')) {
          const cs = db.createObjectStore('channels', { keyPath: 'id' });
          cs.createIndex('playlist_id', 'playlist_id', { unique: false });
        }
        if (!db.objectStoreNames.contains('epg_programs')) {
          const es = db.createObjectStore('epg_programs', { keyPath: 'id' });
          es.createIndex('channel_id', 'channel_id', { unique: false });
          es.createIndex('start', 'start', { unique: false });
        }
        if (!db.objectStoreNames.contains('watched_movies')) {
          db.createObjectStore('watched_movies', { keyPath: ['movie_id', 'playlist_id'] });
        }
        if (!db.objectStoreNames.contains('watched_episodes')) {
          db.createObjectStore('watched_episodes', { keyPath: ['episode_id', 'playlist_id'] });
        }
        if (!db.objectStoreNames.contains('vod_downloads')) {
          db.createObjectStore('vod_downloads', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prefs')) {
          db.createObjectStore('prefs', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('epg_mappings')) {
          db.createObjectStore('epg_mappings', { keyPath: 'channel_id' });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: ['item_id', 'type', 'playlist_id'] });
        }
      };
      req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
      req.onerror = function (e) { reject(e.target.error); };
    });
  }

  function tx(storeName, mode) {
    return openDb().then(db => {
      const t = db.transaction(storeName, mode);
      return t.objectStore(storeName);
    });
  }

  function storeGet(storeName, key) {
    return tx(storeName, 'readonly').then(s => promReq(s.get(key)));
  }
  function storeGetAll(storeName) {
    return tx(storeName, 'readonly').then(s => promReq(s.getAll()));
  }
  function storePut(storeName, value) {
    return tx(storeName, 'readwrite').then(s => promReq(s.put(value)));
  }
  function storeDelete(storeName, key) {
    return tx(storeName, 'readwrite').then(s => promReq(s.delete(key)));
  }
  function storeGetByIndex(storeName, indexName, value) {
    return tx(storeName, 'readonly').then(s => promReq(s.index(indexName).getAll(value)));
  }
  function promReq(req) {
    return new Promise((res, rej) => {
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ── Playlists ─────────────────────────────────────────────────────────────
  async function getPlaylists() {
    return storeGetAll('playlists');
  }

  async function getPlaylistSummaries() {
    const playlists = await getPlaylists();
    return Promise.all(playlists.map(async p => {
      const channels = await storeGetByIndex('channels', 'playlist_id', p.id);
      return { ...p, channel_count: channels.length };
    }));
  }

  async function savePlaylist(playlist) {
    if (!playlist.id) playlist.id = genId();
    playlist.created_at = playlist.created_at || Date.now();
    playlist.updated_at = Date.now();
    await storePut('playlists', playlist);
    return playlist.id;
  }

  async function removePlaylist(playlistId) {
    await storeDelete('playlists', playlistId);
    // Remove associated channels
    const channels = await storeGetByIndex('channels', 'playlist_id', playlistId);
    await tx('channels', 'readwrite').then(s => {
      channels.forEach(c => s.delete(c.id));
    });
  }

  async function renamePlaylist(playlistId, name) {
    const p = await storeGet('playlists', playlistId);
    if (p) { p.name = name; p.updated_at = Date.now(); await storePut('playlists', p); }
  }

  // ── Channels ──────────────────────────────────────────────────────────────
  async function saveChannels(playlistId, channels) {
    const store = await tx('channels', 'readwrite');
    // Clear existing for this playlist
    const existing = await storeGetByIndex('channels', 'playlist_id', playlistId);
    for (const c of existing) store.delete(c.id);
    // Insert new
    let order = 0;
    for (const ch of channels) {
      ch.playlist_id = playlistId;
      ch.id = ch.id || (playlistId + '_' + order);
      ch.sort_order = order++;
      store.put(ch);
    }
    return channels.length;
  }

  async function getChannels(playlistId) {
    const channels = await storeGetByIndex('channels', 'playlist_id', playlistId);
    return channels.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  // ── EPG ───────────────────────────────────────────────────────────────────
  async function saveEpgPrograms(programs) {
    const store = await tx('epg_programs', 'readwrite');
    for (const p of programs) {
      p.id = p.id || (p.channel_id + '_' + p.start);
      store.put(p);
    }
  }

  async function getEpgProgramsWindow({ channel_ids, start, end }) {
    const result = [];
    for (const cid of channel_ids) {
      const programs = await storeGetByIndex('epg_programs', 'channel_id', cid);
      const filtered = programs.filter(p => p.end > start && p.start < end);
      result.push(...filtered);
    }
    return result;
  }

  async function clearEpg(playlistId) {
    const channels = await getChannels(playlistId);
    const cids = new Set(channels.map(c => c.id));
    const all = await storeGetAll('epg_programs');
    const store = await tx('epg_programs', 'readwrite');
    all.filter(p => cids.has(p.channel_id)).forEach(p => store.delete(p.id));
  }

  // ── Prefs ─────────────────────────────────────────────────────────────────
  async function getPref(key, defaultVal = null) {
    const row = await storeGet('prefs', key);
    if (!row) return defaultVal;
    try { return JSON.parse(row.value); } catch { return row.value; }
  }

  async function setPref(key, value) {
    await storePut('prefs', { key, value: JSON.stringify(value) });
  }

  // ── Watch state ───────────────────────────────────────────────────────────
  async function getWatchedMovies(playlistId) {
    const all = await storeGetAll('watched_movies');
    return all.filter(m => m.playlist_id === playlistId);
  }

  async function markMovieWatched({ movie_id, playlist_id }) {
    await storePut('watched_movies', { movie_id, playlist_id, watched: true, updated_at: Date.now() });
  }

  async function upsertContinueWatching({ movie_id, playlist_id, time }) {
    const existing = await storeGet('watched_movies', [movie_id, playlist_id]) || {};
    await storePut('watched_movies', { ...existing, movie_id, playlist_id, position: time, updated_at: Date.now() });
  }

  async function removeContinueWatching({ movie_id, playlist_id }) {
    const existing = await storeGet('watched_movies', [movie_id, playlist_id]);
    if (existing) { existing.position = 0; await storePut('watched_movies', existing); }
  }

  async function toggleMovieFavorite({ movie_id, playlist_id }) {
    const key = [movie_id, 'movie', playlist_id];
    const existing = await storeGet('favorites', key);
    if (existing) {
      await storeDelete('favorites', key);
    } else {
      await storePut('favorites', { item_id: movie_id, type: 'movie', playlist_id, added_at: Date.now() });
    }
  }

  async function markEpisodeViewed({ episode_id, series_id, playlist_id }) {
    await storePut('watched_episodes', { episode_id, series_id, playlist_id, viewed: true, updated_at: Date.now() });
  }

  async function markEpisodesViewedBulk({ episode_ids, playlist_id }) {
    const store = await tx('watched_episodes', 'readwrite');
    episode_ids.forEach(eid => {
      store.put({ episode_id: eid, playlist_id, viewed: true, updated_at: Date.now() });
    });
  }

  async function toggleSeriesFavorite({ series_id, playlist_id }) {
    const key = [series_id, 'series', playlist_id];
    const existing = await storeGet('favorites', key);
    if (existing) {
      await storeDelete('favorites', key);
    } else {
      await storePut('favorites', { item_id: series_id, type: 'series', playlist_id, added_at: Date.now() });
    }
  }

  // ── EPG Mappings ──────────────────────────────────────────────────────────
  async function setChannelEpgMapping({ channel_id, epg_id }) {
    await storePut('epg_mappings', { channel_id, epg_id });
  }

  async function getChannelEpgMapping(channel_id) {
    return storeGet('epg_mappings', channel_id);
  }

  // ── Exports ───────────────────────────────────────────────────────────────
  window.Store = {
    openDb,
    getPlaylists,
    getPlaylistSummaries,
    savePlaylist,
    removePlaylist,
    renamePlaylist,
    saveChannels,
    getChannels,
    saveEpgPrograms,
    getEpgProgramsWindow,
    clearEpg,
    getPref,
    setPref,
    getWatchedMovies,
    markMovieWatched,
    upsertContinueWatching,
    removeContinueWatching,
    toggleMovieFavorite,
    markEpisodeViewed,
    markEpisodesViewedBulk,
    toggleSeriesFavorite,
    setChannelEpgMapping,
    getChannelEpgMapping,
    genId,
  };

}(window));
