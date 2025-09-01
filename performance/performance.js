document.addEventListener('DOMContentLoaded', () => {
    const app = {
        // DOM Elements
        performanceMode: document.getElementById('performance-mode'),
        performanceSongInfo: document.getElementById('performance-song-info'),
        lyricsDisplay: document.getElementById('lyrics-display'),
        decreaseFontBtn: document.getElementById('decrease-font-btn'),
        increaseFontBtn: document.getElementById('increase-font-btn'),
        fontSizeDisplay: document.getElementById('font-size-display'),
        toggleThemeBtn: document.getElementById('theme-toggle-btn'),
        exitPerformanceBtn: document.getElementById('exit-performance-btn'),
        prevSongBtn: document.getElementById('prev-song-btn'),
        nextSongBtn: document.getElementById('next-song-btn'),
        scrollToTopBtn: document.getElementById('scroll-to-top-btn'),
        autoScrollBtn: document.getElementById('auto-scroll-btn'),
        autoscrollSettingsBtn: document.getElementById('autoscroll-settings-btn'),
        autoscrollDelayModal: document.getElementById('autoscroll-delay-modal'),
        autoscrollDelaySlider: document.getElementById('autoscroll-delay-slider'),
        autoscrollDelayValue: document.getElementById('autoscroll-delay-value'),
        autoscrollSpeedSlider: document.getElementById('autoscroll-speed-slider'),
        autoscrollSpeedValue: document.getElementById('autoscroll-speed-value'),
        closeAutoscrollDelayModal: document.getElementById('close-autoscroll-delay-modal'),

        // State
        songs: [],
        performanceSetlistId: null,
        autoFitManuallyOverridden: false,
        performanceSongs: [],
        currentPerformanceSongIndex: 0,
        isPerformanceMode: true,
        autoScrollTimer: null,
        autoScrollDelayTimer: null,
        autoScrollSpeed: Number(localStorage.getItem('autoscrollSpeed')) || 1,
        autoScrollActive: false,
        autoscrollDelay: Number(localStorage.getItem('autoscrollDelay')) || 3,
        resizeObserver: null,

        fontSize: 32, // default value; will set per song
        perSongFontSizes: JSON.parse(localStorage.getItem('perSongFontSizes') || '{}'),
        minFontSize: 16,
        maxFontSize: 72,
        fontSizeStep: 1,

        // Initialize
        init() {
            this.loadData();
            this.setupEventListeners();
            this.loadPerformanceState();
            this.displayCurrentPerformanceSong();
            this.setupResizeObserver();
        },

        // Setup resize observer for auto-fit (unchanged)
        setupResizeObserver() {
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    if (!this.autoFitManuallyOverridden) {
                        clearTimeout(this.resizeTimeout);
                        this.resizeTimeout = setTimeout(() => {
                            // Optionally, you could auto-fit here if you want
                        }, 100);
                    }
                });
                this.resizeObserver.observe(this.performanceMode);
            }
        },

        // Load data from localStorage
        loadData() {
            this.songs = JSON.parse(localStorage.getItem('songs')) || [];
            const theme = localStorage.getItem('theme') || 'default-dark';
            document.documentElement.dataset.theme = theme;
        },

        // Load performance state from query parameters
        loadPerformanceState() {
            const params = new URLSearchParams(window.location.search);
            this.performanceSetlistId = params.get('setlistId') || null;
            const songId = params.get('songId');
            if (this.performanceSetlistId) {
                const setlistRaw = localStorage.getItem('setlists');
                if (setlistRaw) {
                    const setlists = JSON.parse(setlistRaw);
                    const setlist = setlists.find(s => s.id === this.performanceSetlistId);
                    if (setlist) {
                        this.performanceSongs = setlist.songs
                            .map(id => this.songs.find(s => s.id === id))
                            .filter(Boolean);
                    }
                }
            } else {
                this.performanceSongs = this.songs;
            }
            this.currentPerformanceSongIndex = songId
                ? this.performanceSongs.findIndex(s => s.id === songId)
                : 0;
            if (this.currentPerformanceSongIndex === -1) {
                this.currentPerformanceSongIndex = 0;
            }
            // If a specific songId was requested, respect it and do not override
            // with resume prompt. Only prompt when launching without a specific song.
            if (!songId) {
                this.maybeResumeSetlist();
            }
        },

        maybeResumeSetlist() {
            const lastPerfRaw = localStorage.getItem('lastPerformance');
            let lastPerf = null;
            if (lastPerfRaw) {
                try { lastPerf = JSON.parse(lastPerfRaw); } catch (e) {}
            }
            // Only prompt if we're entering the SAME setlist as before, and it wasn't at the beginning
            if (
                lastPerf &&
                lastPerf.setlistId &&
                lastPerf.setlistId === this.performanceSetlistId &&
                typeof lastPerf.songIndex === "number" &&
                lastPerf.songIndex > 0 &&
                this.performanceSongs[lastPerf.songIndex]
            ) {
                const resume = confirm(
                    "Resume this setlist where we left off? (Song " +
                    (lastPerf.songIndex + 1) +
                    ": " +
                    (this.performanceSongs[lastPerf.songIndex]?.title || "Unknown") +
                    ")\n\nPress OK to resume, or Cancel to start from the beginning."
                );
                if (resume) {
                    this.currentPerformanceSongIndex = lastPerf.songIndex;
                } else {
                    this.currentPerformanceSongIndex = 0;
                }
            } else {
                this.currentPerformanceSongIndex = 0;
            }
        },

        // Setup event listeners
        setupEventListeners() {
            // FONT SIZE BUTTONS
            this.decreaseFontBtn.addEventListener('click', () => this.adjustFontSize(-this.fontSizeStep));
            this.increaseFontBtn.addEventListener('click', () => this.adjustFontSize(this.fontSizeStep));

            this.toggleThemeBtn.addEventListener('click', () => this.handlePerformanceThemeToggle());
            this.exitPerformanceBtn.addEventListener('click', () => this.exitPerformanceMode());
            this.prevSongBtn.addEventListener('click', () => this.navigatePerformanceSong(-1));
            this.nextSongBtn.addEventListener('click', () => this.navigatePerformanceSong(1));
            this.scrollToTopBtn.addEventListener('click', () => {
                this.lyricsDisplay.scrollTo({ top: 0, behavior: 'smooth' });
            });
            this.autoScrollBtn.addEventListener('click', () => this.toggleAutoScroll());
            this.autoscrollSettingsBtn.addEventListener('click', () => {
                this.autoscrollDelayModal.style.display = 'block';
                this.autoscrollDelaySlider.value = this.autoscrollDelay;
                this.autoscrollDelayValue.textContent = this.autoscrollDelay + 's';
                this.autoscrollSpeedSlider.value = this.autoScrollSpeed;
                this.autoscrollSpeedValue.textContent = this.autoScrollSpeed;
            });
            this.autoscrollDelaySlider.addEventListener('input', (e) => {
                this.autoscrollDelayValue.textContent = e.target.value + 's';
            });
            this.autoscrollSpeedSlider.addEventListener('input', (e) => {
                this.autoscrollSpeedValue.textContent = e.target.value;
            });
            this.closeAutoscrollDelayModal.addEventListener('click', () => {
                this.autoscrollDelay = Number(this.autoscrollDelaySlider.value);
                localStorage.setItem('autoscrollDelay', this.autoscrollDelay);
                this.autoScrollSpeed = Number(this.autoscrollSpeedSlider.value);
                localStorage.setItem('autoscrollSpeed', this.autoScrollSpeed);
                this.autoscrollDelayModal.style.display = 'none';
            });
            this.lyricsDisplay.addEventListener('scroll', () => this.updateScrollButtonsVisibility());
            this.lyricsDisplay.addEventListener('touchstart', () => this.stopAutoScroll());
            this.lyricsDisplay.addEventListener('mousedown', () => this.stopAutoScroll());
        },

        // Display current song
        displayCurrentPerformanceSong() {
            const song = this.performanceSongs[this.currentPerformanceSongIndex];
            if (!song) return;

            this.autoFitManuallyOverridden = false; // Reset override for new song

            // Process lyrics
            let lines = song.lyrics.split('\n').map(line => line.trim());
            const normTitle = song.title.trim().toLowerCase();
            let removed = 0;
            while (lines.length && removed < 2) {
                if (!lines[0] || lines[0].toLowerCase() === normTitle) {
                    lines.shift(); removed++;
                } else break;
            }

            const songNumber = this.currentPerformanceSongIndex + 1;
            const totalSongs = this.performanceSongs.length;
            this.performanceSongInfo.innerHTML = `
                <h2>${song.title}</h2>
                <div class="song-progress">${songNumber} / ${totalSongs}</div>
            `;
		    
	    this.lyricsDisplay.textContent = lines.join('\n');

	// Restore per-song font size if present, else use last-used or default
	    let fs = this.perSongFontSizes[song.id];
	    if (typeof fs !== 'number') {
	    // fallback to previous fontSize or default
	         fs = this.fontSize || 32;
	    }
	    this.fontSize = fs;
	    this.updateFontSize();

            this.prevSongBtn.style.display = this.currentPerformanceSongIndex > 0 ? 'block' : 'none';
            this.nextSongBtn.style.display = this.currentPerformanceSongIndex < this.performanceSongs.length - 1 ? 'block' : 'none';
            this.stopAutoScroll();
            this.updateAutoScrollButton();
            this.autoScrollBtn.blur();
        },

        // Font size methods
	adjustFontSize(amount) {
	    this.fontSize = Math.max(this.minFontSize, Math.min(this.maxFontSize, this.fontSize + amount));
	    this.updateFontSize();
	    // Save font size for this song
	    const song = this.performanceSongs[this.currentPerformanceSongIndex];
	    if (song && song.id) {
		this.perSongFontSizes[song.id] = this.fontSize;
		localStorage.setItem('perSongFontSizes', JSON.stringify(this.perSongFontSizes));
	    }
	},

        updateFontSize() {
            if (this.lyricsDisplay) {
                this.lyricsDisplay.style.fontSize = this.fontSize + 'px';
            }
            if (this.fontSizeDisplay) {
                this.fontSizeDisplay.textContent = `${Math.round(this.fontSize)}px`;
            }
            setTimeout(() => this.updateScrollButtonsVisibility(), 100);
        },

        // Navigate to next/previous song
        navigatePerformanceSong(direction) {
            const newIndex = this.currentPerformanceSongIndex + direction;
            if (newIndex >= 0 && newIndex < this.performanceSongs.length) {
                this.currentPerformanceSongIndex = newIndex;
                this.displayCurrentPerformanceSong();
            }
        },

        // Toggle theme
        handlePerformanceThemeToggle() {
            const currentTheme = document.documentElement.dataset.theme;
            const isDark = currentTheme.includes('dark');
            const newTheme = isDark ? currentTheme.replace('dark', 'light') : currentTheme.replace('light', 'dark');
            document.documentElement.dataset.theme = newTheme;
            localStorage.setItem('theme', newTheme);
        },

        // Exit performance mode
        exitPerformanceMode() {
            const perf = {
                setlistId: this.performanceSetlistId || null,
                songIndex: this.currentPerformanceSongIndex,
                timestamp: Date.now()
            };
            localStorage.setItem('lastPerformance', JSON.stringify(perf));
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            window.location.href = '../index.html#performance';
        },

        // The rest: autoscroll, buttons, etc. are unchanged from your original

        startAutoScroll() {
            this.stopAutoScroll();
            const container = this.lyricsDisplay;
            if (!container) return;
            if (container.scrollHeight <= container.clientHeight) return;

            this.autoScrollActive = true;
            this.autoScrollDelayTimer = setTimeout(() => {
                this.autoScrollTimer = setInterval(() => {
                    if (!this.autoScrollActive) return;
                    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
                        this.stopAutoScroll();
                        return;
                    }
                    container.scrollTop += this.autoScrollSpeed;
                }, 50);
            }, this.autoscrollDelay * 1000);
        },

        stopAutoScroll() {
            this.autoScrollActive = false;
            if (this.autoScrollTimer) {
                clearInterval(this.autoScrollTimer);
                this.autoScrollTimer = null;
            }
            if (this.autoScrollDelayTimer) {
                clearTimeout(this.autoScrollDelayTimer);
                this.autoScrollDelayTimer = null;
            }
        },

        toggleAutoScroll() {
            if (this.autoScrollActive) {
                this.stopAutoScroll();
            } else {
                this.startAutoScroll();
            }
            this.updateAutoScrollButton();
        },

        updateAutoScrollButton() {
            const btn = this.autoScrollBtn;
            if (!btn) return;
            btn.innerHTML = this.autoScrollActive
                ? '<i class="fas fa-pause"></i>'
                : '<i class="fas fa-angle-double-down"></i>';
            btn.title = this.autoScrollActive ? 'Pause Autoscroll' : 'Start Autoscroll';
        },

        updateScrollButtonsVisibility() {
            const container = this.lyricsDisplay;
            if (!container) return;
            const needsScroll = container.scrollHeight > container.clientHeight;
            const hasScrolled = container.scrollTop > 2;

            if (hasScrolled) {
                this.scrollToTopBtn.classList.remove('invisible');
            } else {
                this.scrollToTopBtn.classList.add('invisible');
            }

            if (needsScroll) {
                this.autoScrollBtn.style.display = 'flex';
            } else {
                this.autoScrollBtn.style.display = 'none';
                this.stopAutoScroll();
            }
        },

        updateScrollBtnVisibility() {
            this.updateScrollButtonsVisibility();
        }
    };

    app.init();
});
