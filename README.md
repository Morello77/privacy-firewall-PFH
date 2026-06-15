# Privacy Firewall for Humans (PFH)

**A lightweight Chrome extension that acts as a personal firewall for your data.**

Instead of blocking network ports, it focuses on blocking data leaks from websites, trackers, and AI tools.

## Current Status

**What works well:**
- **Tracker Blocking** — Uses EasyList + fallback rules to block known trackers (Google Analytics, DoubleClick, etc.)
- **Real-time Logging** — Shows blocked requests in the popup
- **Basic Spoofing** — User-Agent and Geolocation (JavaScript API level)
- **AI Noise Injection** — Adds random noise to prompts on ChatGPT-like sites

**Current Limitations (Important):**
- User-Agent spoofing only affects JavaScript `navigator` properties (does **not** rewrite HTTP request headers yet)
- Geolocation spoofing only works for browser APIs (IP-based location from your network is **not** affected — use a VPN for that)
- AI Noise Injection is basic and may not work perfectly on all AI interfaces

This is an early open-source version. The core tracking protection is solid, while spoofing features need further improvement.

## Screenshots

![Popup Interface](screenshot-popup.png)
![Flagged Requests](screenshot-flagged.png)

## Installation

1. Go to [`chrome://extensions/`](chrome://extensions/)
2. Enable **Developer mode** (top right)
3. Click **"Load unpacked"** and select the folder containing `manifest.json`
4. The extension icon should appear in your toolbar

## How to Use

- Click the shield icon to open the popup
- Toggle features as needed
- "Auto-block Trackers" is enabled by default
- Check "Recent Flagged Requests" to see activity

## Contributing

**This project needs your help!**

We are looking for contributors to improve:
- Better User-Agent header spoofing (using declarativeNetRequest rules)
- More robust anti-fingerprinting (to fool FingerprintJS and similar tools)
- Improved AI Noise Injection (more natural and reliable across different AI sites)
- Full geolocation + IP protection suggestions
- Firefox / Edge support
- Better testing and edge-case handling

**How to contribute:**
1. Fork the repo
2. Create a new branch
3. Make your changes
4. Open a Pull Request with clear description

Even small improvements, bug reports, or suggestions are highly welcome.

**GitHub Issues**: Feel free to open issues for bugs or feature requests.

## Privacy & Security

- Everything runs **locally** on your device
- No telemetry or data collection
- Open source under MIT License

## Limitations

- Cannot monitor or control native mobile/desktop apps (Chrome extension only)
- Some advanced fingerprinting techniques may still detect the browser
- Tracker blocking may require "Allow in incognito" for private browsing

## Future Plans

- Stronger fingerprint resistance
- Better AI protection
- Cross-browser support
- Possible desktop companion app
