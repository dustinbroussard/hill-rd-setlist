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
        resizeObserver: null,

        // Initialize
        init() {
            this.loadData();
            this.setupEventListeners();
            this.loadPerformanceState();
            this.displayCurrentPerformanceSong();
            this.setupResizeObserver();
        },

        // Setup resize observer for auto-fit
        setupResizeObserver() {
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver(() => {
                    if (!this.autoFitManuallyOverridden) {
                        // Debounce the resize
                        clearTimeout(this.resizeTimeout);
                        this.resizeTimeout = setTimeout(() => {
                            this.autoFitLyricsFont();
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
                this.autoFitManuallyOverridden = true;
                const fontSize = parseFloat(e.target.value);
                this.lyricsDisplay.style.fontSize = fontSize + 'px';
                // Save manual size for this song
                const currentSong = this.performanceSongs[this.currentPerformanceSongIndex];
                if (currentSong) {
                    localStorage.setItem('fontSize_' + currentSong.id, fontSize);
                }
                // Update scroll button visibility when font changes
                setTimeout(() => this.updateScrollButtonsVisibility(), 100);
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
            this.lyricsDisplay.addEventListener('scroll', () => this.updateScrollButtonsVisibility());
            this.lyricsDisplay.addEventListener('touchstart', () => this.stopAutoScroll());
            this.lyricsDisplay.addEventListener('mousedown', () => this.stopAutoScroll());
        },

        // Display current song
        displayCurrentPerformanceSong() {
            const song = this.performanceSongs[this.currentPerformanceSongIndex];
            if (!song) return;

            // Reset override for new song (unless saved size exists)
            const savedSize = localStorage.getItem('fontSize_' + song.id);
            if (savedSize) {
                this.autoFitManuallyOverridden = true;
                this.fontSizeSlider.value = savedSize;
                this.lyricsDisplay.style.fontSize = savedSize + 'px';
            } else {
                this.autoFitManuallyOverridden = false;
            }

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

            // Wait for DOM to update, then auto-fit
            requestAnimationFrame(() => {
                const fontSize = this.autoFitLyricsFont();
                this.fontSizeSlider.value = (fontSize / 16).toFixed(2);
                
                // Update button visibility after font is set
                setTimeout(() => this.updateScrollButtonsVisibility(), 100);
            });

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
            
            // Clean up resize observer
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            window.location.href = '../index.html#performance';
        },

        // Auto-fit lyrics font - FIXED VERSION
        autoFitLyricsFont() {
            if (this.autoFitManuallyOverridden) {
                return parseFloat(this.lyricsDisplay.style.fontSize) || 24;
            }

            const container = this.lyricsDisplay;
            const overlay = this.performanceMode;
            
            if (!container || !overlay) return 24;

            // Get dimensions
            const header = overlay.querySelector('.performance-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const availableHeight = overlay.clientHeight - headerHeight;
            const availableWidth = overlay.clientWidth;
            
            // Account for padding (from CSS: 0.8em top, 0.5em sides, 1.2em bottom)
            const paddingHeight = 32; // roughly 0.8em + 1.2em at base size
            const paddingWidth = 16; // roughly 0.5em * 2 at base size
            
            const targetHeight = availableHeight - paddingHeight;
            const targetWidth = availableWidth - paddingWidth;

            // Binary search for optimal font size
            let minSize = 12;
            let maxSize = 120;
            let optimalSize = 24;

            while (maxSize - minSize > 1) {
                const midSize = Math.floor((minSize + maxSize) / 2);
                container.style.fontSize = midSize + 'px';
                
                // Force reflow
                container.offsetHeight;
                
                const fitsHeight = container.scrollHeight <= targetHeight;
                const fitsWidth = container.scrollWidth <= targetWidth;
                
                if (fitsHeight && fitsWidth) {
                    optimalSize = midSize;
                    minSize = midSize;
                } else {
                    maxSize = midSize;
                }
            }

            // Set the final size
            container.style.fontSize = optimalSize + 'px';
            
            // Debug logging (remove in production)
            console.log('Auto-fit results:', {
                availableHeight,
                availableWidth,
                targetHeight,
                targetWidth,
                scrollHeight: container.scrollHeight,
                scrollWidth: container.scrollWidth,
                fontSize: optimalSize
            });

            return optimalSize;
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

        // FIXED: Combined scroll button visibility logic
        updateScrollButtonsVisibility() {
            const container = this.lyricsDisplay;
            if (!container) return;
            
            const needsScroll = container.scrollHeight > container.clientHeight;
            const hasScrolled = container.scrollTop > 2;
            
            // Show/hide scroll to top button
            if (hasScrolled) {
                this.scrollToTopBtn.classList.remove('invisible');
            } else {
                this.scrollToTopBtn.classList.add('invisible');
            }
            
            // Show/hide auto-scroll button based on whether scrolling is needed
            if (needsScroll) {
                this.autoScrollBtn.style.display = 'flex';
            } else {
                this.autoScrollBtn.style.display = 'none';
                this.stopAutoScroll(); // Stop auto-scroll if no longer needed
            }
        },

        // Legacy method name for compatibility
        updateScrollBtnVisibility() {
            this.updateScrollButtonsVisibility();
        }
    };

    app.init();
});
