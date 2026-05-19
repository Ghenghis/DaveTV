/**
 * m3u-parser.js — M3U / M3U8 playlist parser (replaces m3u.rs).
 * Handles both simple (#EXTM3U) and extended M3U with #EXTINF tags.
 */
(function (window) {
  'use strict';

  function parseM3U(text) {
    var channels = [];
    var lines = text.split(/\r?\n/);
    var pending = null;
    var sortOrder = 0;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line === '#EXTM3U') continue;

      if (line.startsWith('#EXTINF:')) {
        pending = parseExtInf(line);
        pending.sort_order = sortOrder++;
      } else if (!line.startsWith('#')) {
        // This is a URL line
        if (pending) {
          pending.url = line;
          pending.id = pending.id || (line.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40) + '_' + sortOrder);
          channels.push(pending);
          pending = null;
        } else {
          // Plain URL without EXTINF
          channels.push({
            id: 'ch_' + sortOrder,
            name: line.split('/').pop().split('?')[0] || 'Channel ' + sortOrder,
            url: line,
            group: '',
            logo: '',
            epg_id: '',
            sort_order: sortOrder++,
          });
        }
      }
    }

    return channels;
  }

  function parseExtInf(line) {
    // #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",Channel Name
    var channel = { name: '', logo: '', group: '', epg_id: '', url: '' };

    // Extract attributes
    var attrSection = line.replace(/^#EXTINF:[^,]*/, '').split(',')[0];
    var nameSection = line.split(',').slice(1).join(',').trim();

    // Parse key="value" pairs
    var attrRe = /(\w[\w-]*)="([^"]*)"/g;
    var match;
    var extinfPart = line.slice(0, line.indexOf(',') === -1 ? line.length : line.indexOf(','));
    while ((match = attrRe.exec(extinfPart)) !== null) {
      var key = match[1].toLowerCase();
      var val = match[2];
      if (key === 'tvg-id') channel.epg_id = val;
      else if (key === 'tvg-name') channel.name = channel.name || val;
      else if (key === 'tvg-logo') channel.logo = val;
      else if (key === 'group-title') channel.group = val;
    }

    if (nameSection) channel.name = nameSection;

    return channel;
  }

  async function fetchAndParseM3U(url) {
    // Use CORS proxy for cross-origin requests on TV
    var fetchUrl = url;
    var isLocal = url.startsWith('http://localhost') || url.startsWith('http://127.');
    if (!isLocal && !url.startsWith('file://')) {
      // Try direct first (some TVs allow it), fallback to proxy
      try {
        var resp = await fetch(fetchUrl, { mode: 'cors' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var text = await resp.text();
        return parseM3U(text);
      } catch (e) {
        // Fallback: try without CORS mode
        var resp2 = await fetch(fetchUrl);
        var text2 = await resp2.text();
        return parseM3U(text2);
      }
    }
    var resp = await fetch(fetchUrl);
    var text = await resp.text();
    return parseM3U(text);
  }

  window.M3UParser = {
    parse: parseM3U,
    fetchAndParse: fetchAndParseM3U,
  };

}(window));
