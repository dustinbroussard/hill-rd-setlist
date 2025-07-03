// Enhanced script.js with Performance Mode and missing functionality

class App {
    // DOM Elements - Using private class fields for better encapsulation
    #themeSelect = document.getElementById('theme-select');
    #navButtons = document.querySelectorAll('.nav-button');
    #tabs = document.querySelectorAll('.tab');
    #songList = document.getElementById('song-list');
    #addSongBtn = document.getElementById('add-song-btn');
    #songModal = document.getElementById('song-modal');
    #songModalTitle = document.getElementById('song-modal-title');
    #saveSongBtn = document.getElementById('save-song-btn');
    #cancelSongBtn = document.getElementById('cancel-song-btn');
    #songTitleInput = document.getElementById('song-title-input');
    #songLyricsInput = document.getElementById('song-lyrics-input');
    #songSearchInput = document.getElementById('song-search-input');
    #songUploadInput = document.getElementById('song-upload-input');
    #deleteAllBtn = null;

    // Setlist DOM Elements
    #setlistSelect = document.getElementById('setlist-select');
    #newSetlistBtn = document.getElementById('new-setlist-btn');
    #renameSetlistBtn = document.getElementById('rename-setlist-btn');
    #duplicateSetlistBtn = document.getElementById('duplicate-setlist-btn');
    #deleteSetlistBtn = document.getElementById('delete-setlist-btn');
    #availableSongsContainer = document.getElementById('available-songs');
    #currentSetlistSongsContainer = document.getElementById('current-setlist-songs');
    #currentSetlistTitle = document.getElementById('current-setlist-title');
    #setlistModal = document.getElementById('setlist-modal');
    #setlistModalTitle = document.getElementById('setlist-modal-title');
    #setlistNameInput = document.getElementById('setlist-name-input');
    #saveSetlistBtn = document.getElementById('save-setlist-btn');
    #cancelSetlistBtn = document.getElementById('cancel-setlist-btn');

    // Performance DOM Elements
    #performanceSetlistSelect = document.getElementById('performance-setlist-select');
    #performanceSongSearch = document.getElementById('performance-song-search');
    #startPerformanceBtn = document.getElementById('start-performance-btn');
    #performanceSongList = document.getElementById('performance-song-list');
    #performanceMode = document.getElementById('performance-mode');
    #performanceSongInfo = document.getElementById('performance-song-info');
    #lyricsDisplay = document.getElementById('lyrics-display');
    #fontSizeSlider = document.getElementById('font-size-slider');
    #toggleThemeBtn = document.getElementById('toggle-theme-btn');
    #exitPerformanceBtn = document.getElementById('exit-performance-btn');
    #prevSongBtn = document.getElementById('prev-song-btn');
    #nextSongBtn = document.getElementById('next-song-btn');

    // State
    #currentSongId = null;
    #currentSetlistId = null;
    #performanceSetlistId = null;
    #performanceSongs = [];
    #currentPerformanceSongIndex = 0;
    #isPerformanceMode = false;
    #modalMode = null; // 'add', 'edit', 'rename'
    #sortableSetlist = null;
    
    constructor() {
        this.#loadTheme();
        this.#injectDeleteAllButton();
        this.#setupEventListeners();
        this.#renderSongs();
        this.#renderSetlists();
        this.#renderPerformanceTab();
    }

    #loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'default-dark';
        document.body.dataset.theme = savedTheme;
        this.#themeSelect.value = savedTheme;
    }

    #injectDeleteAllButton() {
        const toolbar = this.#songList.closest('.songs-page')?.querySelector('.toolbar');
        if (toolbar && !toolbar.querySelector('#delete-all-btn')) {
            const btn = document.createElement('button');
            btn.id = 'delete-all-btn';
            btn.className = 'btn danger';
            btn.innerHTML = '<i class="fas fa-trash"></i> Delete All';
            toolbar.appendChild(btn);
            this.#deleteAllBtn = btn;
        }
    }

    #setupEventListeners() {
        this.#themeSelect.addEventListener('change', this.#handleThemeChange.bind(this));
        this.#navButtons.forEach(button => {
            button.addEventListener('click', this.#handleNavButtonClick.bind(this));
        });

        // Song Management
        this.#addSongBtn.addEventListener('click', () => this.#openSongModal());
        this.#saveSongBtn.addEventListener('click', () => this.#saveSong());
        this.#cancelSongBtn.addEventListener('click', () => this.#closeSongModal());
        this.#songSearchInput.addEventListener('input', () => this.#renderSongs());
        this.#songUploadInput.addEventListener('change', (e) => this.#handleFileUpload(e));
        this.#songList.addEventListener('click', this.#handleSongListClick.bind(this));

        if (this.#deleteAllBtn) {
            this.#deleteAllBtn.addEventListener('click', () => this.#deleteAllSongs());
        }

        // Setlist Management
        this.#newSetlistBtn.addEventListener('click', () => this.#openSetlistModal());
        this.#renameSetlistBtn.addEventListener('click', () => this.#openSetlistModal('rename'));
        this.#duplicateSetlistBtn.addEventListener('click', this.#handleDuplicateSetlist.bind(this));
        this.#deleteSetlistBtn.addEventListener('click', this.#handleDeleteSetlist.bind(this));
        this.#setlistSelect.addEventListener('change', this.#handleSetlistSelectChange.bind(this));
        this.#saveSetlistBtn.addEventListener('click', () => this.#saveSetlist());
        this.#cancelSetlistBtn.addEventListener('click', () => this.#closeSetlistModal());

        this.#availableSongsContainer.addEventListener('click', this.#handleAvailableSongsClick.bind(this));
        this.#currentSetlistSongsContainer.addEventListener('click', this.#handleCurrentSetlistSongsClick.bind(this));
	// Setlist Import/Export
	document.getElementById('import-setlist-btn').addEventListener('click', () => {
	    document.getElementById('import-setlist-file').click();
	});

	document.getElementById('import-setlist-file').addEventListener('change', (e) => {
	    this.#handleImportSetlistFile(e);
	});

	document.getElementById('export-setlist-btn').addEventListener('click', () => {
	    this.#handleExportSetlist();
	});

        // Performance Mode
        this.#performanceSetlistSelect.addEventListener('change', this.#handlePerformanceSetlistChange.bind(this));
        this.#performanceSongSearch.addEventListener('input', this.#handlePerformanceSongSearch.bind(this));
        this.#startPerformanceBtn.addEventListener('click', this.#handleStartPerformance.bind(this));
        this.#performanceSongList.addEventListener('click', this.#handlePerformanceSongClick.bind(this));
        
        // Performance Controls
        this.#fontSizeSlider.addEventListener('input', this.#handleFontSizeChange.bind(this));
        this.#toggleThemeBtn.addEventListener('click', this.#handlePerformanceThemeToggle.bind(this));
        this.#exitPerformanceBtn.addEventListener('click', this.#exitPerformanceMode.bind(this));
        this.#prevSongBtn.addEventListener('click', () => this.#navigatePerformanceSong(-1));
        this.#nextSongBtn.addEventListener('click', () => this.#navigatePerformanceSong(1));

        // Modal click outside to close
        this.#songModal.addEventListener('click', (e) => {
            if (e.target === this.#songModal) this.#closeSongModal();
        });
        this.#setlistModal.addEventListener('click', (e) => {
            if (e.target === this.#setlistModal) this.#closeSetlistModal();
        });

        // Keyboard shortcuts for performance mode
        document.addEventListener('keydown', this.#handleKeyboardShortcuts.bind(this));
    }

    #handleKeyboardShortcuts(e) {
        if (!this.#isPerformanceMode) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.#navigatePerformanceSong(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.#navigatePerformanceSong(1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.#exitPerformanceMode();
        }
    }

    // --- General Event Handlers ---
    #handleThemeChange(e) {
        document.body.dataset.theme = e.target.value;
        localStorage.setItem('theme', e.target.value);
    }

    #handleNavButtonClick(e) {
        const button = e.currentTarget;
        const tabId = button.dataset.tab;
        this.#tabs.forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        this.#navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Refresh performance tab when switched to
        if (tabId === 'performance') {
            this.#renderPerformanceTab();
        }
    }

    #handleSongListClick(e) {
        const songItem = e.target.closest('.song-item');
        if (!songItem) return;

        const id = songItem.dataset.id;
        if (e.target.closest('.edit-song-btn')) {
            this.#openSongModal('edit', id);
        } else if (e.target.closest('.delete-song-btn')) {
            this.#deleteSong(id);
        }
    }

    // --- Song Management Functions ---
    #renderSongs() {
        const query = this.#songSearchInput.value.trim();
        let songs = query
            ? LyricsManager.searchLyrics(query)
            : LyricsManager.getAllLyrics();

songs = songs.sort((a, b) => a.title.localeCompare(b.title));


        this.#songList.innerHTML = songs.map(song => `
            <div class="song-item" data-id="${song.id}">
                <span>${song.title}</span>
                <div>
                    <button class="btn edit-song-btn" title="Edit Song"><i class="fas fa-pen"></i></button>
                    <button class="btn danger delete-song-btn" title="Delete Song"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    #openSongModal(mode = 'add', id = null) {
        this.#modalMode = mode;
        this.#currentSongId = id;
        
        if (mode === 'edit' && id) {
            const song = LyricsManager.getLyricById(id);
            this.#songModalTitle.textContent = 'Edit Song';
            this.#songTitleInput.value = song.title;
            this.#songLyricsInput.value = song.lyrics;
        } else {
            this.#songModalTitle.textContent = 'Add Song';
            this.#songTitleInput.value = '';
            this.#songLyricsInput.value = '';
        }
        this.#songModal.style.display = 'block';
        this.#songTitleInput.focus();
    }

    #closeSongModal() {
        this.#songModal.style.display = 'none';
        this.#modalMode = null;
        this.#currentSongId = null;
    }

    #saveSong() {
        const title = this.#songTitleInput.value.trim();
        const lyrics = this.#songLyricsInput.value.trim();
        if (!title) {
            alert('Please enter a song title');
            return;
        }

        if (this.#modalMode === 'edit' && this.#currentSongId) {
            LyricsManager.renameLyric(this.#currentSongId, title);
            LyricsManager.editLyric(this.#currentSongId, lyrics);
        } else {
            LyricsManager.addLyricFile({
                id: crypto.randomUUID(),
                title,
                lyrics,
                fileType: 'manual'
            });
        }
        this.#renderSongs();
        this.#renderPerformanceTab();
        this.#closeSongModal();
    }

    #deleteSong(id) {
        if (confirm('Are you sure you want to delete this song?')) {
            LyricsManager.removeLyric(id);
            this.#renderSongs();
            // Remove from setlists
            SetlistsManager.getAllSetlists().forEach(setlist => {
                if (setlist.songs.includes(id)) {
                    setlist.songs = setlist.songs.filter(songId => songId !== id);
                    SetlistsManager.updateSetlistSongs(setlist.id, setlist.songs);
                }
            });
            this.#renderSetlists();
            this.#renderPerformanceTab();
        }
    }

    #deleteAllSongs() {
        if (confirm('Delete ALL songs? This cannot be undone!')) {
            const all = LyricsManager.getAllLyrics();
            all.forEach(song => LyricsManager.removeLyric(song.id));
            this.#renderSongs();
            SetlistsManager.clearAllSetlists?.() || this.#clearAllSetlistsManual();
            this.#renderSetlists();
            this.#renderPerformanceTab();
        }
    }

    #clearAllSetlistsManual() {
        SetlistsManager.getAllSetlists().forEach(setlist => {
            SetlistsManager.deleteSetlist(setlist.id);
        });
    }

    async #handleFileUpload(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            const results = await LyricsManager.bulkUpload(files);
            const successCount = results.filter(r => r.status === 'success').length;
            const errorCount = results.filter(r => r.status === 'error').length;
            
            let message = `Upload complete: ${successCount} files processed successfully`;
            if (errorCount > 0) {
                message += `, ${errorCount} failed`;
            }
            alert(message);
            
            this.#renderSongs();
            this.#renderPerformanceTab();
        } catch (error) {
            alert('Upload failed: ' + error.message);
        }
        
        // Clear the input
        event.target.value = '';
    }

    // --- Setlist Management Functions ---
    #renderSetlists() {
        this.#setlistSelect.innerHTML = '<option value="">Select a setlist...</option>';
        this.#performanceSetlistSelect.innerHTML = '<option value="">All Songs</option>';
        
        const setlists = SetlistsManager.getAllSetlists();

        setlists.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            this.#setlistSelect.appendChild(opt);

            const perfOpt = document.createElement('option');
            perfOpt.value = s.id;
            perfOpt.textContent = s.name;
            this.#performanceSetlistSelect.appendChild(perfOpt);
        });

        if (setlists.length && this.#currentSetlistId) {
            this.#setlistSelect.value = this.#currentSetlistId;
            this.#renderSetlistSongs();
        } else if (setlists.length > 0) {
            this.#currentSetlistId = setlists[0].id;
            this.#setlistSelect.value = this.#currentSetlistId;
            this.#renderSetlistSongs();
        } else {
            this.#currentSetlistId = null;
            this.#availableSongsContainer.innerHTML = '<p>No songs available</p>';
            this.#currentSetlistSongsContainer.innerHTML = '<p>No setlist selected</p>';
            this.#currentSetlistTitle.textContent = 'Current Setlist';
        }
    }

    #renderSetlistSongs() {
        const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
        const allSongs = LyricsManager.getAllLyrics();

        if (!setlist) {
            this.#availableSongsContainer.innerHTML = '<p>No setlist selected</p>';
            this.#currentSetlistSongsContainer.innerHTML = '<p>No setlist selected</p>';
            return;
        }

        // Available songs (not in current setlist), ALPHABETIZED
        const availableSongs = allSongs
             .filter(s => !setlist.songs.includes(s.id))
             .sort((a, b) => a.title.localeCompare(b.title));
        this.#availableSongsContainer.innerHTML = availableSongs.length > 0 
            ? availableSongs.map(s =>
                `<div class="song-item" data-id="${s.id}">
                    <span>${s.title}</span>
                    <button class="btn add-to-setlist-btn" title="Add to Setlist"><i class="fas fa-arrow-right"></i></button>
                </div>`
            ).join('')
            : '<p>All songs are in this setlist</p>';

        // Current setlist songs (in order)
        const setlistSongs = setlist.songs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
        this.#currentSetlistSongsContainer.innerHTML = setlistSongs.length > 0
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
            
        // Drag-and-drop reordering for setlist songs
        if (this.#sortableSetlist) {
            this.#sortableSetlist.destroy();
        }
        this.#sortableSetlist = Sortable.create(this.#currentSetlistSongsContainer, {
            handle: '.drag-handle',
            animation: 150,
            ghostClass: 'drag-ghost',
            onEnd: (evt) => {
                // Update the order in the setlist
                const newOrder = Array.from(this.#currentSetlistSongsContainer.querySelectorAll('.song-item'))
                    .map(item => item.dataset.id);
                const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
                if (setlist) {
                    setlist.songs = newOrder;
                    SetlistsManager.updateSetlistSongs(this.#currentSetlistId, setlist.songs);
                    this.#renderSetlistSongs(); // Refresh for visual accuracy
                }
            }
        });
    }

    #handleAvailableSongsClick(e) {
        if (!e.target.closest('.add-to-setlist-btn')) return;

        const songItem = e.target.closest('.song-item');
        if (!songItem || !this.#currentSetlistId) return;

        const id = songItem.dataset.id;
        const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
        if (setlist && !setlist.songs.includes(id)) {
            setlist.songs.push(id);
            SetlistsManager.updateSetlistSongs(this.#currentSetlistId, setlist.songs);
            this.#renderSetlistSongs();
        }
    }

    #handleCurrentSetlistSongsClick(e) {
        const songItem = e.target.closest('.song-item');
        if (!songItem || !this.#currentSetlistId) return;

        const id = songItem.dataset.id;
        const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
        if (!setlist) return;

        if (e.target.closest('.remove-from-setlist-btn')) {
            setlist.songs = setlist.songs.filter(sid => sid !== id);
            SetlistsManager.updateSetlistSongs(this.#currentSetlistId, setlist.songs);
            this.#renderSetlistSongs();
        } else if (e.target.closest('.move-up-btn')) {
            const index = setlist.songs.indexOf(id);
            if (index > 0) {
                [setlist.songs[index], setlist.songs[index - 1]] = [setlist.songs[index - 1], setlist.songs[index]];
                SetlistsManager.updateSetlistSongs(this.#currentSetlistId, setlist.songs);
                this.#renderSetlistSongs();
            }
        } else if (e.target.closest('.move-down-btn')) {
            const index = setlist.songs.indexOf(id);
            if (index >= 0 && index < setlist.songs.length - 1) {
                [setlist.songs[index], setlist.songs[index + 1]] = [setlist.songs[index + 1], setlist.songs[index]];
                SetlistsManager.updateSetlistSongs(this.#currentSetlistId, setlist.songs);
                this.#renderSetlistSongs();
            }
        }
    }

    #openSetlistModal(mode = 'add') {
        this.#modalMode = mode;
        
        if (mode === 'rename' && this.#currentSetlistId) {
            const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
            this.#setlistModalTitle.textContent = 'Rename Setlist';
            this.#setlistNameInput.value = setlist?.name || '';
        } else {
            this.#setlistModalTitle.textContent = 'New Setlist';
            this.#setlistNameInput.value = '';
        }
        this.#setlistModal.style.display = 'block';
        this.#setlistNameInput.focus();
    }

    #closeSetlistModal() {
        this.#setlistModal.style.display = 'none';
        this.#modalMode = null;
    }

    #saveSetlist() {
        const name = this.#setlistNameInput.value.trim();
        if (!name) {
            alert('Please enter a setlist name');
            return;
        }

        if (this.#modalMode === 'rename' && this.#currentSetlistId) {
            SetlistsManager.renameSetlist(this.#currentSetlistId, name);
        } else {
            const setlist = SetlistsManager.addSetlist(name);
            this.#currentSetlistId = setlist.id;
        }
        this.#renderSetlists();
        this.#closeSetlistModal();
    }

    #handleDuplicateSetlist() {
        if (!this.#currentSetlistId) return;
        const setlist = SetlistsManager.duplicateSetlist(this.#currentSetlistId);
        if (setlist) {
            this.#currentSetlistId = setlist.id;
            this.#renderSetlists();
        }
    }

    #handleDeleteSetlist() {
        if (!this.#currentSetlistId) return;
        const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
        if (confirm(`Delete "${setlist?.name}" setlist?`)) {
            SetlistsManager.deleteSetlist(this.#currentSetlistId);
            this.#currentSetlistId = null;
            this.#renderSetlists();
        }
    }

    #handleSetlistSelectChange(e) {
        this.#currentSetlistId = e.target.value || null;
        this.#renderSetlistSongs();
    }
    
    async #handleImportSetlistFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        let lines = [];
        let name = file.name.replace(/\.[^/.]+$/, '');

        try {
            if (file.name.endsWith('.txt')) {
                const text = await file.text();
                lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            } else if (file.name.endsWith('.docx')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await window.mammoth.convertToHtml({ arrayBuffer });
                const text = result.value.replace(/<\/?[^>]+(>|$)/g, "");
                lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            } else {
                alert('Unsupported file type. Please use .txt or .docx');
                return;
            }
            if (lines.length === 0) {
                alert('No titles found in file.');
                return;
            }

            // Fuzzy match each line to song titles
            const allSongs = LyricsManager.getAllLyrics();
            const foundIds = [];
            const notFound = [];

            // Use Fuse.js for fuzzy title matching
            const fuse = new Fuse(allSongs, {
                keys: ['title'],
                threshold: 0.4, // Lower = stricter, higher = looser
            });

            lines.forEach(line => {
                const results = fuse.search(line);
                if (results.length > 0) {
                    foundIds.push(results[0].item.id); // Best match
                } else {
                    notFound.push(line);
                }
            });

            if (foundIds.length === 0) {
                alert('No matching song titles found in library.');
                return;
            }

            const setlist = SetlistsManager.addSetlist(name, foundIds);
            this.#currentSetlistId = setlist.id;
            this.#renderSetlists();

            if (notFound.length > 0) {
                alert(`Setlist imported as "${setlist.name}". Some songs not found:\n${notFound.join('\n')}`);
            } else {
                alert(`Setlist "${setlist.name}" imported successfully!`);
            }
        } catch (err) {
            alert('Failed to import setlist: ' + err.message);
        } finally {
            event.target.value = '';
        }
    }

    #handleExportSetlist() {
        if (!this.#currentSetlistId) {
            alert('Select a setlist to export!');
            return;
        }
        const setlist = SetlistsManager.getSetlistById(this.#currentSetlistId);
        if (!setlist || !setlist.songs.length) {
            alert('No songs in this setlist!');
            return;
        }
        const allSongs = LyricsManager.getAllLyrics();
        const lines = setlist.songs.map(id => {
            const song = allSongs.find(s => s.id === id);
            return song ? song.title : '';
        }).filter(Boolean);

        const txt = lines.join('\n');
        const blob = new Blob([txt], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${setlist.name}.txt`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        }, 100);
    }

    
    // --- Performance Mode Functions ---
    #renderPerformanceTab() {
        this.#renderSetlists(); // This also updates the performance setlist select
        this.#handlePerformanceSetlistChange();
    }

    #handlePerformanceSetlistChange() {
        const setlistId = this.#performanceSetlistSelect.value;
        this.#performanceSetlistId = setlistId || null;
        this.#renderPerformanceSongList();
    }

    #handlePerformanceSongSearch() {
        this.#renderPerformanceSongList();
    }

    #renderPerformanceSongList() {
        let songs = [];
        const query = this.#performanceSongSearch.value.trim();

        if (this.#performanceSetlistId) {
            const setlist = SetlistsManager.getSetlistById(this.#performanceSetlistId);
            if (setlist) {
                const allSongs = LyricsManager.getAllLyrics();
                songs = setlist.songs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
            }
        } else {
            songs = LyricsManager.getAllLyrics();
        }

        if (query) {
            songs = songs.filter(song => 
                song.title.toLowerCase().includes(query.toLowerCase()) ||
                song.lyrics.toLowerCase().includes(query.toLowerCase())
            );
        }

        this.#performanceSongList.innerHTML = songs.map(song => `
            <div class="song-item" data-id="${song.id}">
                <span>${song.title}</span>
                <button class="btn primary perform-song-btn" title="Perform This Song"><i class="fas fa-play"></i></button>
            </div>
        `).join('');
    }

    #handlePerformanceSongClick(e) {
        if (!e.target.closest('.perform-song-btn')) return;

        const songItem = e.target.closest('.song-item');
        if (!songItem) return;

        const songId = songItem.dataset.id;
        this.#startPerformanceWithSong(songId);
    }

    #handleStartPerformance() {
        if (this.#performanceSetlistId) {
            const setlist = SetlistsManager.getSetlistById(this.#performanceSetlistId);
            if (setlist && setlist.songs.length > 0) {
                this.#startPerformanceWithSong(setlist.songs[0]);
            } else {
                alert('No songs in selected setlist');
            }
        } else {
            const allSongs = LyricsManager.getAllLyrics();
            if (allSongs.length > 0) {
                this.#startPerformanceWithSong(allSongs[0].id);
            } else {
                alert('No songs available');
            }
        }
    }

    #startPerformanceWithSong(songId) {
        // Set up the performance song list
        if (this.#performanceSetlistId) {
            const setlist = SetlistsManager.getSetlistById(this.#performanceSetlistId);
            const allSongs = LyricsManager.getAllLyrics();
            this.#performanceSongs = setlist.songs.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
        } else {
            this.#performanceSongs = LyricsManager.getAllLyrics();
        }

        // Find the starting song index
        this.#currentPerformanceSongIndex = this.#performanceSongs.findIndex(s => s.id === songId);
        if (this.#currentPerformanceSongIndex === -1) {
            this.#currentPerformanceSongIndex = 0;
        }

        this.#enterPerformanceMode();
    }

    #enterPerformanceMode() {
        if (this.#performanceSongs.length === 0) return;

        this.#isPerformanceMode = true;
        this.#performanceMode.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.#displayCurrentPerformanceSong();
    }

    #exitPerformanceMode() {
        this.#isPerformanceMode = false;
        this.#performanceMode.style.display = 'none';
        document.body.style.overflow = '';
    }

    #displayCurrentPerformanceSong() {
        const song = this.#performanceSongs[this.#currentPerformanceSongIndex];
        if (!song) return;

        this.#performanceSongInfo.innerHTML = `
            <h2>${song.title}</h2>
            <p>Song ${this.#currentPerformanceSongIndex + 1} of ${this.#performanceSongs.length}</p>
        `;

        // Format lyrics with better line breaks
        const formattedLyrics = song.lyrics
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('<br><br>');

        this.#lyricsDisplay.innerHTML = formattedLyrics || '<p>No lyrics available</p>';
        
        this.#autoFitLyricsFont();

        // Update navigation buttons
        this.#prevSongBtn.style.display = this.#currentPerformanceSongIndex > 0 ? 'block' : 'none';
        this.#nextSongBtn.style.display = this.#currentPerformanceSongIndex < this.#performanceSongs.length - 1 ? 'block' : 'none';
    }

    #navigatePerformanceSong(direction) {
        const newIndex = this.#currentPerformanceSongIndex + direction;
        if (newIndex >= 0 && newIndex < this.#performanceSongs.length) {
            this.#currentPerformanceSongIndex = newIndex;
            this.#displayCurrentPerformanceSong();
        }
    }

    #handleFontSizeChange(e) {
        const fontSize = e.target.value;
        this.#lyricsDisplay.style.fontSize = fontSize + 'rem';
    }

    #handlePerformanceThemeToggle() {
        const currentTheme = document.body.dataset.theme;
        const isDark = currentTheme.includes('dark');
        
        // Toggle between dark and light variants of current theme
        if (isDark) {
            document.body.dataset.theme = currentTheme.replace('dark', 'light');
        } else {
            document.body.dataset.theme = currentTheme.replace('light', 'dark');
        }
    }

    #autoFitLyricsFont() {
        const container = this.#lyricsDisplay;
        if (!container) return;

        // Start big, shrink down until it fits
        let fontSize = 2.0; // rem
        container.style.fontSize = fontSize + 'rem';

        // Allow a little padding for header/footer
        const maxHeight = this.#performanceMode.offsetHeight - 60;

        while (container.scrollHeight > maxHeight && fontSize > 0.6) {
            fontSize -= 0.04;
            container.style.fontSize = fontSize + 'rem';
        }
    }
}

// Ensure the DOM is fully loaded before initializing the app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main application
    new App();
});
