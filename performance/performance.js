document.addEventListener('DOMContentLoaded', () => {
    const app = {
        // DOM Elements
        performanceMode: document.getElementById('performance-mode'),
        performanceSongInfo: document.getElementById('performance-song-info'),
        lyricsDisplay: document.getElementById('lyrics-display'),
        fontSizeSlider: document.getElementById('font-size-slider'),
        toggleThemeBtn: document.getElementById('toggle-theme-btn'),
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

        // Initialize
        init() {
            this.loadData();
            this.setupEventListeners();
            this.loadPerformanceState();
            this.displayCurrentPerformanceSong();
        },

        // Load data from localStorage
        loadData() {
            this.songs = JSON.parse(localStorage.getItem('songs')) || [];
            const theme = localStorage.getItem('theme') || 'default-dark';
            document.body.dataset.theme = theme;
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
        },

        // Setup event listeners
        setupEventListeners() {
            this.fontSizeSlider.addEventListener('input', (e) => {
                this.autoFitManuallyOverridden = true; // Manual control now!
                const fontSize = parseFloat(e.target.value) * 16; // rem to px
                this.lyricsDisplay.style.fontSize = fontSize + 'px';
            });

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
            this.lyricsDisplay.addEventListener('scroll', () => this.updateScrollBtnVisibility());
            this.lyricsDisplay.addEventListener('touchstart', () => this.stopAutoScroll());
            this.lyricsDisplay.addEventListener('mousedown', () => this.stopAutoScroll());
        },

        // Display current song
        displayCurrentPerformanceSong() {
            const song = this.performanceSongs[this.currentPerformanceSongIndex];
            if (!song) return;

            this.autoFitManuallyOverridden = false; // Reset override for new song

            // Autofit font size
            const fontSize = this.autoFitLyricsFont(); // returns actual px size used
            // Set the slider to match autofit
            this.fontSizeSlider.value = (fontSize / 16).toFixed(2); // convert px to rem

            // Show lyrics
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

            setTimeout(() => this.autoFitLyricsFont(), 30);

            this.prevSongBtn.style.display = this.currentPerformanceSongIndex > 0 ? 'block' : 'none';
            this.nextSongBtn.style.display = this.currentPerformanceSongIndex < this.performanceSongs.length - 1 ? 'block' : 'none';
            this.stopAutoScroll();
            this.updateAutoScrollButton();
            this.autoScrollBtn.blur();
        },

        // Navigate to next/previous song
        navigatePerformanceSong(direction) {
            const newIndex = this.currentPerformanceSongIndex + direction;
            if (newIndex >= 0 && newIndex < this.performanceSongs.length) {
                this.currentPerformanceSongIndex = newIndex;
                this.displayCurrentPerformanceSong();
            }
        },

        // Handle font size change
        handleFontSizeChange(e) {
            const fontSize = e.target.value;
            this.lyricsDisplay.style.fontSize = fontSize + 'rem';
            this.autoFitLyricsFont();
        },

        // Toggle theme
        handlePerformanceThemeToggle() {
            const currentTheme = document.body.dataset.theme;
            const isDark = currentTheme.includes('dark');
            const newTheme = isDark ? currentTheme.replace('dark', 'light') : currentTheme.replace('light', 'dark');
            document.body.dataset.theme = newTheme;
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
            window.location.href = '../index.html#performance';
        },

        // Auto-fit lyrics font
        autoFitLyricsFont() {
            // If user has manually overridden, bail out
            if (this.autoFitManuallyOverridden) return parseFloat(this.lyricsDisplay.style.fontSize) || 24;

            const container = this.lyricsDisplay;
            const overlay = this.performanceMode;
            if (!container || !overlay || overlay.style.display !== 'flex') return 24;

            // Reset font size to a baseline
            let fontSize = 24; // px
            container.style.fontSize = fontSize + 'px';

            // Get the available area for lyrics
            const header = overlay.querySelector('.performance-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const containerHeight = overlay.offsetHeight - headerHeight - 24; // fudge
            const containerWidth = overlay.offsetWidth - 32; // fudge

            // Grow font until it doesn't fit (up to a max)
            while (
                container.scrollHeight < containerHeight * 0.97 &&
                container.scrollWidth < containerWidth * 0.97 &&
                fontSize < 120
            ) {
                fontSize += 2;
                container.style.fontSize = fontSize + 'px';
            }
            // Shrink if we went too far
            while (
                (container.scrollHeight > containerHeight ||
                container.scrollWidth > containerWidth) &&
                fontSize > 12
            ) {
                fontSize -= 1;
                container.style.fontSize = fontSize + 'px';
            }

            // Return final px size for slider sync
            return fontSize;
        },

        // Auto-scroll functions
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
                this.updateAutoScrollButton();
            } else {
                this.startAutoScroll();
                this.updateAutoScrollButton();
            }
        },

        updateAutoScrollButton() {
            const btn = this.autoScrollBtn;
            if (!btn) return;
            btn.innerHTML = this.autoScrollActive
                ? '<i class="fas fa-pause"></i>'
                : '<i class="fas fa-angle-double-down"></i>';
            btn.title = this.autoScrollActive ? 'Pause Autoscroll' : 'Start Autoscroll';
        },

        updateScrollBtnVisibility() {
            const perfModeActive = this.performanceMode.style.display === 'flex';
            if (perfModeActive && this.lyricsDisplay.scrollTop > 2) {
                this.scrollToTopBtn.classList.remove('invisible');
            } else {
                this.scrollToTopBtn.classList.add('invisible');
            }
        }
    };

    app.init();
});
