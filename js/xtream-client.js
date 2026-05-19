/**
 * xtream-client.js — Xtream Codes API client (replaces Rust xtream commands).
 * Uses the standard Xtream Codes API v2.
 */
(function (window) {
  'use strict';

  function getXtreamAuth(playlistId) {
    var raw = localStorage.getItem('xtream_auth_' + playlistId);
    return raw ? JSON.parse(raw) : null;
  }

  function buildUrl(auth, action, extra) {
    extra = extra || {};
    var params = new URLSearchParams(Object.assign({
      username: auth.username,
      password: auth.password,
      action: action,
    }, extra));
    var base = auth.url.replace(/\/$/, '');
    return base + '/player_api.php?' + params.toString();
  }

  async function apiFetch(url) {
    var resp = await fetch(url);
    if (!resp.ok) throw new Error('Xtream API error: HTTP ' + resp.status);
    return resp.json();
  }

  var XtreamClient = {
    saveAuth: function (playlistId, auth) {
      localStorage.setItem('xtream_auth_' + playlistId, JSON.stringify(auth));
    },

    getMovieCategories: async function (playlistId) {
      var auth = getXtreamAuth(playlistId);
      if (!auth) return [];
      return apiFetch(buildUrl(auth, 'get_vod_categories'));
    },

    listMovies: async function ({ playlist_id, category_id }) {
      var auth = getXtreamAuth(playlist_id);
      if (!auth) return [];
      var extra = category_id ? { category_id: category_id } : {};
      return apiFetch(buildUrl(auth, 'get_vod_streams', extra));
    },

    getMovieDetails: async function ({ playlist_id, movie_id }) {
      var auth = getXtreamAuth(playlist_id);
      if (!auth) return null;
      return apiFetch(buildUrl(auth, 'get_vod_info', { vod_id: movie_id }));
    },

    getSeriesCategories: async function (playlistId) {
      var auth = getXtreamAuth(playlistId);
      if (!auth) return [];
      return apiFetch(buildUrl(auth, 'get_series_categories'));
    },

    listSeries: async function ({ playlist_id, category_id }) {
      var auth = getXtreamAuth(playlist_id);
      if (!auth) return [];
      var extra = category_id ? { category_id: category_id } : {};
      return apiFetch(buildUrl(auth, 'get_series', extra));
    },

    getSeriesDetails: async function ({ playlist_id, series_id }) {
      var auth = getXtreamAuth(playlist_id);
      if (!auth) return null;
      return apiFetch(buildUrl(auth, 'get_series_info', { series_id: series_id }));
    },

    getLiveCategories: async function (playlistId) {
      var auth = getXtreamAuth(playlistId);
      if (!auth) return [];
      return apiFetch(buildUrl(auth, 'get_live_categories'));
    },

    getLiveStreams: async function ({ playlist_id, category_id }) {
      var auth = getXtreamAuth(playlist_id);
      if (!auth) return [];
      var extra = category_id ? { category_id: category_id } : {};
      return apiFetch(buildUrl(auth, 'get_live_streams', extra));
    },

    buildStreamUrl: function (auth, streamId, ext) {
      ext = ext || 'ts';
      var base = auth.url.replace(/\/$/, '');
      return base + '/live/' + auth.username + '/' + auth.password + '/' + streamId + '.' + ext;
    },

    buildVodUrl: function (auth, streamId, ext) {
      ext = ext || 'mp4';
      var base = auth.url.replace(/\/$/, '');
      return base + '/movie/' + auth.username + '/' + auth.password + '/' + streamId + '.' + ext;
    },
  };

  window.XtreamClient = XtreamClient;

}(window));
