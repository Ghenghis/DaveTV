/**
 * remote-keys.js — Samsung Smart TV remote control handler.
 * Maps hardware key codes to app actions and dispatches TV key events.
 */
(function (window) {
  'use strict';

  // Register media keys with Tizen input device API (required for some keys)
  function registerTizenKeys() {
    if (typeof tizen === 'undefined' || !tizen.tvinputdevice) return;
    try {
      tizen.tvinputdevice.registerKeyBatch([
        'MediaPlayPause',
        'MediaStop',
        'MediaFastForward',
        'MediaRewind',
        'MediaPlay',
        'MediaPause',
        'MediaTrackPrevious',
        'MediaTrackNext',
        'Back',
        'Menu',
        'ChannelUp',
        'ChannelDown',
        'VolumeUp',
        'VolumeDown',
        'VolumeMute',
        'ColorF0Red',
        'ColorF1Green',
        'ColorF2Yellow',
        'ColorF3Blue',
        'Info',
        'Exit',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      ]);
    } catch (e) {
      console.warn('[RemoteKeys] registerKeyBatch failed:', e);
    }
  }

  // Samsung Tizen key code map
  var KEY_MAP = {
    37:    'ArrowLeft',
    38:    'ArrowUp',
    39:    'ArrowRight',
    40:    'ArrowDown',
    13:    'Enter',
    10009: 'Back',
    10182: 'Exit',
    10135: 'Menu',
    10252: 'MediaPlayPause',
    415:   'MediaPlay',
    19:    'MediaPause',
    413:   'MediaStop',
    417:   'MediaFastForward',
    412:   'MediaRewind',
    427:   'ChannelUp',
    428:   'ChannelDown',
    447:   'ColorRed',
    448:   'ColorGreen',
    449:   'ColorYellow',
    450:   'ColorBlue',
    457:   'Info',
    // Number keys
    48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
    53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
  };

  function dispatchTvKey(keyCode, keyName) {
    window.dispatchEvent(new CustomEvent('tv-key', {
      detail: { keyCode: keyCode, key: keyName },
      bubbles: true,
    }));
  }

  document.addEventListener('keydown', function (e) {
    var keyName = KEY_MAP[e.keyCode];
    if (!keyName) return;

    // Prevent browser default (scroll, back navigation etc.)
    e.preventDefault();
    e.stopPropagation();

    // Handle Back key: close modals or exit
    if (keyName === 'Back') {
      dispatchTvKey(e.keyCode, keyName);
      return;
    }

    // Handle Exit key
    if (keyName === 'Exit') {
      if (typeof tizen !== 'undefined') {
        try { tizen.application.getCurrentApplication().exit(); } catch (ex) { /* ignore */ }
      }
      return;
    }

    dispatchTvKey(e.keyCode, keyName);
  });

  // Spatial navigation helper — maps arrow keys to focus movement
  document.addEventListener('tv-key', function (e) {
    var key = e.detail.key;
    var focused = document.activeElement;

    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
      // Attempt to move focus to next focusable element in direction
      var focusables = Array.from(document.querySelectorAll(
        'button, [role="button"], input, select, a[href], [tabindex]:not([tabindex="-1"])'
      )).filter(function (el) {
        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (!focused || focused === document.body) {
        if (focusables.length > 0) focusables[0].focus();
        return;
      }

      var currentRect = focused.getBoundingClientRect();
      var cx = currentRect.left + currentRect.width / 2;
      var cy = currentRect.top + currentRect.height / 2;

      var best = null;
      var bestScore = Infinity;

      focusables.forEach(function (el) {
        if (el === focused) return;
        var r = el.getBoundingClientRect();
        var ex = r.left + r.width / 2;
        var ey = r.top + r.height / 2;

        var dx = ex - cx;
        var dy = ey - cy;
        var inDirection = false;

        if (key === 'ArrowLeft'  && dx < -10) inDirection = true;
        if (key === 'ArrowRight' && dx >  10) inDirection = true;
        if (key === 'ArrowUp'    && dy < -10) inDirection = true;
        if (key === 'ArrowDown'  && dy >  10) inDirection = true;

        if (!inDirection) return;

        // Score: distance weighted by axis alignment
        var primary = key === 'ArrowLeft' || key === 'ArrowRight' ? Math.abs(dx) : Math.abs(dy);
        var secondary = key === 'ArrowLeft' || key === 'ArrowRight' ? Math.abs(dy) : Math.abs(dx);
        var score = primary + secondary * 3;

        if (score < bestScore) { bestScore = score; best = el; }
      });

      if (best) best.focus();
    }

    if (key === 'Enter' && focused && focused !== document.body) {
      focused.click();
    }
  });

  registerTizenKeys();

  window.RemoteKeys = { KEY_MAP: KEY_MAP };

}(window));
