/**
 * player-shim.js — AVPlay wrapper replacing mpv + Tauri player commands.
 * Samsung Tizen AVPlay API: https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html
 */
(function (window) {
  'use strict';

  var _state = 'stopped';   // stopped | buffering | playing | paused
  var _currentUrl = null;
  var _duration = 0;
  var _positionTimer = null;
  var _muted = false;
  var _volume = 1.0;        // 0.0 – 1.0
  var _avplay = null;       // webapis.avplay handle

  function getAvPlay() {
    if (typeof webapis !== 'undefined' && webapis.avplay) return webapis.avplay;
    return null;
  }

  function emit(event, payload) {
    window.dispatchEvent(new CustomEvent('tauri:' + event, { detail: payload }));
  }

  function startPositionTimer() {
    if (_positionTimer) return;
    _positionTimer = setInterval(function () {
      var av = getAvPlay();
      if (!av || _state !== 'playing') return;
      try {
        var time = av.getCurrentTime();
        emit('player_overlay', { time: time / 1000, duration: _duration });
      } catch (e) { /* ignore */ }
    }, 1000);
  }

  function stopPositionTimer() {
    if (_positionTimer) { clearInterval(_positionTimer); _positionTimer = null; }
  }

  var PlayerShim = {

    play: function (url, options) {
      options = options || {};
      return new Promise(function (resolve, reject) {
        var av = getAvPlay();
        if (!av) {
          console.warn('[PlayerShim] AVPlay not available — running in browser preview mode');
          _state = 'playing';
          _currentUrl = url;
          emit('native_player_state', { state: 'playing' });
          resolve();
          return;
        }

        try {
          // Stop any existing playback
          if (_state !== 'stopped') {
            try { av.stop(); av.close(); } catch (e) { /* ignore */ }
          }

          av.open(url);
          _currentUrl = url;

          // Apply HTTP headers / user agent before prepare
          if (options.user_agent) {
            av.setStreamingProperty('USER_AGENT', options.user_agent);
          }
          if (options.headers) {
            var hdrStr = Object.keys(options.headers)
              .map(function (k) { return k + ':' + options.headers[k]; })
              .join('|');
            av.setStreamingProperty('CUSTOM_MESSAGE', hdrStr);
          }

          // Set listener
          av.setListener({
            onbufferingstart: function () {
              _state = 'buffering';
              emit('native_player_state', { state: 'buffering' });
            },
            onbufferingprogress: function (percent) {
              emit('player_overlay', { buffering: percent });
            },
            onbufferingcomplete: function () {
              _state = 'playing';
              emit('native_player_state', { state: 'playing' });
              startPositionTimer();
            },
            oncurrentplaytime: function (time) {
              emit('player_overlay', { time: time / 1000, duration: _duration });
            },
            onstreamcompleted: function () {
              _state = 'stopped';
              stopPositionTimer();
              emit('native_player_state', { state: 'stopped' });
            },
            ondurationchange: function (duration) {
              _duration = duration / 1000;
            },
            onerrorevent: function (err) {
              _state = 'stopped';
              stopPositionTimer();
              emit('player_error', { message: String(err), stage: 'avplay' });
              emit('native_player_state', { state: 'error' });
            },
            onsubtitlechange: function (dur, text) {
              emit('player_overlay', { subtitle: text });
            },
          });

          av.prepare();
          av.play();
          _state = 'playing';
          startPositionTimer();
          resolve();

        } catch (e) {
          console.error('[PlayerShim] play error:', e);
          emit('player_error', { message: e.message, stage: 'open' });
          reject(e);
        }
      });
    },

    stop: function () {
      stopPositionTimer();
      var av = getAvPlay();
      if (av) {
        try { av.stop(); } catch (e) { /* ignore */ }
        try { av.close(); } catch (e) { /* ignore */ }
      }
      _state = 'stopped';
      _currentUrl = null;
      emit('native_player_state', { state: 'stopped' });
    },

    togglePause: function () {
      var av = getAvPlay();
      if (_state === 'playing') {
        if (av) { try { av.pause(); } catch (e) { /* ignore */ } }
        _state = 'paused';
        stopPositionTimer();
        emit('native_player_state', { state: 'paused' });
      } else if (_state === 'paused') {
        if (av) { try { av.play(); } catch (e) { /* ignore */ } }
        _state = 'playing';
        startPositionTimer();
        emit('native_player_state', { state: 'playing' });
      }
    },

    seek: function (timeSecs) {
      var av = getAvPlay();
      if (av) {
        try { av.seekTo(Math.round(timeSecs * 1000)); } catch (e) { /* ignore */ }
      }
    },

    getTime: function () {
      var av = getAvPlay();
      if (av) { try { return av.getCurrentTime() / 1000; } catch (e) { return 0; } }
      return 0;
    },

    getDuration: function () { return _duration; },
    getState: function () { return _state; },
    isPlaying: function () { return _state === 'playing'; },

    setVolume: function (vol) {
      // vol: 0.0 – 1.0
      _volume = Math.max(0, Math.min(1, vol));
      // Tizen: volume is system-level (0–100)
      if (typeof tizen !== 'undefined' && tizen.tvaudiocontrol) {
        try {
          var sysVol = Math.round(_volume * 100);
          tizen.tvaudiocontrol.setVolume(sysVol);
        } catch (e) { /* ignore */ }
      }
    },

    getVolume: function () { return _volume; },

    setMute: function (muted) {
      _muted = muted;
      if (typeof tizen !== 'undefined' && tizen.tvaudiocontrol) {
        try { tizen.tvaudiocontrol.setMute(muted); } catch (e) { /* ignore */ }
      }
    },

    getMute: function () { return _muted; },

    getPlayerState: function () {
      return {
        state: _state,
        url: _currentUrl,
        time: PlayerShim.getTime(),
        duration: _duration,
        muted: _muted,
        volume: _volume,
      };
    },
  };

  window.PlayerShim = PlayerShim;

}(window));
