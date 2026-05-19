/**
 * xmltv-parser.js — XMLTV EPG parser (replaces xmltv.rs + epg_db.rs).
 * Parses <programme> elements from XMLTV XML text.
 */
(function (window) {
  'use strict';

  function parseXmlTv(xmlText) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlText, 'text/xml');

    var channels = [];
    var programs = [];

    // Parse <channel> elements
    var channelEls = doc.querySelectorAll('channel');
    channelEls.forEach(function (el) {
      var id = el.getAttribute('id') || '';
      var nameEl = el.querySelector('display-name');
      channels.push({
        id: id,
        name: nameEl ? nameEl.textContent.trim() : id,
      });
    });

    // Parse <programme> elements
    var progEls = doc.querySelectorAll('programme');
    progEls.forEach(function (el) {
      var channelId = el.getAttribute('channel') || '';
      var start = parseXmltvDate(el.getAttribute('start') || '');
      var stop  = parseXmltvDate(el.getAttribute('stop') || el.getAttribute('end') || '');
      var titleEl = el.querySelector('title');
      var descEl  = el.querySelector('desc');
      var iconEl  = el.querySelector('icon');

      programs.push({
        id: channelId + '_' + start,
        channel_id: channelId,
        start: start,
        end: stop,
        title: titleEl ? titleEl.textContent.trim() : '',
        description: descEl ? descEl.textContent.trim() : '',
        poster: iconEl ? iconEl.getAttribute('src') : '',
      });
    });

    return { channels: channels, programs: programs };
  }

  // Parse XMLTV date format: "20240115143000 +0000"
  function parseXmltvDate(str) {
    if (!str) return 0;
    // Format: YYYYMMDDHHmmss [±HHMM]
    var m = str.replace(/\s+/g, '').match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})([\+\-]\d{4})?$/);
    if (!m) return 0;
    var dateStr = m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6];
    var offset = m[7] || '+0000';
    dateStr += offset.slice(0, 3) + ':' + offset.slice(3);
    return Math.floor(new Date(dateStr).getTime() / 1000);
  }

  async function fetchAndParseXmlTv(url) {
    var resp = await fetch(url);
    if (!resp.ok) throw new Error('XMLTV fetch failed: HTTP ' + resp.status);
    var text = await resp.text();
    return parseXmlTv(text);
  }

  // Fuzzy channel name matching for EPG channel suggestions
  function suggestEpgChannelIds(channelName, xmltvChannels) {
    var name = channelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    var scored = xmltvChannels.map(function (c) {
      var cname = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      var cid = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      var score = 0;
      // Exact match
      if (cname === name || cid === name) score = 100;
      // Contains
      else if (cname.includes(name) || name.includes(cname)) score = 70;
      else if (cid.includes(name) || name.includes(cid)) score = 60;
      // Prefix
      else if (cname.startsWith(name.slice(0, 4)) || cid.startsWith(name.slice(0, 4))) score = 40;
      return { id: c.id, name: c.name, score: score };
    });
    return scored
      .filter(function (s) { return s.score > 30; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 10)
      .map(function (s) { return s.id; });
  }

  window.XmlTvParser = {
    parse: parseXmlTv,
    fetchAndParse: fetchAndParseXmlTv,
    suggestEpgChannelIds: suggestEpgChannelIds,
  };

}(window));
