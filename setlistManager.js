// setlistsManager.js - Complete version with all missing logic

function normalizeSetlistName(name) {
    return name.replace(/\.[^/.]+$/, '')  // Remove file extension
        .replace(/[_\-]+/g, ' ')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
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
            console.error('Error loading setlists:', error);
            setlists = new Map();
        }
    }

    function save() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(Array.from(setlists.values())));
        } catch (error) {
            console.error('Error saving setlists:', error);
        }
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
            )) {
                counter++;
            }
            finalName = `${normalized} (${counter})`;
        }

        const setlist = {
            id: crypto.randomUUID(),
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
            
            if (existing) {
                throw new Error(`A setlist named "${normalized}" already exists`);
            }
            
            setlist.name = normalized;
            setlist.updatedAt = Date.now();
            save();
            return setlist;
        }
        return null;
    }

    function duplicateSetlist(id) {
        const orig = getSetlistById(id);
        if (orig) {
            return addSetlist(orig.name + ' Copy', orig.songs);
        }
        return null;
    }

    function deleteSetlist(id) {
        const deleted = setlists.delete(id);
        if (deleted) {
            save();
        }
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

        // Swap the songs
        [setlist.songs[currentIndex], setlist.songs[newIndex]] = 
        [setlist.songs[newIndex], setlist.songs[currentIndex]];
        
        setlist.updatedAt = Date.now();
        save();
        return setlist;
    }

    function getSetlistSongs(setlistId, lyricsManager) {
        const setlist = getSetlistById(setlistId);
        if (!setlist) return [];

        return setlist.songs
            .map(songId => lyricsManager.getLyricById(songId))
            .filter(song => song !== null);
    }

    function getAvailableSongs(setlistId, lyricsManager) {
        const setlist = getSetlistById(setlistId);
        const allSongs = lyricsManager.getAllLyrics();
        
        if (!setlist) return allSongs;
        
        return allSongs.filter(song => !setlist.songs.includes(song.id));
    }

    // Clean up setlists when songs are deleted
    function cleanupDeletedSongs(deletedSongIds) {
        let changed = false;
        
        for (const setlist of setlists.values()) {
            const originalLength = setlist.songs.length;
            setlist.songs = setlist.songs.filter(songId => !deletedSongIds.includes(songId));
            
            if (setlist.songs.length !== originalLength) {
                setlist.updatedAt = Date.now();
                changed = true;
            }
        }
        
        if (changed) {
            save();
        }
        
        return changed;
    }

    // For .txt upload (each line = song title)
    function importSetlistFromText(name, text, lyricsManager) {
        const titles = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
            
        const allSongs = lyricsManager.getAllLyrics();
        const songIds = [];
        const notFound = [];
        
        for (const title of titles) {
            const normalizedTitle = normalizeSetlistName(title);
            const found = allSongs.find(s => 
                s.title.toLowerCase() === normalizedTitle.toLowerCase()
            );
            
            if (found) {
                songIds.push(found.id);
            } else {
                notFound.push(title);
            }
        }
        
        const setlist = addSetlist(name, songIds);
        
        return {
            setlist,
            imported: songIds.length,
            notFound: notFound
        };
    }

    // Clear all setlists (used when deleting all songs)
    function clearAllSetlists() {
        setlists.clear();
        save();
    }

    // Export setlist to various formats
    function exportSetlist(setlistId, lyricsManager, format = 'json') {
        const setlist = getSetlistById(setlistId);
        if (!setlist) return null;

        const songs = getSetlistSongs(setlistId, lyricsManager);

        switch (format) {
            case 'json':
                return JSON.stringify({
                    setlist: setlist,
                    songs: songs
                }, null, 2);
                
            case 'txt':
                return songs.map(song => song.title).join('\n');
                
            case 'csv':
                const header = 'Title,Lyrics\n';
                const rows = songs.map(song => 
                    `"${song.title.replace(/"/g, '""')}","${song.lyrics.replace(/"/g, '""')}"`
                ).join('\n');
                return header + rows;
                
            default:
                return null;
        }
    }

    // Get setlist statistics
    function getSetlistStats(setlistId, lyricsManager) {
        const setlist = getSetlistById(setlistId);
        if (!setlist) return null;

        const songs = getSetlistSongs(setlistId, lyricsManager);
        const totalLyrics = songs.reduce((total, song) => total + song.lyrics.length, 0);
        const avgLyricsLength = songs.length > 0 ? Math.round(totalLyrics / songs.length) : 0;

        return {
            name: setlist.name,
            songCount: songs.length,
            totalCharacters: totalLyrics,
            averageCharactersPerSong: avgLyricsLength,
            createdAt: setlist.createdAt,
            updatedAt: setlist.updatedAt
        };
    }

    // Initialize
    load();

    return {
        // Core CRUD
        getAllSetlists,
        getSetlistById,
        addSetlist,
        renameSetlist,
        duplicateSetlist,
        deleteSetlist,
        
        // Song management within setlists
        updateSetlistSongs,
        addSongToSetlist,
        removeSongFromSetlist,
        moveSongInSetlist,
        
        // Helper functions
        getSetlistSongs,
        getAvailableSongs,
        cleanupDeletedSongs,
        clearAllSetlists,
        
        // Import/Export
        importSetlistFromText,
        exportSetlist,
        
        // Stats
        getSetlistStats,
        
        // Storage
        load,
        save
    };
})();

window.SetlistsManager = SetlistsManager;
