<div align="center">

<img src="images/davetv-logo.png" alt="DaveTV Logo" width="480"/>

<br/><br/>

**DaveTV** is a fully-featured IPTV player for Samsung Smart TVs (Tizen OS).  
Live TV, Movies, Series and EPG — all from your M3U or Xtream Codes subscription.

[![Tizen](https://img.shields.io/badge/Tizen-4.0%2B-1428A0?style=for-the-badge&logo=samsung&logoColor=white)](https://developer.samsung.com/smarttv)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Version](https://img.shields.io/badge/Version-1.0.0-77a7ff?style=for-the-badge)](https://github.com/Ghenghis/DaveTV)
[![License](https://img.shields.io/badge/License-MIT-56d2f1?style=for-the-badge)](LICENSE)
[![WGT](https://img.shields.io/badge/Package-.wgt-a259ff?style=for-the-badge)](https://ghenghis.github.io/DaveTV/davetv.wgt)

🌐 **[View Project Page](https://ghenghis.github.io/DaveTV/)** &nbsp;·&nbsp; 📦 **[Download davetv.wgt](https://ghenghis.github.io/DaveTV/davetv.wgt)** &nbsp;·&nbsp; 📖 **[Install Guide](#installation)**

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📡 | **Live TV** | Thousands of channels via M3U URLs or Xtream Codes. Group filtering, search, favourites. |
| 📅 | **TV Guide (EPG)** | 7-day electronic programme guide from XMLTV. Auto fuzzy-matches channels. |
| 🎬 | **Movies (VOD)** | Full Xtream VOD library with categories, posters, watch history and continue-watching. |
| 📺 | **Series** | TV series with seasons, episodes, per-episode progress tracking and favourites. |
| 🎮 | **TV Remote** | Full Samsung D-pad + media key support with spatial navigation focus engine. |
| 🗄️ | **Offline Storage** | IndexedDB — all data stored locally, no external server required. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Samsung Smart TV (Tizen 4.0+)                  │
│                                                                 │
│  ┌──────────────────┐    invoke(cmd)    ┌──────────────────┐   │
│  │   React 18 SPA   │ ─────────────────▶│  Shim Layer      │   │
│  │  (341KB bundle   │ ◀─────────────── │  tauri-shim.js   │   │
│  │  + 115 chunks)   │    events/data    │  store.js        │   │
│  └──────────────────┘                  │  player-shim.js  │   │
│                                        │  m3u-parser.js   │   │
│                                        │  xmltv-parser.js │   │
│                                        │  xtream-client.js│   │
│                                        │  remote-keys.js  │   │
│                                        └────────┬─────────┘   │
│                                                 │              │
│              ┌──────────────┬──────────────────┼────────────┐ │
│              ▼              ▼                  ▼            ▼  │
│         ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌───────┐│
│         │ AVPlay  │  │IndexedDB │  │tvinputdevice │  │Audio  ││
│         │  API    │  │ Storage  │  │  (Remote)    │  │Control││
│         └─────────┘  └──────────┘  └──────────────┘  └───────┘│
└─────────────────────────────────────────────────────────────────┘
         ▲ fetch()
         │
┌────────┴──────────────────────┐
│  M3U Servers · Xtream API     │
│  XMLTV EPG Sources · CDNs     │
└───────────────────────────────┘
```

---

## 📁 Project Structure

```
davetv-app/
├── index.html              ← Entry point + DaveTV splash screen
├── config.xml              ← Tizen manifest (package: DaveTV.DaveTV)
│
├── js/
│   ├── tauri-shim.js       ← 80+ Tauri IPC commands → Tizen/Web API
│   ├── store.js            ← IndexedDB (playlists, channels, EPG, history)
│   ├── player-shim.js      ← AVPlay wrapper (play/pause/seek/volume)
│   ├── m3u-parser.js       ← M3U/M3U8 playlist parser
│   ├── xmltv-parser.js     ← XMLTV EPG parser + fuzzy channel matching
│   ├── xtream-client.js    ← Xtream Codes API client (VOD/Series/Live)
│   └── remote-keys.js      ← TV D-pad + media keys + spatial navigation
│
├── css/
│   └── index-C3DkTtkp.css  ← Tailwind CSS (207 KB)
│
├── assets/
│   ├── index-CXuONclM.js   ← React 18 main bundle (341 KB)
│   └── *.js                ← 115 lazy-loaded feature chunks
│
├── images/
│   ├── icon.png             ← App icon 128×128
│   ├── icon-512.png         ← App icon 512×512
│   └── davetv-logo.png      ← Splash / README logo
│
└── docs/
    └── index.html           ← Project webpage (GitHub Pages)
```

---

## 🚀 Installation

### Prerequisites
- Samsung Smart TV (Tizen 4.0+, 2016 or newer)
- Tizen Studio installed on your PC (for `tizen.bat` + `sdb.exe`)
- TV and PC on the **same WiFi network**

### Step 1 — Enable Developer Mode on TV

1. Press **Home** on remote → **Settings → Support → About Smart TV**
2. On remote, quickly type: **`12345`**
3. Toggle **Developer Mode: ON**
4. Enter **your PC's local IP address** (run `ipconfig` on PC to find it)
5. Press **OK** → TV reboots with "Developer Mode" banner

### Step 2 — Connect via sdb

```bash
# sdb.exe location (Tizen Studio)
C:\Users\<you>\.tizen-extension-platform\server\sdktools\data\tools\sdb.exe

# Connect to TV (replace with your TV's IP)
sdb.exe connect <TV_IP>:26101

# Verify
sdb.exe devices
```

> **Find TV IP:** Settings → General → Network → Network Status → IP Settings

### Step 3 — Install

```bash
tizen.bat install -n "davetv.wgt" -t <DEVICE_ID>
```

### Step 4 — Launch

```bash
tizen.bat run -p DaveTV.DaveTV -t <DEVICE_ID>
```

Or find **DaveTV** under **Apps → My Apps** on the TV.

---

## 📋 Supported Sources

| Source | Format | How to Import |
|--------|--------|---------------|
| M3U playlist | `.m3u` / `.m3u8` | Paste URL in app |
| Xtream Codes | API v2 | Host + username + password |
| XMLTV EPG | `.xml` | Paste URL in EPG settings |

---

## 📺 Supported Devices

| Model | Tizen | Status |
|-------|-------|--------|
| QN85Q7FAAFXZA (85" QLED) | 4.0 | ✅ Tested |
| QN95Q7FAAFXZA (95" QLED) | 4.0 | ✅ Tested |
| Any Samsung TV 2016+ | 3.0+ | ✅ Supported |

---

## 🔧 Tech Stack

| Technology | Role |
|---|---|
| **React 18** | UI framework (SPA extracted from Tauri binary) |
| **Tailwind CSS** | Styling (207 KB built bundle) |
| **tauri-shim.js** | Replaces Rust/Tauri backend with 80+ JS command handlers |
| **AVPlay API** | Samsung native video player (HLS, TS, MP4) |
| **IndexedDB** | Browser-native persistence replacing SQLite |
| **Xtream Codes API** | Live TV, VOD and Series content source |
| **XMLTV** | Electronic Programme Guide data |
| **Vite 5** | Original build tool (bundle unmodified) |

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| White screen on load | Check `sdb dlog` — verify shims load before React bundle |
| `sdb connect` refused | TV + PC must be on same network; re-enter PC IP in Developer Mode |
| No channels after import | M3U URL must be reachable from TV network (not `localhost`) |
| AVPlay not found | Only works on real Samsung TV hardware, not browser |
| Remote keys not working | Verify `config.xml` has `hw-key-event="true"` |

### View Logs

```bash
sdb.exe -s <TV_IP>:26101 dlog | findstr "DaveTV"
```

---

## 📦 Building the .wgt

```python
import zipfile, os

with zipfile.ZipFile('davetv.wgt', 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('davetv-app'):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, 'davetv-app').replace('\\', '/')
            z.write(full, arc)
```

---

<div align="center">

**DaveTV** · Samsung Tizen IPTV Player · Built on IPTV Player Zero

[GitHub](https://github.com/Ghenghis/DaveTV) · [Project Page](https://ghenghis.github.io/DaveTV/) · [Install Guide](#installation)

</div>
