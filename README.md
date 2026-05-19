<div align="center">

<!-- ANIMATED HERO BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f1218,50:1a2040,100:0f1218&height=200&section=header&text=DaveTV&fontSize=80&fontColor=77a7ff&fontAlignY=38&desc=Samsung%20Smart%20TV%20%C2%B7%20Windows%20%C2%B7%20Web&descAlignY=60&descSize=20&descColor=56d2f1&animation=fadeIn" width="100%"/>

<!-- TYPING ANIMATION via readme-typing-svg -->
<img src="https://readme-typing-svg.demolab.com?font=Segoe+UI&weight=700&size=22&duration=3000&pause=800&color=77A7FF&center=true&vCenter=true&multiline=true&repeat=true&width=600&height=60&lines=Live+TV+%C2%B7+Movies+%C2%B7+Series+%C2%B7+Sports;Samsung+Tizen+%7C+Windows+%7C+Web;M3U+%C2%B7+Xtream+Codes+%C2%B7+XMLTV+EPG" alt="DaveTV Typing"/>

<br/><br/>

<!-- BADGES ROW 1 -->
[![Release](https://img.shields.io/github/v/release/Ghenghis/DaveTV?style=for-the-badge&color=77a7ff&logo=github&logoColor=white&label=Latest%20Release)](https://github.com/Ghenghis/DaveTV/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/Ghenghis/DaveTV/total?style=for-the-badge&color=56d2f1&logo=download&logoColor=white)](https://github.com/Ghenghis/DaveTV/releases)
[![Stars](https://img.shields.io/github/stars/Ghenghis/DaveTV?style=for-the-badge&color=a259ff&logo=star&logoColor=white)](https://github.com/Ghenghis/DaveTV/stargazers)

<!-- BADGES ROW 2 -->
[![Tizen](https://img.shields.io/badge/Tizen-4.0%2B-1428A0?style=for-the-badge&logo=samsung&logoColor=white)](https://developer.samsung.com/smarttv)
[![Windows](https://img.shields.io/badge/Windows-10%2F11-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Ghenghis/DaveTV/releases)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-56d2f1?style=for-the-badge)](LICENSE)

<br/>

🌐 **[Live Project Page](https://ghenghis.github.io/DaveTV/)** &nbsp;·&nbsp; 📦 **[Download Releases](https://github.com/Ghenghis/DaveTV/releases/latest)** &nbsp;·&nbsp; 📺 **[Tizen Install Guide](#-install-on-samsung-tv)**

</div>

---

<!-- ACTIVITY GRAPH -->
<img src="https://github-readme-activity-graph.vercel.app/graph?username=Ghenghis&repo=DaveTV&bg_color=0f1218&color=77a7ff&line=56d2f1&point=a259ff&area=true&hide_border=true&area_color=77a7ff" width="100%" alt="Activity Graph"/>

---

## 🎯 What is DaveTV?

> **DaveTV** is a fully-featured IPTV media centre built for Samsung Smart TVs (Tizen OS), Windows and Web.  
> Rebranded from IPTV Player Zero — every string, icon, package ID and asset carries the DaveTV identity end-to-end.

```
📺  Samsung Smart TV  ─── Tizen Web App (.wgt) ─── AVPlay native video
🖥️  Windows 10/11     ─── Native installer (.exe) ── mpv video engine
🌐  Browser / Server  ─── Static SPA (self-host)  ── HTML5 <video>
```

---

## ✨ Features

<div align="center">

|  📡 Live TV   | 📅 TV Guide | 🎬 Movies  | 📺 Series |  🎮 Remote   | 🗄️ Storage  |
| :----------: | :--------: | :-------: | :------: | :---------: | :--------: |
| M3U · Xtream | XMLTV EPG  |    VOD    | Episodes |    D-Pad    | IndexedDB  |
| Group filter | 7-day grid | Watchlist | Progress | Media keys  |  Offline   |
|    Search    | Auto-match | Continue  | Seasons  | Spatial nav | Persistent |

</div>

---

## 📦 Download

<div align="center">

|         Platform          | Download                                                                                                         |  Size   | Notes                       |
| :-----------------------: | :--------------------------------------------------------------------------------------------------------------- | :-----: | :-------------------------- |
|     📺 **Samsung TV**      | [DaveTV-Tizen-1.0.1.zip](https://github.com/Ghenghis/DaveTV/releases/latest/download/DaveTV-Tizen-1.0.1.zip)     | 3.75 MB | Tizen 4.0+ · `.wgt` package |
| 📺 **Samsung TV (direct)** | [davetv.wgt](https://ghenghis.github.io/DaveTV/davetv.wgt)                                                       | 3.75 MB | Direct `.wgt` file          |
|       🖥️ **Windows**       | [DaveTV-Windows-1.0.1.zip](https://github.com/Ghenghis/DaveTV/releases/latest/download/DaveTV-Windows-1.0.1.zip) | 153 MB  | Windows 10/11 installer     |
|   🌐 **Web / Self-host**   | [DaveTV-Web-1.0.1.zip](https://github.com/Ghenghis/DaveTV/releases/latest/download/DaveTV-Web-1.0.1.zip)         | 3.5 MB  | Static SPA, any web server  |

</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Samsung Smart TV  (Tizen 4.0+)                   │
│                                                                     │
│   ┌──────────────────────┐   invoke(cmd)   ┌─────────────────────┐ │
│   │    ⚛  React 18 SPA   │ ──────────────▶ │   🔌  Shim Layer    │ │
│   │   341KB + 115 chunks  │ ◀────────────── │  tauri-shim.js      │ │
│   │   Tailwind CSS 207KB  │  events / data  │  store.js           │ │
│   └──────────────────────┘                 │  player-shim.js     │ │
│                                            │  m3u-parser.js      │ │
│                                            │  xmltv-parser.js    │ │
│                                            │  xtream-client.js   │ │
│                                            │  remote-keys.js     │ │
│                                            └────────┬────────────┘ │
│                    ┌────────────┬───────────────────┼────────────┐ │
│                    ▼            ▼                   ▼            ▼ │
│              ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌───────┐ │
│              │  AVPlay  │ │IndexedDB │ │tvinputdevice │ │ Audio │ │
│              │  API ▶   │ │🗄 Storage│ │ 🎮 Remote    │ │Control│ │
│              └──────────┘ └──────────┘ └──────────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────────────┘
                    ▲  fetch()  ─────────────────────────────────────
                    │
        ┌───────────┴──────────────────────────┐
        │  🌐  M3U Servers · Xtream API         │
        │      XMLTV EPG Sources · CDNs         │
        └──────────────────────────────────────┘
```

---

## 🚀 Install on Samsung TV

### Step 1 — Enable Developer Mode
```
Remote → Settings → Support → About Smart TV
Type: 12345  →  Enable Developer Mode  →  Enter PC IP  →  OK  →  Reboot
```

### Step 2 — Connect
```cmd
sdb.exe connect <TV_IP>:26101
sdb.exe devices
```

### Step 3 — Install
```cmd
tizen.bat install -n davetv.wgt -t <DEVICE_ID>
```

### Step 4 — Launch
```cmd
tizen.bat run -p DaveTV.DaveTV -t <DEVICE_ID>
```
> Or: **TV Home → Apps → My Apps → DaveTV**

---

## 🗂️ Project Structure

```
davetv-app/
├── 📄 index.html              ← Entry point + DaveTV splash
├── 📄 config.xml              ← Tizen manifest (DaveTV.DaveTV)
├── js/
│   ├── 🔌 tauri-shim.js       ← 80+ Tauri IPC → Tizen/Web API
│   ├── 🗄️  store.js            ← IndexedDB persistence layer
│   ├── ▶️  player-shim.js      ← AVPlay wrapper
│   ├── 📋 m3u-parser.js       ← M3U/M3U8 parser
│   ├── 📅 xmltv-parser.js     ← XMLTV EPG + fuzzy match
│   ├── 📡 xtream-client.js    ← Xtream Codes API client
│   └── 🎮 remote-keys.js      ← TV remote + spatial nav
├── css/
│   └── index-C3DkTtkp.css     ← Tailwind CSS (207 KB)
├── assets/
│   ├── index-CXuONclM.js      ← React 18 bundle (341 KB)
│   └── *.js                   ← 115 lazy feature chunks
└── docs/
    ├── 🌐 index.html           ← GitHub Pages project site
    └── 📦 davetv.wgt           ← Tizen package for direct download
```

---

## 🔧 Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-a259ff?style=for-the-badge&logo=vite&logoColor=white)
![Samsung](https://img.shields.io/badge/Tizen_4.0-1428A0?style=for-the-badge&logo=samsung&logoColor=white)
![IndexedDB](https://img.shields.io/badge/IndexedDB-56d2f1?style=for-the-badge&logo=databricks&logoColor=white)
![AVPlay](https://img.shields.io/badge/AVPlay_API-77a7ff?style=for-the-badge&logo=samsung&logoColor=white)

</div>

---

## 🐛 Troubleshooting

| Problem               | Fix                                                               |
| --------------------- | ----------------------------------------------------------------- |
| White screen          | `sdb.exe dlog \| findstr DaveTV` — verify shims load before React |
| `sdb connect` refused | TV + PC on same WiFi; re-enter PC IP in Developer Mode            |
| No channels           | M3U URL must be reachable from TV network                         |
| Remote not working    | Verify `hw-key-event=true` in `config.xml`                        |
| AVPlay missing        | Only available on real Samsung TV hardware                        |

```cmd
# View live TV logs
sdb.exe -s <TV_IP>:26101 dlog | findstr "DaveTV"
```

---

## 📺 Supported Devices

| Model             | Series      | Tizen | Status      |
| ----------------- | ----------- | ----- | ----------- |
| QN85Q7FAAFXZA     | 85" QLED Q7 | 4.0   | ✅ Tested    |
| QN95Q7FAAFXZA     | 95" QLED Q7 | 4.0   | ✅ Tested    |
| All Samsung 2016+ | Any         | 3.0+  | ✅ Supported |

---

<!-- FOOTER WAVE -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f1218,50:1a2040,100:0f1218&height=120&section=footer&text=DaveTV%20%C2%B7%20Built%20with%20%E2%9D%A4%EF%B8%8F%20for%20Samsung%20TV&fontSize=16&fontColor=56d2f1&fontAlignY=65&animation=fadeIn" width="100%"/>
