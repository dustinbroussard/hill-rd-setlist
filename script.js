
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

        // State
        songs: [],
        setlists: [],
        currentSongId: null,
        currentSetlistId: null,

        init() {
            this.loadData();
            this.setupEventListeners();
            this.renderSongs();
            this.renderSetlists();
        },

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
        },

        renderSongs() {
            const query = this.songSearchInput.value.toLowerCase();
            const filteredSongs = this.songs.filter(song => song.title.toLowerCase().includes(query));
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
                const song = this.songs.find(s => s.id === id);
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
            const title = this.songTitleInput.value.trim();
            const lyrics = this.songLyricsInput.value.trim();
            if (!title) return;

            if (this.currentSongId) {
                const song = this.songs.find(s => s.id === this.currentSongId);
                song.title = title;
                song.lyrics = lyrics;
            } else {
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
                this.songs = this.songs.filter(s => s.id !== id);
                // Also remove from setlists
                this.setlists.forEach(setlist => {
                    setlist.songs = setlist.songs.filter(songId => songId !== id);
                });
                this.saveData();
                this.renderSongs();
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
                                const title = file.name.replace('.docx', '');
                                const lyrics = result.value;
                                this.songs.push({ id: Date.now().toString(), title, lyrics });
                                this.saveData();
                                this.renderSongs();
                            });
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    reader.onload = (e) => {
                        const title = file.name.replace('.txt', '');
                        const lyrics = e.target.result;
                        this.songs.push({ id: Date.now().toString(), title, lyrics });
                        this.saveData();
                        this.renderSongs();
                    };
                    reader.readAsText(file);
                }
            }
        },

        // Dummy methods for setlist and performance, to be implemented
        renderSetlists() {
            console.log('Rendering setlists...');
        }
    };

    app.init();
});
