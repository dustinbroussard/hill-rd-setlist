// ==== TITLE NORMALIZER ====
function normalizeTitle(filename) {
    let title = filename.replace(/\.[^/.]+$/, '');
    title = title.replace(/[_\-]/g, ' ');
    title = title.trim();
    title = title.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return title;
}

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        // DOM Elements
        themeSelect: document.getElementById('theme-select'),
        navButtons: document.querySelectorAll('.nav-button'),
        tabs: document.querySelectorAll('.tab'),
        songList: document.getElementById('song-list'),
        addSongBtn: document.getElementById('add-song-btn'),
        songModal: document.getElementById('song-modal'),
        songModalTitle: document.getElementById('song-modal-title'),
        saveSongBtn: document.getElementById('save-song-btn'),
        cancelSongBtn: document.getElementById('cancel-song-btn'),
        songTitleInput: document.getElementById('song-title-input'),
        songLyricsInput: document.getElementById('song-lyrics-input'),
        songSearchInput: document.getElementById('song-search-input'),
        songUploadInput: document.getElementById('song-upload-input'),

        // Setlist DOM Elements
        setlistSelect: document.getElementById('setlist-select'),
        newSetlistBtn: document.getElementById('new-setlist-btn'),
        renameSetlistBtn: document.getElementById('rename-setlist-btn'),
        duplicateSetlistBtn: document.getElementById('duplicate-setlist-btn'),
        deleteSetlistBtn: document.getElementById('delete-setlist-btn'),
        availableSongsContainer: document.getElementById('available-songs'),
        currentSetlistSongsContainer: document.getElementById('current-setlist-songs'),
        currentSetlistTitle: document.getElementById('current-setlist-title'),
        setlistModal: document.getElementById('setlist-modal'),
        setlistModalTitle: document.getElementById('setlist-modal-title'),
        setlistNameInput: document.getElementById('setlist-name-input'),
        saveSetlistBtn: document.getElementById('save-setlist-btn'),
        cancelSetlistBtn: document.getElementById('cancel-setlist-btn'),

        // Performance DOM Elements
        performanceSetlistSelect: document.getElementById('performance-setlist-select'),
        performanceSongSearch: document.getElementById('performance-song-search'),
        startPerformanceBtn: document.getElementById('start-performance-btn'),
        performanceSongList: document.getElementById('performance-song-list'),
        performanceMode: document.getElementById('performance-mode'),
        performanceSongInfo: document.getElementById('performance-song-info'),
        lyricsDisplay: document.getElementById('lyrics-display'),
        fontSizeSlider: document.getElementById('font-size-slider'),
        toggleThemeBtn: document.getElementById('toggle-theme-btn'),
        exitPerformanceBtn: document.getElementById('exit-performance-btn'),
        prevSongBtn: document.getElementById('prev-song-btn'),
        nextSongBtn: document.getElementById('next-song-btn'),

        // State
        songs: [],
        setlists: [],
        currentSongId: null,
        currentSetlistId: null,
        performanceSetlistId: null,
        performanceSongs: [],
        currentPerformanceSongIndex: 0,
        isPerformanceMode: false,
        modalMode: null,
        sortableSetlist: null,

        // --- Core App Initialization ---
        init() {
            this.loadData();
            this.setupEventListeners();
            this.renderSongs();
            this.renderSetlists();
        },

        // --- Data Management ---
        loadData() {
            this.songs = JSON.parse(localStorage.getItem('songs')) || [];
            this.setlists = JSON.parse(localStorage.getItem('setlists')) || [];
            const theme = localStorage.getItem('theme') || 'default-dark';
            document.body.dataset.theme = theme;
            this.themeSelect.value = theme;
        },

        saveData() {
            localStorage.setItem('songs', JSON.stringify(this.songs));
            localStorage.setItem('setlists', JSON.stringify(this.setlists));
        },

        // --- Lyrics Management ---
        getAllLyrics() {
            return this.songs;
        },

        getLyricById(id) {
            return this.songs.find(song => song.id === id);
        },

        addLyric(song) {
            this.songs.push(song);
            this.saveData();
        },

        removeLyric(id) {
            this.songs = this.songs.filter(song => song.id !== id);
            this.saveData();
        },

        searchLyrics(query) {
            query = query.trim().toLowerCase();
            return this.songs.filter(song =>
                song.title.toLowerCase().includes(query) ||
                (song.lyrics && song.lyrics.toLowerCase().includes(query))
            );
        },

        renameLyric(id, newTitle) {
            const song = this.getLyricById(id);
            if (song) {
                song.title = newTitle;
                this.saveData();
            }
        },

        editLyric(id, newLyrics) {
            const song = this.getLyricById(id);
            if (song) {
                song.lyrics = newLyrics;
                this.saveData();
            }
        },

        // --- Event Listeners ---
        setupEventListeners() {
            this.themeSelect.addEventListener('change', (e) => {
                document.body.dataset.theme = e.target.value;
                localStorage.setItem('theme', e.target.value);
            });

            this.navButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const tabId = button.dataset.tab;
                    this.tabs.forEach(tab => tab.classList.remove('active'));
                    document.getElementById(tabId).classList.add('active');
                    this.navButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                });
            });

            this.addSongBtn.addEventListener('click', () => this.openSongModal());
            this.saveSongBtn.addEventListener('click', () => this.saveSong());
            this.cancelSongBtn.addEventListener('click', () => this.closeSongModal());
            this.songSearchInput.addEventListener('input', () => this.renderSongs());
            this.songUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));

            // Setlist Management
            this.newSetlistBtn.addEventListener('click', () => this.openSetlistModal());
            this.renameSetlistBtn.addEventListener('click', () => this.openSetlistModal('rename'));
            this.duplicateSetlistBtn.addEventListener('click', () => this.handleDuplicateSetlist());
            this.deleteSetlistBtn.addEventListener('click', () => this.handleDeleteSetlist());
            this.setlistSelect.addEventListener('change', (e) => this.handleSetlistSelectChange(e));
            this.saveSetlistBtn.addEventListener('click', () => this.saveSetlist());
            this.cancelSetlistBtn.addEventListener('click', () => this.closeSetlistModal());

            this.availableSongsContainer.addEventListener('click', (e) => this.handleAvailableSongsClick(e));
            this.currentSetlistSongsContainer.addEventListener('click', (e) => this.handleCurrentSetlistSongsClick(e));

            // Performance Mode
            this.performanceSetlistSelect.addEventListener('change', () => this.handlePerformanceSetlistChange());
            this.performanceSongSearch.addEventListener('input', () => this.handlePerformanceSongSearch());
            this.startPerformanceBtn.addEventListener('click', () => this.handleStartPerformance());
            this.performanceSongList.addEventListener('click', (e) => this.handlePerformanceSongClick(e));

            // Performance Controls
            this.fontSizeSlider.addEventListener('input', (e) => this.handleFontSizeChange(e));
            this.toggleThemeBtn.addEventListener('click', () => this.handlePerformanceThemeToggle());
            this.exitPerformanceBtn.addEventListener('click', () => this.exitPerformanceMode());
            this.prevSongBtn.addEventListener('click', () => this.navigatePerformanceSong(-1));
            this.nextSongBtn.addEventListener('click', () => this.navigatePerformanceSong(1));
        },

        // --- Song UI and Actions ---
        renderSongs() {
            const query = this.songSearchInput.value.toLowerCase();
            const filteredSongs = this.searchLyrics(query)
                .sort((a, b) => a.title.localeCompare(b.title));
            this.songList.innerHTML = filteredSongs.map(song => `
                <div class="song-item" data-id="${song.id}">
                    <span>${song.title}</span>
                    <div>
                        <button class="btn edit-song-btn"><i class="fas fa-pen"></i></button>
                        <button class="btn danger delete-song-btn"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.edit-song-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('.song-item').dataset.id;
                    this.openSongModal(id);
                });
            });

            document.querySelectorAll('.delete-song-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('.song-item').dataset.id;
                    this.deleteSong(id);
                });
            });
        },

        openSongModal(id = null) {
            this.currentSongId = id;
            if (id) {
                const song = this.getLyricById(id);
                this.songModalTitle.textContent = 'Edit Song';
                this.songTitleInput.value = song.title;
                this.songLyricsInput.value = song.lyrics;
            } else {
                this.songModalTitle.textContent = 'Add Song';
                this.songTitleInput.value = '';
                this.songLyricsInput.value = '';
            }
            this.songModal.style.display = 'block';
        },

        closeSongModal() {
            this.songModal.style.display = 'none';
        },

        saveSong() {
            const title = normalizeTitle(this.songTitleInput.value.trim());
            const lyrics = this.songLyricsInput.value.trim();
            if (!title) return;

            if (this.currentSongId) {
                this.renameLyric(this.currentSongId, title);
                this.editLyric(this.currentSongId, lyrics);
            } else {
                this.addLyric({
                    id: Date.now().toString(),
                    title,
                    lyrics,
                });
            }
            this.renderSongs();
            this.closeSongModal();
        },

        deleteSong(id) {
            if (confirm('Are you sure you want to delete this song?')) {
                this.removeLyric(id);
                // Also remove from setlists
                this.setlists.forEach(setlist => {
                    setlist.songs = setlist.songs.filter(songId => songId !== id);
                });
                this.saveData();
                this.renderSongs();
                this.renderSetlists();
            }
        },

        handleFileUpload(event) {
            const files = event.target.files;
            for (const file of files) {
                const reader = new FileReader();
                if (file.name.endsWith('.docx')) {
                    reader.onload = (e) => {
                        mammoth.extractRawText({ arrayBuffer: e.target.result })
                            .then(result => {
                                const title = normalizeTitle(file.name);
                                const lyrics = result.value;
                                this.addLyric({ id: Date.now().toString(), title, lyrics });
                                this.renderSongs();
                            });
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.onload = (e) => {
                        const title = normalizeTitle(file.name);
                        const lyrics = e.target.result;
                        this.addLyric({ id: Date.now().toString(), title, lyrics });
                        this.renderSongs();
                    };
                    reader.readAsText(file);
                }
            }
        },

        // === SETLIST MANAGEMENT ===
        renderSetlists() {
            this.setlistSelect.innerHTML = '<option value="">Select a setlist...</option>';
            this.performanceSetlistSelect.innerHTML = '<option value="">All Songs</option>';
            const setlists = this.setlists;

            setlists.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                this.setlistSelect.appendChild(opt);

                const perfOpt = document.createElement('option');
                perfOpt.value = s.id;
                perfOpt.textContent = s.name;
                this.performanceSetlistSelect.appendChild(perfOpt);
            });

            if (setlists.length && this.currentSetlistId) {
                this.setlistSelect.value = this.currentSetlistId;
                this.renderSetlistSongs();
            } else if (setlists.length > 0) {
                this.currentSetlistId = setlists[0].id;
                this.setlistSelect.value = this.currentSetlistId;
                this.renderSetlistSongs();
            } else {
                this.currentSetlistId = null;
                this.availableSongsContainer.innerHTML = '<p>No songs available</p>';
                this.currentSetlistSongsContainer.innerHTML = '<p>No setlist selected</p>';
                this.currentSetlistTitle.textContent = 'Current Setlist';
            }
        },

        renderSetlistSongs() {
            const setlist = this.setlists.find(s => s.id === this.currentSetlistId);
            const allSongs = this.songs;

            if (!setlist) {
                this.availableSongsContainer.innerHTML = '<p>No setlist selected</p>';
                this.currentSetlistSongsContainer.innerHTML = '<p>No setlist selected</p>';
                return;
            }

            // Available songs (not in current setlist), ALPHABETIZED
            const availableSongs = allSongs
                .filter(s => !setlist.songs.includes(s.id))
                .sort((a, b) => a.title.localeCompare(b.title));
            this.availableSongsContainer.innerHTML = availableSongs.length > 0 
                ? availableSongs.map(s =>
                    `<div class="song-item" data-id="${s.id}">
                        <span>${s.title}</span>
                        <button class="btn add-to-setlist-btn" title="Add to Setlist"><i class="fas fa-arrow-right"></i></button>
                    </div>`
                ).join('')
                : '<p>All songs are in this setlist</p>';

            // Current setlist songs (in order)
            const setlistSongs = setlist.songs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
            this.currentSetlistSongsContainer.innerHTML = setlistSongs.length > 0
                ? setlistSongs.map(s =>
                    `<div class="song-item sortable-setlist-song" data-id="${s.id}">
                        <span class="drag-handle" title="Drag to reorder" style="cursor:grab;"><i class="fas fa-grip-vertical"></i></span>
                        <span class="song-title">${s.title}</span>
                        <div>
                            <button class="btn move-up-btn" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                            <button class="btn move-down-btn" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                            <button class="btn remove-from-setlist-btn" title="Remove from Setlist"><i class="fas fa-times"></i></button>
                        </div>
                    </div>`
                ).join('')
                : '<p>No songs in this setlist</p>';
        },

        openSetlistModal(mode = 'add') {
            this.modalMode = mode;
            if (mode === 'rename' && this.currentSetlistId) {
                const setlist = this.setlists.find(s => s.id === this.currentSetlistId);
                this.setlistModalTitle.textContent = 'Rename Setlist';
                this.setlistNameInput.value = setlist?.name || '';
            } else {
                this.setlistModalTitle.textContent = 'New Setlist';
                this.setlistNameInput.value = '';
            }
            this.setlistModal.style.display = 'block';
            this.setlistNameInput.focus();
        },

        closeSetlistModal() {
            this.setlistModal.style.display = 'none';
            this.modalMode = null;
        },

        saveSetlist() {
            const name = this.setlistNameInput.value.trim();
            if (!name) {
                alert('Please enter a setlist name');
                return;
            }

            if (this.modalMode === 'rename' && this.currentSetlistId) {
                const setlist = this.setlists.find(s => s.id === this.currentSetlistId);
                if (setlist) setlist.name = name;
            } else {
                const setlist = {
                    id: Date.now().toString(),
                    name,
                    songs: []
                };
                this.setlists.push(setlist);
                this.currentSetlistId = setlist.id;
            }
            this.saveData();
            this.renderSetlists();
            this.closeSetlistModal();
        },

        handleDuplicateSetlist() {
            if (!this.currentSetlistId) return;
            const setlist = this.setlists.find(s => s.id === this.currentSetlistId);
            if (!setlist) return;
            const newSetlist = {
                id: Date.now().toString(),
                name: setlist.name + ' (Copy)',
                songs: [...setlist.songs]
            };
            this.setlists.push(newSetlist);
            this.currentSetlistId = newSetlist.id;
            this.saveData();
            this.renderSetlists();
        },

        handleDeleteSetlist() {
            if (!this.currentSetlistId) return;
            const idx = this.setlists.findIndex(s => s.id === this.currentSetlistId);
            if (idx !== -1 && confirm('Delete this setlist?')) {
                this.setlists.splice(idx, 1);
                this.currentSetlistId = null;
                this.saveData();
                this.renderSetlists();
            }
        },

        handleSetlistSelectChange(e) {
            this.currentSetlistId = e.target.value || null;
            this.renderSetlistSongs();
        },

        handleAvailableSongsClick(e) {
            if (!e.target.closest('.add-to-setlist-btn')) return;
            const songItem = e.target.closest('.song-item');
            if (!songItem || !this.currentSetlistId) return;
            const id = songItem.dataset.id;
            const setlist = this.setlists.find(s => s.id === this.currentSetlistId);
            if (setlist && !setlist.songs.includes(id)) {
                setlist.songs.push(id);
                this.saveData();
                this.renderSetlistSongs();
            }
        },

        handleCurrentSetlistSongsClick(e) {
            const songItem = e.target.closest('.song-item');
            if (!songItem || !this.currentSetlistId) return;
            const id = songItem.dataset.id;
            const setlist = this.setlists.find(s => s.id === this.currentSetlistId);
            if (!setlist) return;
            if (e.target.closest('.remove-from-setlist-btn')) {
                setlist.songs = setlist.songs.filter(sid => sid !== id);
                this.saveData();
                this.renderSetlistSongs();
            } else if (e.target.closest('.move-up-btn')) {
                const idx = setlist.songs.indexOf(id);
                if (idx > 0) {
                    [setlist.songs[idx], setlist.songs[idx - 1]] = [setlist.songs[idx - 1], setlist.songs[idx]];
                    this.saveData();
                    this.renderSetlistSongs();
                }
            } else if (e.target.closest('.move-down-btn')) {
                const idx = setlist.songs.indexOf(id);
                if (idx >= 0 && idx < setlist.songs.length - 1) {
                    [setlist.songs[idx], setlist.songs[idx + 1]] = [setlist.songs[idx + 1], setlist.songs[idx]];
                    this.saveData();
                    this.renderSetlistSongs();
                }
            }
        },

        // === PERFORMANCE MODE ===
        renderPerformanceTab() {
            this.renderSetlists();
            this.handlePerformanceSetlistChange();
        },

        handlePerformanceSetlistChange() {
            const setlistId = this.performanceSetlistSelect.value;
            this.performanceSetlistId = setlistId || null;
            this.renderPerformanceSongList();
        },

        handlePerformanceSongSearch() {
            this.renderPerformanceSongList();
        },

        renderPerformanceSongList() {
            let songs = [];
            const query = this.performanceSongSearch.value.trim();

            if (this.performanceSetlistId) {
                const setlist = this.setlists.find(s => s.id === this.performanceSetlistId);
                if (setlist) {
                    const allSongs = this.songs;
                    songs = setlist.songs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
                }
            } else {
                songs = this.songs;
            }

            if (query) {
                songs = songs.filter(song =>
                    song.title.toLowerCase().includes(query.toLowerCase()) ||
                    song.lyrics.toLowerCase().includes(query.toLowerCase())
                );
            }

            this.performanceSongList.innerHTML = songs.map(song => `
                <div class="song-item" data-id="${song.id}">
                    <span>${song.title}</span>
                    <button class="btn primary perform-song-btn" title="Perform This Song"><i class="fas fa-play"></i></button>
                </div>
            `).join('');
        },

        handlePerformanceSongClick(e) {
            if (!e.target.closest('.perform-song-btn')) return;
            const songItem = e.target.closest('.song-item');
            if (!songItem) return;
            const songId = songItem.dataset.id;
            this.startPerformanceWithSong(songId);
        },

        handleStartPerformance() {
            if (this.performanceSetlistId) {
                const setlist = this.setlists.find(s => s.id === this.performanceSetlistId);
                if (setlist && setlist.songs.length > 0) {
                    this.startPerformanceWithSong(setlist.songs[0]);
                } else {
                    alert('No songs in selected setlist');
                }
            } else {
                if (this.songs.length > 0) {
                    this.startPerformanceWithSong(this.songs[0].id);
                } else {
                    alert('No songs available');
                }
            }
        },

        startPerformanceWithSong(songId) {
            if (this.performanceSetlistId) {
                const setlist = this.setlists.find(s => s.id === this.performanceSetlistId);
                const allSongs = this.songs;
                this.performanceSongs = setlist.songs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
            } else {
                this.performanceSongs = this.songs;
            }

            this.currentPerformanceSongIndex = this.performanceSongs.findIndex(s => s.id === songId);
            if (this.currentPerformanceSongIndex === -1) {
                this.currentPerformanceSongIndex = 0;
            }

            this.enterPerformanceMode();
        },

        enterPerformanceMode() {
            if (this.performanceSongs.length === 0) return;
            this.isPerformanceMode = true;
            this.performanceMode.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.displayCurrentPerformanceSong();
        },

        exitPerformanceMode() {
            this.isPerformanceMode = false;
            this.performanceMode.style.display = 'none';
            document.body.style.overflow = '';
        },

        displayCurrentPerformanceSong() {
            const song = this.performanceSongs[this.currentPerformanceSongIndex];
            if (!song) return;

            this.performanceSongInfo.innerHTML = `
                <h2>${song.title}</h2>
                <p>Song ${this.currentPerformanceSongIndex + 1} of ${this.performanceSongs.length}</p>
            `;

            // Format lyrics with better line breaks
            const formattedLyrics = song.lyrics
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('<br><br>');

            this.lyricsDisplay.innerHTML = formattedLyrics || '<p>No lyrics available</p>';

            this.autoFitLyricsFont();

            // Update navigation buttons
            this.prevSongBtn.style.display = this.currentPerformanceSongIndex > 0 ? 'block' : 'none';
            this.nextSongBtn.style.display = this.currentPerformanceSongIndex < this.performanceSongs.length - 1 ? 'block' : 'none';
        },

        navigatePerformanceSong(direction) {
            const newIndex = this.currentPerformanceSongIndex + direction;
            if (newIndex >= 0 && newIndex < this.performanceSongs.length) {
                this.currentPerformanceSongIndex = newIndex;
                this.displayCurrentPerformanceSong();
            }
        },

        handleFontSizeChange(e) {
            const fontSize = e.target.value;
            this.lyricsDisplay.style.fontSize = fontSize + 'rem';
        },

        handlePerformanceThemeToggle() {
            const currentTheme = document.body.dataset.theme;
            const isDark = currentTheme.includes('dark');
            if (isDark) {
                document.body.dataset.theme = currentTheme.replace('dark', 'light');
            } else {
                document.body.dataset.theme = currentTheme.replace('light', 'dark');
            }
        },

        autoFitLyricsFont() {
            const container = this.lyricsDisplay;
            if (!container) return;
            let fontSize = 2.0; // rem
            container.style.fontSize = fontSize + 'rem';
            const maxHeight = this.performanceMode.offsetHeight - 60;
            while (container.scrollHeight > maxHeight && fontSize > 0.6) {
                fontSize -= 0.04;
                container.style.fontSize = fontSize + 'rem';
            }
        }

    }; // <--- END OF APP OBJECT

    app.init();
});

