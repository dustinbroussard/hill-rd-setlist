// ==== SETLIST MANAGER MODULE 
function normalizeSetlistName(name) {
    return name.replace(/\.[^/.]+$/, '')  // Remove file extension
        .replace(/[_\-]+/g, ' ')
        .replace(/[^\\w\\s]/g, '')
        .replace(/\\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\\b\\w/g, c => c.toUpperCase());
}

const SetlistsManager = (() => {
    let setlists = new Map();
    const DB_KEY = 'setlists';

    function load() {
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                setlists = new Map(arr.map(obj => [obj.id, obj]));
            }
        } catch (error) {
            setlists = new Map();
        }
    }

    function save() {
        localStorage.setItem(DB_KEY, JSON.stringify(Array.from(setlists.values())));
    }

    function getAllSetlists() {
        return Array.from(setlists.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    function getSetlistById(id) {
        return setlists.get(id) || null;
    }

    function addSetlist(name, songIds = []) {
        const normalized = normalizeSetlistName(name);
        // Check for duplicate names
        const existing = Array.from(setlists.values()).find(s => 
            s.name.toLowerCase() === normalized.toLowerCase()
        );
        let finalName = normalized;
        if (existing) {
            let counter = 1;
            while (Array.from(setlists.values()).find(s => 
                s.name.toLowerCase() === `${normalized} (${counter})`.toLowerCase()
            )) { counter++; }
            finalName = `${normalized} (${counter})`;
        }
        const setlist = {
            id: (Date.now().toString() + Math.random().toString(16).slice(2)), 
            name: finalName,
            songs: [...songIds],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setlists.set(setlist.id, setlist);
        save();
        return setlist;
    }

    function renameSetlist(id, newName) {
        const setlist = setlists.get(id);
        if (setlist) {
            const normalized = normalizeSetlistName(newName);
            // Check for duplicate names (excluding current setlist)
            const existing = Array.from(setlists.values()).find(s => 
                s.id !== id && s.name.toLowerCase() === normalized.toLowerCase()
            );
            if (existing) throw new Error(`A setlist named "${normalized}" already exists`);
            setlist.name = normalized;
            setlist.updatedAt = Date.now();
            save();
            return setlist;
        }
        return null;
    }

    function duplicateSetlist(id) {
        const orig = getSetlistById(id);
        if (orig) return addSetlist(orig.name + ' Copy', orig.songs);
        return null;
    }

    function deleteSetlist(id) {
        const deleted = setlists.delete(id);
        if (deleted) save();
        return deleted;
    }

    function updateSetlistSongs(id, songIds) {
        const setlist = setlists.get(id);
        if (setlist) {
            setlist.songs = [...songIds];
            setlist.updatedAt = Date.now();
            save();
            return setlist;
        }
        return null;
    }

    function addSongToSetlist(setlistId, songId) {
        const setlist = setlists.get(setlistId);
        if (setlist && !setlist.songs.includes(songId)) {
            setlist.songs.push(songId);
            setlist.updatedAt = Date.now();
            save();
            return setlist;
        }
        return null;
    }

    function removeSongFromSetlist(setlistId, songId) {
        const setlist = setlists.get(setlistId);
        if (setlist) {
            const index = setlist.songs.indexOf(songId);
            if (index > -1) {
                setlist.songs.splice(index, 1);
                setlist.updatedAt = Date.now();
                save();
                return setlist;
            }
        }
        return null;
    }

    function moveSongInSetlist(setlistId, songId, direction) {
        const setlist = setlists.get(setlistId);
        if (!setlist) return null;
        const currentIndex = setlist.songs.indexOf(songId);
        if (currentIndex === -1) return null;
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= setlist.songs.length) return null;
        [setlist.songs[currentIndex], setlist.songs[newIndex]] = 
        [setlist.songs[newIndex], setlist.songs[currentIndex]];
        setlist.updatedAt = Date.now();
        save();
        return setlist;
    }

    // Used for text import (one song per line)
	function importSetlistFromText(name, text, allSongs) {
	    const titles = text.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0);
	    const songIds = [];
	    const notFound = [];
	    // Set up Fuse.js with fuzzy config
	    const fuse = new Fuse(allSongs, {
		keys: ['title'],
		threshold: 0.4, // Lower is stricter, higher is looser. 0.3-0.4 is usually good.
		includeScore: true,
	    });
	    for (const title of titles) {
		const results = fuse.search(title);
		if (results.length && results[0].score <= 0.5) {
		    // Good enough match, take it
		    const found = results[0].item;
		    songIds.push(found.id);
		} else {
		    notFound.push(title);
		}
	    }
	    const setlist = addSetlist(name, songIds);
	    return { setlist, imported: songIds.length, notFound };
	}

    // Export setlist to json, txt, or csv
    function exportSetlist(setlistId, allSongs, format = 'json') {
        const setlist = getSetlistById(setlistId);
        if (!setlist) return null;
        const songs = setlist.songs
            .map(songId => allSongs.find(s => s.id === songId))
            .filter(song => song !== undefined);
        switch (format) {
            case 'json':
                return JSON.stringify({ setlist, songs }, null, 2);
            case 'txt':
                return songs.map(song => song.title).join('\\n');
            case 'csv':
                const header = 'Title,Lyrics\\n';
                const rows = songs.map(song => 
                    `"${song.title.replace(/"/g, '""')}","${song.lyrics.replace(/"/g, '""')}"`
                ).join('\\n');
                return header + rows;
            default:
                return null;
        }
    }

    // Loads setlists from storage on startup
    load();

    return {
        getAllSetlists,
        getSetlistById,
        addSetlist,
        renameSetlist,
        duplicateSetlist,
        deleteSetlist,
        updateSetlistSongs,
        addSongToSetlist,
        removeSongFromSetlist,
        moveSongInSetlist,
        importSetlistFromText,
        exportSetlist,
        load,
        save,
    };
})();

// Removed the global normalizeTitle function to avoid confusion and redundancy.
// function normalizeTitle(filename) {
//     let title = filename.replace(/\\.[^/.]+$/, ''); // Remove extension
//     title = title.replace(/[_\\-]+/g, ' ');        // Underscore/dash to space
//     title = title.replace(/\\s+/g, ' ').trim();    // Remove double spaces/trim
//     title = title.replace(/([a-z])([A-Z])/g, '$1 $2'); // Split camel
//     // Title Case
//     title = title.replace(/\\w\\S*/g, (w) =>
//         w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
//     );
//     return title;
// }

document.addEventListener('DOMContentLoaded', () => {
    const app = {
    	normalizeTitle(title) {
	    // Remove extension, spaces, make Title Case
	    let t = title.replace(/\.[^/.]+$/, '');
	    t = t.replace(/[_\-]+/g, ' ');
	    t = t.replace(/\s+/g, ' ').trim();
	    t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
	    // Title Case
	    t = t.replace(/\w\S*/g, (w) =>
		w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
	    );
	    return t;
	},

	isDuplicateTitle(title) {
	    const normalized = title.trim().toLowerCase();
	    return this.songs.some(song => song.title.trim().toLowerCase() === normalized);
	},

        // DOM Elements
        themeSelect: document.getElementById('theme-select'),
        navButtons: document.querySelectorAll('.nav-button'),
        tabs: document.querySelectorAll('.tab'),
        songList: document.getElementById('song-list'),
        addSongBtn: document.getElementById('add-song-btn'),
        deleteAllSongsBtn: document.getElementById('delete-all-songs-btn'),
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

        // Tab Toolbars
        tabToolbars: {
            songs: `
                <input type="text" id="song-search-input" class="search-input" placeholder="Search songs...">
                <button id="add-song-btn" class="btn"><i class="fas fa-plus"></i> Add Song</button>
                <button id="delete-all-songs-btn" class="btn danger"><i class="fas fa-trash"></i> Delete All</button>
                <label for="song-upload-input" class="btn"><i class="fas fa-upload"></i> Upload</label>
                <input type="file" id="song-upload-input" multiple accept=".txt,.docx" class="hidden-file">
            `,
            setlists: `
                <select id="setlist-select" class="setlist-select"></select>
                <button id="new-setlist-btn" class="btn" title="New Setlist"><i class="fas fa-plus"></i></button>
                <button id="rename-setlist-btn" class="btn" title="Rename"><i class="fas fa-pen"></i></button>
                <button id="duplicate-setlist-btn" class="btn" title="Duplicate"><i class="fas fa-copy"></i></button>
                <button id="delete-setlist-btn" class="btn danger" title="Delete"><i class="fas fa-trash"></i></button>
                <button id="import-setlist-btn" class="btn" title="Import"><i class="fas fa-file-import"></i></button>
                <button id="export-setlist-btn" class="btn" title="Export"><i class="fas fa-file-export"></i></button>
                <input type="file" id="import-setlist-file" accept=".txt,.docx" class="hidden-file">
            `,
            performance: `
                <select id="performance-setlist-select" class="setlist-select"></select>
                <input type="text" id="performance-song-search" class="search-input" placeholder="Find any song...">
                <button id="start-performance-btn" class="btn primary"><i class="fas fa-play"></i> Start</button>
            `
        },

        // State
        songs: [],
        currentSongId: null,
        currentSetlistId: null,
        performanceSetlistId: null,
        performanceSongs: [],
        currentPerformanceSongIndex: 0,
        isPerformanceMode: false,
        modalMode: null,
        sortableSetlist: null,
        lastPerformance: null,
	autoScrollTimer: null,
	autoScrollSpeed: Number(localStorage.getItem('autoscrollSpeed')) || 1, // <-- loads saved value or defaults to 1
	autoScrollActive: false,

        // Render the toolbar for the given tab and attach event listeners
        renderToolbar(tab) {
            const toolbarDiv = document.getElementById('tab-toolbar');
            if (!toolbarDiv) return;
            toolbarDiv.innerHTML = this.tabToolbars[tab] || '';

            // Re-query/attach event listeners for the new toolbar elements
            if (tab === 'songs') {
                this.songSearchInput = document.getElementById('song-search-input');
                this.addSongBtn = document.getElementById('add-song-btn');
                this.deleteAllSongsBtn = document.getElementById('delete-all-songs-btn');
                this.songUploadInput = document.getElementById('song-upload-input');

                this.songSearchInput.addEventListener('input', () => this.renderSongs());
                this.addSongBtn.addEventListener('click', () => this.openSongModal());
                this.deleteAllSongsBtn.addEventListener('click', () => {
                    if (confirm('Delete ALL songs? This cannot be undone!')) {
                        this.songs = [];
                        this.saveData();
                        this.renderSongs();
                    }
                });
                this.songUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
            } else if (tab === 'setlists') {
                this.setlistSelect = document.getElementById('setlist-select');
                this.newSetlistBtn = document.getElementById('new-setlist-btn');
                this.renameSetlistBtn = document.getElementById('rename-setlist-btn');
                this.duplicateSetlistBtn = document.getElementById('duplicate-setlist-btn');
                this.deleteSetlistBtn = document.getElementById('delete-setlist-btn');
                // ... (rest for setlist: see the original setupEventListeners for these)
                this.setlistSelect.addEventListener('change', (e) => this.handleSetlistSelectChange(e));
                this.newSetlistBtn.addEventListener('click', () => this.openSetlistModal());
                this.renameSetlistBtn.addEventListener('click', () => this.openSetlistModal('rename'));
                this.duplicateSetlistBtn.addEventListener('click', () => this.handleDuplicateSetlist());
                this.deleteSetlistBtn.addEventListener('click', () => this.handleDeleteSetlist());
                document.getElementById('import-setlist-btn').addEventListener('click', () => {
                    document.getElementById('import-setlist-file').click();
                });
                document.getElementById('export-setlist-btn').addEventListener('click', () => {
                    if (!this.currentSetlistId) {
                        alert("No setlist selected!");
                        return;
                    }
                    const format = prompt("Export format? (json/txt/csv)", "json");
                    if (!format) return;
                    const content = SetlistsManager.exportSetlist(
                        this.currentSetlistId,
                        this.songs,
                        format.trim().toLowerCase()
                    );
                    if (content) {
                        let ext = format === "csv" ? "csv" : format === "txt" ? "txt" : "json";
                        const setlist = SetlistsManager.getSetlistById(this.currentSetlistId);
                        const name = setlist ? setlist.name.replace(/\s+/g, "_") : "setlist";
                        downloadFile(`${name}.${ext}`, content,
                            ext === "json" ? "application/json" : ext === "csv" ? "text/csv" : "text/plain"
                        );
                    } else {
                        alert("Export failed.");
                    }
                });
                document.getElementById('import-setlist-file').addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        let text = event.target.result;
                        let setlistName = prompt("Setlist name?", file.name.replace(/\.[^/.]+$/, ''));
                        if (!setlistName) return;
                        if (file.name.endsWith('.docx')) {
                            mammoth.extractRawText({ arrayBuffer: event.target.result })
                                .then(result => {
                                    text = result.value;
                                    finishImportSetlist(setlistName, text);
                                });
                        } else {
                            finishImportSetlist(setlistName, text);
                        }
                    };
                    if (file.name.endsWith('.docx')) {
                        reader.readAsArrayBuffer(file);
                    } else {
                        reader.readAsText(file);
                    }
                    e.target.value = '';
                });
            } else if (tab === 'performance') {
                this.performanceSetlistSelect = document.getElementById('performance-setlist-select');
                this.performanceSongSearch = document.getElementById('performance-song-search');
                this.startPerformanceBtn = document.getElementById('start-performance-btn');
                this.performanceSetlistSelect.addEventListener('change', () => this.handlePerformanceSetlistChange());
                this.performanceSongSearch.addEventListener('input', () => this.handlePerformanceSongSearch());
                this.startPerformanceBtn.addEventListener('click', () => this.handleStartPerformance());
            }
        },

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
	    const theme = localStorage.getItem('theme') || 'default-dark';
	    document.body.dataset.theme = theme;
	},


        saveData() {
            localStorage.setItem('songs', JSON.stringify(this.songs));
        },

        // --- Lyrics Management ---
        getAllLyrics() {
            return this.songs;
        },

        getLyricById(id) {
            return this.songs.find(song => song.id === id);
        },

        // Removed the duplicate isDuplicateTitle definition from here.
        // isDuplicateTitle(title) {
        //     const normalized = title.trim().toLowerCase();
        //     return this.songs.some(song => song.title.trim().toLowerCase() === normalized);
        // },

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
            this.addSongBtn.addEventListener('click', () => this.openSongModal());
            this.saveSongBtn.addEventListener('click', () => this.saveSong());
            this.cancelSongBtn.addEventListener('click', () => this.closeSongModal());
            this.songSearchInput.addEventListener('input', () => this.renderSongs());
            this.songUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
	    this.deleteAllSongsBtn.addEventListener('click', () => {
        if (confirm('Delete ALL songs? This cannot be undone!')) {
            this.songs = [];
            this.saveData();
            this.renderSongs();
         }
    });

	// === TAB NAVIGATION (Copy and paste this in setupEventListeners) ===
	    this.navButtons.forEach(btn => {
	        btn.addEventListener('click', () => {
		    // Remove 'active' class from all tabs and nav buttons
		    this.tabs.forEach(tab => tab.classList.remove('active'));
		    this.navButtons.forEach(b => b.classList.remove('active'));
		    // Add 'active' class to the clicked nav button and related tab
		    btn.classList.add('active');
		    const tabName = btn.getAttribute('data-tab');
		    document.getElementById(tabName).classList.add('active');
		    // If you want, trigger a re-render here for each tab
		    if (tabName === 'songs') this.renderSongs();
		    if (tabName === 'setlists') this.renderSetlists();
		    if (tabName === 'performance') this.renderPerformanceTab();
	        });
	    });


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
	    this.fontSizeSlider.addEventListener('input', (e) => {
	    // Save font size per song if in performance mode
	        if (this.isPerformanceMode && this.performanceSongs && this.performanceSongs[this.currentPerformanceSongIndex]) {
		    const songId = this.performanceSongs[this.currentPerformanceSongIndex].id;	
		    localStorage.setItem('fontSize_' + songId, e.target.value);
	        }
	        this.handleFontSizeChange(e);
	        this.autoFitLyricsFont();
	    });

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
	    const title = this.normalizeTitle(this.songTitleInput.value.trim());
	    const lyrics = this.songLyricsInput.value.trim();
	    if (!title) return;

	    if (this.currentSongId) {
		const song = this.songs.find(s => s.id === this.currentSongId);
		song.title = title;
		song.lyrics = lyrics;
	    } else {
		if (this.isDuplicateTitle(title)) {
		    this.closeSongModal(); // Silently ignore
		    return;
		}
		this.songs.push({
		    id: Date.now().toString(),
		    title,
		    lyrics,
		});
	    }
	    this.saveData();
	    this.renderSongs();
	    this.closeSongModal();
	},


        deleteSong(id) {
            if (confirm('Are you sure you want to delete this song?')) {
                this.removeLyric(id);
                // Also remove from setlists via SetlistsManager
                SetlistsManager.getAllSetlists().forEach(s => {
                    SetlistsManager.removeSongFromSetlist(s.id, id);
                });
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
                        const title = this.normalizeTitle(file.name);
                        if (this.isDuplicateTitle(title)) return;
                        const lyrics = result.value;
                        this.songs.push({ id: Date.now().toString(), title, lyrics });
                        this.saveData();
                        this.renderSongs();
                    });
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = (e) => {
                const title = this.normalizeTitle(file.name);
                if (this.isDuplicateTitle(title)) return;
                const lyrics = e.target.result;
                this.songs.push({ id: Date.now().toString(), title, lyrics });
                this.saveData();
                this.renderSongs();
            };
            reader.readAsText(file);
        }
    }
},

updateTabToolbar(tab) {
    const toolbar = document.querySelector('.tab-toolbar');
    if (!toolbar) return;
    if (tab === 'songs') {
        toolbar.innerHTML = `
            <input class="search-input" type="text" placeholder="Search songs...">
            <button class="btn" id="add-song-btn">+ Add Song</button>
            <button class="btn danger" id="delete-all-btn">Delete All</button>
            <button class="btn" id="upload-btn">Upload</button>
        `;
        // Add event listeners if needed (see below)
    } else if (tab === 'setlists') {
        toolbar.innerHTML = `
            <select class="setlist-select"></select>
            <button class="btn" id="add-setlist-btn">+ Add Setlist</button>
            <button class="btn" id="delete-setlist-btn">Delete Setlist</button>
            <!-- ...etc... -->
        `;
    } else if (tab === 'lyrics') {
        toolbar.innerHTML = '';
        // Or add specific lyrics tools if you want
    }
    // You may need to (re)attach event listeners to the new buttons here
},


        // === SETLIST MANAGEMENT (WIRED TO SetlistsManager) ===
        renderSetlists() {
            // Always load from SetlistsManager
            const setlists = SetlistsManager.getAllSetlists();
            this.setlistSelect.innerHTML = '<option value="">Select a setlist...</option>';
            this.performanceSetlistSelect.innerHTML = '<option value="">All Songs</option>';

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
	    const setlist = SetlistsManager.getSetlistById(this.currentSetlistId);
	    const allSongs = this.songs;

	    if (!setlist) {
		this.availableSongsContainer.innerHTML = '<p>No setlist selected</p>';
		this.currentSetlistSongsContainer.innerHTML = '<p>No setlist selected</p>';
		return;
	    }

	    // Available songs
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

	    // <<<<<< THIS CODE BLOCK IS INSIDE THE FUNCTION >>>>>>
	    // Enable touch-friendly drag-and-drop sorting for setlist songs
	    if (this.sortableSetlist) {
		this.sortableSetlist.destroy();
	    }
	    this.sortableSetlist = Sortable.create(this.currentSetlistSongsContainer, {
		animation: 150,
		handle: '.drag-handle',
		ghostClass: 'drag-ghost',
		delay: 0, // no long-press delay for touch
		touchStartThreshold: 2,
		onEnd: (evt) => {
		    // Update the song order in the setlist based on new DOM order
		    const newOrder = Array.from(this.currentSetlistSongsContainer.querySelectorAll('.song-item')).map(item => item.dataset.id);
		    SetlistsManager.updateSetlistSongs(this.currentSetlistId, newOrder);
		    this.renderSetlistSongs();
		}
	    });
	},

        openSetlistModal(mode = 'add') {
            this.modalMode = mode;
            if (mode === 'rename' && this.currentSetlistId) {
                const setlist = SetlistsManager.getSetlistById(this.currentSetlistId);
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

            try {
                if (this.modalMode === 'rename' && this.currentSetlistId) {
                    SetlistsManager.renameSetlist(this.currentSetlistId, name);
                } else {
                    const setlist = SetlistsManager.addSetlist(name, []);
                    this.currentSetlistId = setlist.id;
                }
            } catch (err) {
                alert(err.message || 'Could not save setlist.');
                return;
            }
            this.renderSetlists();
            this.closeSetlistModal();
        },

        handleDuplicateSetlist() {
            if (!this.currentSetlistId) return;
            const newSetlist = SetlistsManager.duplicateSetlist(this.currentSetlistId);
            if (newSetlist) {
                this.currentSetlistId = newSetlist.id;
                this.renderSetlists();
            }
        },

        handleDeleteSetlist() {
            if (!this.currentSetlistId) return;
            if (confirm('Delete this setlist?')) {
                SetlistsManager.deleteSetlist(this.currentSetlistId);
                this.currentSetlistId = null;
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
            SetlistsManager.addSongToSetlist(this.currentSetlistId, id);
            this.renderSetlistSongs();
        },

        handleCurrentSetlistSongsClick(e) {
            const songItem = e.target.closest('.song-item');
            if (!songItem || !this.currentSetlistId) return;
            const id = songItem.dataset.id;
            if (e.target.closest('.remove-from-setlist-btn')) {
                SetlistsManager.removeSongFromSetlist(this.currentSetlistId, id);
                this.renderSetlistSongs();
            } else if (e.target.closest('.move-up-btn')) {
                SetlistsManager.moveSongInSetlist(this.currentSetlistId, id, -1);
                this.renderSetlistSongs();
            } else if (e.target.closest('.move-down-btn')) {
                SetlistsManager.moveSongInSetlist(this.currentSetlistId, id, 1);
                this.renderSetlistSongs();
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
                const setlist = SetlistsManager.getSetlistById(this.performanceSetlistId);
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
                const setlist = SetlistsManager.getSetlistById(this.performanceSetlistId);
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
                const setlist = SetlistsManager.getSetlistById(this.performanceSetlistId);
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
	    localStorage.removeItem('lastPerformance'); // <-- THIS LINE
	    this.displayCurrentPerformanceSong();
	},

       exitPerformanceMode() {
	    this.isPerformanceMode = false;
	    this.performanceMode.style.display = 'none';
	    document.body.style.overflow = '';
	    document.getElementById('autoscroll-delay-modal').style.display = 'none';
	    // Save state for resume
	    const perf = {
		setlistId: this.performanceSetlistId || null,
		songIndex: this.currentPerformanceSongIndex,
		timestamp: Date.now()
	    };
	    localStorage.setItem('lastPerformance', JSON.stringify(perf));
	},


        displayCurrentPerformanceSong() {
	    const song = this.performanceSongs[this.currentPerformanceSongIndex];
	    if (!song) return;
	    // Restore saved font size for this song if present
	    const savedSize = localStorage.getItem('fontSize_' + song.id);
	    if (savedSize) {
	        this.fontSizeSlider.value = savedSize;
	    }

            this.autoFitLyricsFont();

	    // Split lyrics into lines
	let lines = song.lyrics.split('\n').map(line => line.trim());

	// Remove duplicate title in the first two *non-blank* lines (case-insensitive)
	const normTitle = song.title.trim().toLowerCase();
	let removed = 0;
	const fuse = new Fuse([normTitle], { threshold: 0.2 });
	while (
	  lines.length &&
	  removed < 2
	) {
	  if (lines[0] === '' || lines[0] === null || lines[0] === undefined) {
	    // Blank line, remove and do not count
	    lines.shift();
	  } else if (lines[0].toLowerCase() === normTitle) {
	    // Exact match to title, remove and count as one removal
	    lines.shift();
	    removed++;
	  } else {
	    // Not blank and not title—stop checking
	    break;
	  }
	}

	    // Set header title and progress
	    const songNumber = this.currentPerformanceSongIndex + 1;
	    const totalSongs = this.performanceSongs.length;
	    this.performanceSongInfo.innerHTML = `
	      <h2>${song.title}</h2>
	      <div class="song-progress">${songNumber} / ${totalSongs}</div>
	    `;
	    

	    // Put the lyrics in the display, preserving lines and stanza breaks
	    this.lyricsDisplay.textContent = lines.join('\n');

	    // Run autofit after a tiny delay
	    setTimeout(() => this.autoFitLyricsFont(), 30);

	    // Update navigation buttons
	    this.prevSongBtn.style.display = this.currentPerformanceSongIndex > 0 ? 'block' : 'none';
	    this.nextSongBtn.style.display = this.currentPerformanceSongIndex < this.performanceSongs.length - 1 ? 'block' : 'none';
	    this.stopAutoScroll();
	    this.updateAutoScrollButton();
	    const btn = document.getElementById('auto-scroll-btn');
	    if (btn) btn.blur();
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
	  this.autoFitLyricsFont();
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
	    const overlay = this.performanceMode;
	    if (!container || !overlay || overlay.style.display !== 'flex') return;

	    setTimeout(() => {
		let slider = this.fontSizeSlider;
		let minRem = slider ? parseFloat(slider.value) : 1.5;
		if (isNaN(minRem) || minRem < 0.8) minRem = 1.5;

		// Compute available height
		const header = overlay.querySelector('.performance-header');
		const headerHeight = header ? header.offsetHeight : 0;
		const cs = getComputedStyle(container);
		const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
		const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
		const fudge = 16;
		const maxHeight = overlay.offsetHeight - headerHeight - paddingY - borderY - fudge;

		// Start at slider's value and grow until just before overflow
		let fontRem = minRem;
		container.style.transition = "none";
		container.style.fontSize = `${fontRem}rem`;

		while (container.scrollHeight <= maxHeight && fontRem < 8.0) {
		    fontRem += 0.04; // small increments for precision
		    container.style.fontSize = `${fontRem}rem`;
		}
		// Step back if we overshot
		if (container.scrollHeight > maxHeight) {
		    fontRem -= 0.04;
		    container.style.fontSize = `${fontRem}rem`;
		}

		// Never shrink below slider’s value!
		if (fontRem < minRem) {
		    fontRem = minRem;
		    container.style.fontSize = `${fontRem}rem`;
		}

		// Don't update slider—user controls that
		container.style.transition = "font-size 0.18s cubic-bezier(.8,0,.2,1)";
		setTimeout(() => container.style.transition = "", 220);
		container.scrollTop = 0;
	    }, 30);
	},

	startAutoScroll() {
	    this.stopAutoScroll();
	    const container = this.lyricsDisplay;
	    if (!container) return;
	    if (container.scrollHeight <= container.clientHeight) return; // No overflow, no scroll needed

	    this.autoScrollActive = true;

	    // Wait user-selected seconds before starting to scroll
	    this.autoScrollDelayTimer = setTimeout(() => {
		this.autoScrollTimer = setInterval(() => {
		    if (!this.autoScrollActive) return;
		    // If at bottom, stop scrolling
		    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
		        this.stopAutoScroll();
		        return;
		    }
		    container.scrollTop += this.autoScrollSpeed;
		}, 50); // Every 50ms (adjust speed above)
	    }, (this.autoscrollDelay || 0) * 1000);
	},

	
	stopAutoScroll() {
	    this.autoScrollActive = false;
	    if (this.autoScrollTimer) {
		clearInterval(this.autoScrollTimer);
		this.autoScrollTimer = null;
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
	    // Change button icon/text to reflect state
	    const btn = document.getElementById('auto-scroll-btn');
	    if (!btn) return;
	    if (this.autoScrollActive) {
		btn.innerHTML = '<i class="fas fa-pause"></i>';
		btn.title = 'Pause Autoscroll';
	    } else {
		btn.innerHTML = '<i class="fas fa-angle-double-down"></i>';
		btn.title = 'Start Autoscroll';
	    }
	},

	autoscrollDelay: Number(localStorage.getItem('autoscrollDelay')) || 3,


    }; // <--- END OF APP OBJECT

    app.init();
    
    const scrollBtn = document.getElementById('scroll-to-top-btn');
    const lyricsContainer = document.getElementById('lyrics-display');
    const perfMode = document.getElementById('performance-mode');

    // Only show the scroll-to-top button in performance mode AND when scrolled down
    function updateScrollBtnVisibility() {
      const perfModeActive = perfMode.style.display === 'flex';
      if (perfModeActive && lyricsContainer.scrollTop > 2) {
        scrollBtn.classList.remove('invisible');
      } else {
        scrollBtn.classList.add('invisible');
      }
    }

    lyricsContainer.addEventListener('scroll', updateScrollBtnVisibility);

    // Also update when you enter performance mode or when a new song is loaded
    const origDisplayCurrentPerformanceSong = app.displayCurrentPerformanceSong.bind(app);
    app.displayCurrentPerformanceSong = function(...args) {
     origDisplayCurrentPerformanceSong(...args); 
     updateScrollBtnVisibility();
    };

	// Click handler to jump to top
    scrollBtn.addEventListener('click', () => {
      lyricsContainer.scrollTo({ top: 0, behavior: 'smooth' });
      scrollBtn.style.display = 'none';
    });

// ==== RESUME LAST PERFORMANCE PROMPT ====

// Run after app.init();
    const lastPerfRaw = localStorage.getItem('lastPerformance');
    let lastPerf = null;
    if (lastPerfRaw) {
       try { lastPerf = JSON.parse(lastPerfRaw); } catch (e) {}
    }

    if (lastPerf && window.location.hash.includes('performance')) {
        // Only prompt if on performance tab
        setTimeout(() => {
            if (confirm("Resume last performance?\\n(Setlist: " + 
               (lastPerf.setlistId ? (SetlistsManager.getSetlistById(lastPerf.setlistId)?.name || "Unknown Setlist") : "All Songs") + 
                ", Song #" + (lastPerf.songIndex + 1) + ")")) {
                // Jump straight to performance mode at saved position
                app.performanceSetlistId = lastPerf.setlistId;
                app.startPerformanceWithSong(
                    app.performanceSetlistId ?
                        SetlistsManager.getSetlistById(app.performanceSetlistId).songs[lastPerf.songIndex] :
                        app.songs[lastPerf.songIndex]?.id
                );
            }
        }, 350); // Let DOM settle
    }

// === AUTO SCROLL BUTTON HANDLERS ===
setTimeout(() => {
    const btn = document.getElementById('auto-scroll-btn');
    if (btn) {
        btn.addEventListener('click', () => app.toggleAutoScroll());
    }
    // Optional: stop autoscroll on touch or mouse
    app.lyricsDisplay?.addEventListener('touchstart', () => app.stopAutoScroll());
    app.lyricsDisplay?.addEventListener('mousedown', () => app.stopAutoScroll());
}, 500); // Wait a bit for DOM

    // ==== PERFORMANCE MODE TOUCH SWIPE (Lyrics left/right navigation) ====
    // Make sure this runs AFTER everything is loaded
//    const perfMode = document.getElementById('performance-mode');
//    let touchStartX = 0;
//    let touchEndX = 0;

    // Listen for touch events on the performance overlay
//    perfMode.addEventListener('touchstart', function(e) {
//        if (e.touches.length !== 1) return;
//        touchStartX = e.touches[0].clientX;
//    }, { passive: true });
//
//    perfMode.addEventListener('touchmove', function(e) {
//        if (e.touches.length !== 1) return;
//        touchEndX = e.touches[0].clientX;
//    }, { passive: true });
//
//    perfMode.addEventListener('touchend', function(e) {
        // Only react if in performance mode and a swipe happened
//        if (!app.isPerformanceMode) return;
//        const diffX = touchEndX - touchStartX;
//        if (Math.abs(diffX) > 60) { // Threshold in px
//            if (diffX < 0) {
                // Swiped left, go to next song
//                app.navigatePerformanceSong(1);
//            } else {
                // Swiped right, go to previous song
//                app.navigatePerformanceSong(-1);
//            }
//        }
//        touchStartX = 0;
//        touchEndX = 0;
//    });

    // ==== SETLIST IMPORT/EXPORT HOOKS ====
    
    // Open modal
	document.getElementById('autoscroll-delay-btn').addEventListener('click', function() {
	  document.getElementById('autoscroll-delay-modal').style.display = 'block';
	  // Delay
	  const slider = document.getElementById('autoscroll-delay-slider');
	  const valSpan = document.getElementById('autoscroll-delay-value');
	  slider.value = app.autoscrollDelay || 3;
	  valSpan.textContent = slider.value + 's';
	  // Speed
	  const speedSlider = document.getElementById('autoscroll-speed-slider');
	  const speedVal = document.getElementById('autoscroll-speed-value');
	  speedSlider.value = app.autoScrollSpeed || 1;
	  speedVal.textContent = speedSlider.value;
	});

	// Live update label
	document.getElementById('autoscroll-delay-slider').addEventListener('input', function(e) {
	  document.getElementById('autoscroll-delay-value').textContent = e.target.value + 's';
	});

	document.getElementById('autoscroll-speed-slider').addEventListener('input', function(e) {
	  document.getElementById('autoscroll-speed-value').textContent = e.target.value;
	});

	// Save value and close
	document.getElementById('close-autoscroll-delay-modal').addEventListener('click', function() {
	  // Delay
	  const slider = document.getElementById('autoscroll-delay-slider');
	  app.autoscrollDelay = Number(slider.value);
	  localStorage.setItem('autoscrollDelay', app.autoscrollDelay);
	  // Speed
	  const speedSlider = document.getElementById('autoscroll-speed-slider');
	  app.autoScrollSpeed = Number(speedSlider.value);
	  localStorage.setItem('autoscrollSpeed', app.autoScrollSpeed);
	  document.getElementById('autoscroll-delay-modal').style.display = 'none';
	});

    document.getElementById('theme-icon-btn').addEventListener('click', function() {
      document.getElementById('theme-modal').style.display = 'block';
    });

    document.getElementById('close-theme-modal').addEventListener('click', function() {
      document.getElementById('theme-modal').style.display = 'none';
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const theme = btn.getAttribute('data-theme');
        document.body.dataset.theme = theme;
        localStorage.setItem('theme', theme);
        document.getElementById('theme-modal').style.display = 'none';
      });
    });


    // Helper for downloading a file in browser
    function downloadFile(filename, content, mime = "text/plain") {
        const blob = new Blob([content], { type: mime });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        }, 150);
    }

    // EXPORT current setlist
    document.getElementById('export-setlist-btn').addEventListener('click', () => {
        if (!app.currentSetlistId) {
            alert("No setlist selected!");
            return;
        }
	const format = prompt("Export format? (json/txt/csv)", "json");
	if (!format) return; // If user cancels, do nothing!
        const content = SetlistsManager.exportSetlist(
            app.currentSetlistId,
            app.songs,
            format.trim().toLowerCase()
        );
        if (content) {
            let ext = format === "csv" ? "csv" : format === "txt" ? "txt" : "json";
            const setlist = SetlistsManager.getSetlistById(app.currentSetlistId);
            const name = setlist ? setlist.name.replace(/\\s+/g, "_") : "setlist";
            downloadFile(`${name}.${ext}`, content,
                ext === "json" ? "application/json" : ext === "csv" ? "text/csv" : "text/plain"
            );
        } else {
            alert("Export failed.");
        }
    });

    // IMPORT setlist from .txt
    document.getElementById('import-setlist-btn').addEventListener('click', () => {
        document.getElementById('import-setlist-file').click();
    });

    document.getElementById('import-setlist-file').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (event) {
            let text = event.target.result;
            let setlistName = prompt("Setlist name?", file.name.replace(/\\.[^/.]+$/, ''));
            if (!setlistName) return;
            // Try to extract as plain text if .docx
            if (file.name.endsWith('.docx')) {
                // Use mammoth to extract text (assumes it's loaded already)
                mammoth.extractRawText({ arrayBuffer: event.target.result })
                    .then(result => {
                        text = result.value;
                        finishImportSetlist(setlistName, text);
                    });
            } else {
                finishImportSetlist(setlistName, text);
            }
        };
        if (file.name.endsWith('.docx')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
        e.target.value = '';
    });

    function finishImportSetlist(name, text) {
        const result = SetlistsManager.importSetlistFromText(name, text, app.songs);
        if (result) {
            app.currentSetlistId = result.setlist.id;
            app.renderSetlists();
            alert(`Imported: ${result.imported} songs.\\nNot found: ${result.notFound.length ? result.notFound.join(', ') : 'None'}`);
        } else {
            alert("Import failed.");
        }
    }
});
