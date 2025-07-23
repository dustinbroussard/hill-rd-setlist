# Hill Rd. Setlist Manager

A **modern, touch-friendly web app** for musicians to manage setlists and lyrics with zero clutter and maximum clarity. Designed for live band rehearsals, gigging, and on-stage performance. Fast, offline-first, and fully mobile/tablet-friendly.

---

## 🚀 Features

- **Local-first**: All data (songs, setlists, preferences) saved in your browser—no cloud required!
- **Batch song upload**: Drag in `.txt` or `.docx` lyric files to add your entire songbook in minutes.
- **Smart title normalization**: Cleans up messy file names into proper titles automatically.
- **Full setlist management**: Create, rename, duplicate, reorder, and delete setlists. Drag and drop songs to build your set.
- **Fuzzy setlist import**: Paste a setlist (with or without numbering) and the app matches titles to your song library—even if the spelling isn’t perfect.
- **Quick search and filter**: Instantly search by song title or lyrics.
- **Performance Mode**: Beautiful fullscreen lyric display with swipe navigation, adjustable font size, theme toggle, and auto-scroll for hands-free performing.
- **Light/Dark themes**: AMOLED Dark (default) and Light. Toggle instantly—even during performance.
- **PWA support**: Install on your phone/tablet/desktop and use offline.
- **Export/Import**: Back up your setlists in `.json`, `.txt`, or `.csv` formats.

---

## 🛠️ Installation & Usage

### 1. **Quick Start (Web/PWA)**
- Open `index.html` in your browser.
    - Or serve the folder locally with `npx serve .` or any static server.
- **Optional:** Install the app on your device (Add to Home Screen prompt will appear).

### 2. **Add Your Songs**
- Click **Songs** tab.
- Drag-and-drop `.txt` or `.docx` files or use the **Upload** button.
- Each file is imported as a song (title auto-normalized).

### 3. **Build a Setlist**
- Go to the **Setlists** tab.
- Click **+** to create a new setlist.
- Drag songs from the left ("Available Songs") column to your setlist on the right.
- Reorder songs by drag-and-drop or use the up/down buttons.

### 4. **Performance Mode**
- Switch to the **Lyrics** tab.
- Pick a setlist (or show all songs).
- Tap a song or click **Start** to enter performance mode.
- In performance mode:
    - Swipe/arrow between songs
    - Adjust font size on the fly
    - Enable autoscroll for hands-free lyrics
    - Toggle dark/light themes for visibility

---

## 🧑‍🎤 Core Workflow

1. **Batch Import**: Add all your lyric files at once.
2. **Clean Titles**: No more "01_Crazy_Song_FINAL2.txt"—titles are cleaned up for you.
3. **Setlists**: Make, duplicate, and customize as many setlists as you need (by event, gig, etc.).
4. **Stage Mode**: Lyrics are fullscreen, high-contrast, and dead simple. Perfect for tablets.

---

## 📋 Features In Detail

### **Songs Tab**
- Upload, search, add, edit, or delete lyrics.
- Import via `.txt` or `.docx` files.
- Song titles are normalized on upload (removes numbers, underscores, weird capitalization).

### **Setlists Tab**
- Create new setlists or edit existing ones.
- Add/remove songs with a single click.
- Reorder with drag-and-drop.
- Import setlists from text files or pasted lists (smart matching to your songbook).
- Export setlists as JSON, TXT, or CSV.

### **Performance (Lyrics) Tab**
- Pick a setlist and enter performance mode.
- Fullscreen, responsive, touch-optimized display.
- Font size controls (per-song memory).
- Autoscroll with customizable speed/delay.
- Quick theme toggle for any lighting condition.
- Fast navigation: next/previous song arrows or swipe.

### **Theming**
- Choose from AMOLED dark, Light, Blue, Red, and more.
- Theme toggle in the corner (persistent per device).

### **Offline First / PWA**
- Works fully offline.
- Installable as an app (Add to Home Screen).
- Data is stored in browser/localStorage (no server needed).
- Service worker caches assets for offline reliability.

---

## 🧩 Dependencies

- [Fuse.js](https://fusejs.io/) (fuzzy song matching)
- [SortableJS](https://sortablejs.github.io/Sortable/) (drag-and-drop in setlists)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) (parsing `.docx` lyrics)
- FontAwesome (icons)
- Google Fonts (for custom font option)

---

## 💾 Data & Privacy

- **No cloud storage, no account needed.** All data stays in your browser/device.
- Export and back up your data as you like.
- Delete data at any time with the "Delete All Songs" or "Delete Setlist" buttons.

---

## 🔥 Tips & Gotchas

- **Backup your data**: While localStorage is stable, always export your setlists/songs occasionally—especially before clearing browser data.
- **Docx Upload**: Only lyrics/text are imported—formatting is ignored.
- **App updates**: If you make code changes, you might need to "refresh" the service worker (Ctrl+Shift+R) for updates to show in the installed app.
- **Tablet/Phone mode**: 100% tested and touch-optimized, especially for Android tablets in portrait mode.

---

## 🧑‍💻 Development & Contribution

This app is intentionally "no build, no framework, no backend."  
If you want to add features, just fork and hack away. Open issues or suggestions welcome!

---

## 📜 License

ISC License (do what you want, just don’t sue).

---

## 🙏 Credits

- [Fuse.js](https://fusejs.io/) for fuzzy search
- [SortableJS](https://sortablejs.github.io/Sortable/) for drag-and-drop
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for DOCX parsing
- FontAwesome & Google Fonts for visual polish

---

## 🎸 Built by musicians, for musicians. Enjoy your next gig!


