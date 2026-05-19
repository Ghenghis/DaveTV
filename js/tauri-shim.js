/**
 * tauri-shim.js — Full drop-in replacement for Tauri v2 IPC.
 * Maps window.__TAURI_INTERNALS__.invoke() to Tizen/Web APIs.
 * Must be loaded BEFORE the React bundle (index-CXuONclM.js).
 */
(function (window) {
  'use strict';

  // ── Event bus ───────────────────────────────────────────────────────────
  var _listeners = {};

  function emitEvent(eventName, payload) {
    window.dispatchEvent(new CustomEvent('tauri:' + eventName, { detail: payload }));
  }

  function listenEvent(eventName, callback) {
    var handler = function (e) { callback(e.detail); };
    window.addEventListener('tauri:' + eventName, handler);
    _listeners[eventName] = _listeners[eventName] || [];
    _listeners[eventName].push(handler);
    // Return unlisten function (as Promise, matching Tauri API)
    return Promise.resolve(function () {
      window.removeEventListener('tauri:' + eventName, handler);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function noop() { return Promise.resolve(null); }
  function notImpl(cmd) {
    console.warn('[tauri-shim] Not implemented on Tizen:', cmd);
    return Promise.resolve(null);
  }

  // ── Import helpers ───────────────────────────────────────────────────────
  async function importM3uUrl(url) {
    var channels = await window.M3UParser.fetchAndParse(url);
    var id = window.Store.genId();
    await window.Store.savePlaylist({
      id: id,
      name: url.split('/').pop().split('?')[0] || 'M3U Playlist',
      type: 'm3u',
      source_url: url,
    });
    await window.Store.saveChannels(id, channels);
    return id;
  }

  async function importXtream({ url, username, password }) {
    var id = window.Store.genId();
    var auth = { url, username, password };
    window.XtreamClient.saveAuth(id, auth);
    await window.Store.savePlaylist({
      id: id,
      name: (new URL(url)).hostname + ' (Xtream)',
      type: 'xtream',
      source_url: url,
      username: username,
      password: password,
    });
    // Load live streams immediately
    try {
      var streams = await window.XtreamClient.getLiveStreams({ playlist_id: id });
      var channels = streams.map(function (s, i) {
        return {
          id: String(s.stream_id || i),
          name: s.name || 'Channel ' + i,
          url: window.XtreamClient.buildStreamUrl(auth, s.stream_id, 'ts'),
          logo: s.stream_icon || '',
          group: s.category_id || '',
          epg_id: s.epg_channel_id || '',
          sort_order: i,
        };
      });
      await window.Store.saveChannels(id, channels);
    } catch (e) {
      console.warn('[tauri-shim] xtream stream load failed:', e);
    }
    return id;
  }

  async function importXmltvEpg({ url, playlist_id }) {
    var result = await window.XmlTvParser.fetchAndParse(url);
    await window.Store.saveEpgPrograms(result.programs);
    // Store source reference
    var prefs = await window.Store.getPref('epg_sources', []);
    prefs.push({ url: url, playlist_id: playlist_id, channels: result.channels });
    await window.Store.setPref('epg_sources', prefs);
    return { program_count: result.programs.length };
  }

  // ── Main invoke() dispatcher ─────────────────────────────────────────────
  async function invoke(cmd, payload) {
    payload = payload || {};
    try {
      switch (cmd) {

        // ── Playlists ─────────────────────────────────────────────────────
        case 'list_playlists':
          return window.Store.getPlaylists();
        case 'list_playlist_summaries':
          return window.Store.getPlaylistSummaries();
        case 'import_m3u_url_playlist':
          return importM3uUrl(payload.url);
        case 'import_m3u_playlist':
          return notImpl(cmd);  // File access limited on TV
        case 'import_xtream_playlist':
          return importXtream(payload);
        case 'import_stalker_playlist':
          return notImpl(cmd);  // TODO: stalker portal
        case 'remove_playlist':
          return window.Store.removePlaylist(payload.playlist_id);
        case 'rename_playlist':
          return window.Store.renamePlaylist(payload.playlist_id, payload.name);
        case 'reorder_playlists':
          return noop();
        case 'refresh_playlist':
          return noop();
        case 'get_playlist_status':
          return { status: 'ok' };
        case 'get_playlist_m3u_url': {
          var p = await window.Store.getPlaylists();
          var pl = p.find(function (x) { return x.id === payload.playlist_id; });
          return pl ? pl.source_url : '';
        }
        case 'get_playlist_xtream_auth': {
          var raw = localStorage.getItem('xtream_auth_' + payload.playlist_id);
          return raw ? JSON.parse(raw) : {};
        }
        case 'get_playlist_stalker_auth':
          return {};
        case 'update_playlist_m3u_url':
        case 'set_playlist_m3u_url_source': {
          var plists = await window.Store.getPlaylists();
          var target = plists.find(function (x) { return x.id === payload.playlist_id; });
          if (target) { target.source_url = payload.url; await window.Store.savePlaylist(target); }
          return null;
        }
        case 'update_playlist_xtream_auth':
          window.XtreamClient.saveAuth(payload.playlist_id, {
            url: payload.url,
            username: payload.username,
            password: payload.password,
          });
          return null;
        case 'update_playlist_stalker_auth':
          return noop();

        // ── Channels ──────────────────────────────────────────────────────
        case 'load_channels':
          return window.Store.getChannels(payload.playlist_id);
        case 'get_favorite_channel_order':
          return window.Store.getPref('fav_order_' + payload.playlist_id, []);
        case 'set_favorite_channel_order':
          return window.Store.setPref('fav_order_' + payload.playlist_id, payload.order);

        // ── EPG ───────────────────────────────────────────────────────────
        case 'import_xmltv_epg':
          return importXmltvEpg(payload);
        case 'refresh_epg':
          return noop();
        case 'restore_epg_for_playlist':
          return noop();
        case 'clear_epg':
          return window.Store.clearEpg(payload.playlist_id);
        case 'get_epg_programs_window':
          return window.Store.getEpgProgramsWindow(payload);
        case 'get_epg_coverage':
          return { matched: 0, total: 0, coverage_pct: 0 };
        case 'get_epg_source_coverage':
          return { matched: 0, total: 0 };
        case 'get_epg_import_settings':
          return window.Store.getPref('epg_import_settings', {});
        case 'set_epg_import_settings':
          return window.Store.setPref('epg_import_settings', payload.settings);
        case 'set_channel_epg_mapping':
          return window.Store.setChannelEpgMapping(payload);
        case 'suggest_epg_channel_ids': {
          var epgSources = await window.Store.getPref('epg_sources', []);
          var allChannels = [];
          epgSources.forEach(function (s) { allChannels = allChannels.concat(s.channels || []); });
          return window.XmlTvParser.suggestEpgChannelIds(payload.channel_name, allChannels);
        }
        case 'list_xmltv_channels': {
          var src = await window.Store.getPref('epg_sources', []);
          var found = src.find(function (s) { return s.source_id === payload.source_id; });
          return found ? (found.channels || []) : [];
        }
        case 'epgshare_list_sources':
          return [];
        case 'prefetch_stalker_epg_channels':
        case 'prefetch_stalker_epg_block':
          return noop();

        // ── Playlist prefs ────────────────────────────────────────────────
        case 'get_playlist_prefs':
          return window.Store.getPref('playlist_prefs_' + payload.playlist_id, {});
        case 'set_playlist_prefs':
          return window.Store.setPref('playlist_prefs_' + payload.playlist_id, payload.prefs);

        // ── Diagnostics ───────────────────────────────────────────────────
        case 'get_playlist_diagnostics':
        case 'get_playlist_diagnostics_text':
          return [];
        case 'record_playlist_diagnostic':
        case 'clear_playlist_diagnostics':
        case 'app_diagnostic_player_error':
          return noop();
        case 'cancel_playlist_import':
          return noop();

        // ── Player ────────────────────────────────────────────────────────
        case 'play_url':
          return window.PlayerShim.play(payload.url, payload);
        case 'close_player':
          return window.PlayerShim.stop();
        case 'get_player_state':
          return window.PlayerShim.getPlayerState();
        case 'set_player_last_error':
        case 'clear_player_last_error':
          return noop();

        // ── VOD player ────────────────────────────────────────────────────
        case 'vod_create':
        case 'vod_play':
          return window.PlayerShim.play(payload.url, payload);
        case 'vod_destroy':
        case 'vod_stop':
          return window.PlayerShim.stop();
        case 'vod_toggle_pause':
          return window.PlayerShim.togglePause();
        case 'vod_resume':
          return window.PlayerShim.togglePause();
        case 'vod_seek':
          return window.PlayerShim.seek(payload.time);
        case 'vod_is_playing':
          return window.PlayerShim.isPlaying();
        case 'vod_get_time':
          return window.PlayerShim.getTime();
        case 'vod_get_stats':
          return { state: window.PlayerShim.getState() };
        case 'vod_get_volume':
          return window.PlayerShim.getVolume();
        case 'vod_set_volume':
          return window.PlayerShim.setVolume(payload.volume);
        case 'vod_get_mute':
          return window.PlayerShim.getMute();
        case 'vod_set_mute':
          return window.PlayerShim.setMute(payload.muted);
        case 'vod_set_bounds':
        case 'vod_set_http_user_agent':
        case 'vod_set_http_overrides':
        case 'vod_set_debug_logging':
        case 'vod_clear_debug_log':
        case 'vod_get_debug_log_path':
        case 'vod_read_debug_log':
          return noop();

        // ── VOD downloads ─────────────────────────────────────────────────
        case 'vod_download_list':
          return [];
        case 'vod_download_start':
        case 'vod_download_pause':
        case 'vod_download_resume':
        case 'vod_download_cancel':
        case 'vod_download_retry':
        case 'vod_download_delete':
        case 'vod_download_probe_size':
        case 'vod_download_get_settings':
        case 'vod_download_set_settings':
          return notImpl(cmd);  // TV storage limited

        // ── Xtream movies ─────────────────────────────────────────────────
        case 'xtream_get_movie_categories':
          return window.XtreamClient.getMovieCategories(payload.playlist_id);
        case 'xtream_list_movies':
          return window.XtreamClient.listMovies(payload);
        case 'xtream_get_movie_details':
          return window.XtreamClient.getMovieDetails(payload);
        case 'xtream_get_movie_match_catalog':
          return [];

        // ── Xtream series ─────────────────────────────────────────────────
        case 'xtream_get_series_categories':
          return window.XtreamClient.getSeriesCategories(payload.playlist_id);
        case 'xtream_list_series':
          return window.XtreamClient.listSeries(payload);
        case 'xtream_get_series_details':
          return window.XtreamClient.getSeriesDetails(payload);
        case 'xtream_get_series_match_catalog':
          return [];

        // ── Watch state ───────────────────────────────────────────────────
        case 'get_watched_movies':
          return window.Store.getWatchedMovies(payload.playlist_id);
        case 'mark_movie_watched':
          return window.Store.markMovieWatched(payload);
        case 'mark_movies_watched_bulk':
          return Promise.all((payload.movie_ids || []).map(function (id) {
            return window.Store.markMovieWatched({ movie_id: id, playlist_id: payload.playlist_id });
          }));
        case 'unmark_movies_watched_bulk':
          return noop();
        case 'toggle_movie_favorite':
          return window.Store.toggleMovieFavorite(payload);
        case 'upsert_continue_watching_movie':
          return window.Store.upsertContinueWatching(payload);
        case 'remove_continue_watching_movie':
          return window.Store.removeContinueWatching(payload);
        case 'mark_episode_viewed':
          return window.Store.markEpisodeViewed(payload);
        case 'mark_episodes_viewed_bulk':
          return window.Store.markEpisodesViewedBulk(payload);
        case 'unmark_episodes_viewed_bulk':
          return noop();
        case 'toggle_series_favorite':
          return window.Store.toggleSeriesFavorite(payload);

        // ── Catchup ───────────────────────────────────────────────────────
        case 'get_catchup_programs':
          return [];

        // ── Recordings ───────────────────────────────────────────────────
        case 'get_recording_settings':
          return window.Store.getPref('recording_settings', {});
        case 'set_recording_settings':
          return window.Store.setPref('recording_settings', payload.settings);
        case 'recording_poster_download':
        case 'recording_poster_delete':
          return noop();

        // ── Settings ──────────────────────────────────────────────────────
        case 'get_socks5_proxy_settings':
          return window.Store.getPref('socks5_settings', { enabled: false });
        case 'set_socks5_proxy_settings':
          return window.Store.setPref('socks5_settings', payload.settings);
        case 'get_mpv_video_settings':
        case 'get_mpv_detached_window_settings':
        case 'get_vlc_playback_settings':
        case 'get_vlc_detached_window_settings':
        case 'get_mac_live_subtitle_settings':
          return window.Store.getPref(cmd, {});
        case 'set_mpv_video_settings':
        case 'set_mpv_detached_window_settings':
        case 'set_vlc_playback_settings':
        case 'set_vlc_detached_window_settings':
        case 'set_mac_live_subtitle_settings':
          return window.Store.setPref(cmd.replace('set_', 'get_'), payload.settings || payload);
        case 'set_fullscreen':
          if (payload.fullscreen && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
          } else if (!payload.fullscreen && document.exitFullscreen) {
            document.exitFullscreen();
          }
          return null;
        case 'set_preview_bounds':
          return noop();

        // ── Multiview ─────────────────────────────────────────────────────
        case 'multiview_play_url':
          return window.PlayerShim.play(payload.url, payload);
        case 'multiview_close':
        case 'multiview_close_all':
          return window.PlayerShim.stop();
        case 'multiview_pause':
        case 'multiview_resume':
        case 'multiview_get_state':
        case 'multiview_set_bounds':
        case 'multiview_set_volume':
        case 'multiview_set_mute':
        case 'multiview_set_visible':
        case 'multiview_toggle_stats':
          return noop();

        // ── Google Cast ───────────────────────────────────────────────────
        case 'google_cast_get_transcode_settings':
          return window.Store.getPref('cast_settings', {});
        case 'google_cast_set_transcode_settings':
          return window.Store.setPref('cast_settings', payload.settings);

        // ── OpenSubtitles ─────────────────────────────────────────────────
        case 'opensubtitles_search':
        case 'opensubtitles_download_and_load':
          return notImpl(cmd);

        // ── Licensing (permissive on TV) ───────────────────────────────────
        case 'load_recovery_token':
          localStorage.setItem('license_token', payload.token);
          setTimeout(function () {
            emitEvent('licensing_channel', { status: 'licensed', plan: 'davetv' });
          }, 100);
          return true;
        case 'load_refresh_token':
          return noop();
        case 'clear_vod_cache':
          return noop();

        // ── Tauri plugin: window ───────────────────────────────────────────
        case 'plugin:window|get_all_windows':
          return [window.__TAURI_INTERNALS__.metadata.currentWindow.label];
        case 'plugin:window|create':
          return null;
        case 'plugin:image|new':
        case 'plugin:image|from_path':
        case 'plugin:image|from_bytes':
        case 'plugin:image|rgba':
        case 'plugin:image|size':
          return null;
        case 'plugin:path|resolve_directory':
          return '/';

        default:
          console.warn('[tauri-shim] Unhandled command:', cmd, payload);
          return null;
      }
    } catch (err) {
      console.error('[tauri-shim] Error in command', cmd, ':', err);
      throw err;
    }
  }

  // ── Bootstrap __TAURI_INTERNALS__ ─────────────────────────────────────────
  if (!window.__TAURI_INTERNALS__) {
    window.__TAURI_INTERNALS__ = { plugins: {} };
  }

  window.__TAURI_INTERNALS__.invoke = invoke;
  window.__TAURI_INTERNALS__.listen = listenEvent;
  window.__TAURI_INTERNALS__.emit  = emitEvent;

  // Metadata that the Tauri window API reads
  window.__TAURI_INTERNALS__.metadata = {
    currentWindow: { label: 'main' },
    currentWebview: { label: 'main', windowLabel: 'main' },
  };

  // Mark as Tauri environment (some code checks this)
  window.isTauri = true;

  // DaveTV branding globals
  window.DAVETV_APP = true;
  window.DAVETV_VERSION = '1.0.0';

  // Expose helper globally for shim modules
  window.__tauriEmit = emitEvent;

  // Emit initial license state (TV: treat as licensed)
  window.addEventListener('load', function () {
    setTimeout(function () {
      emitEvent('licensing_channel', { status: 'licensed', plan: 'davetv', trial_days: 0 });
    }, 500);
  });

}(window));
