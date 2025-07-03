// lyricsManager.js

function normalizeTitle(filename) {
    let name = filename.replace(/\.[^/.]+$/, '');
    name = name.replace(/[_\-]+/g, ' ');
    name = name.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
    name = name.replace(/\b([A-Z])\s(?=[A-Z]\b)/g, '$1');
    name = name.replace(/\s+/g, ' ').trim();
    name = name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return name;
}

const lyricsManager = (() => {
    let lyricFiles = new Map();
    let fuseIndex = null;
    const DB_KEY = 'lyricFiles';

    function load() {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            lyricFiles = new Map(arr.map(obj => [obj.id, obj]));
        }
        rebuildFuseIndex();
    }

    function save() {
        localStorage.setItem(DB_KEY, JSON.stringify(Array.from(lyricFiles.values())));
    }

    function addLyricFile(fileObj) {
        if (Array.isArray(fileObj)) {
            fileObj.forEach(addLyricFile);
            return;
        }
        fileObj.title = normalizeTitle(fileObj.title);
        lyricFiles.set(fileObj.id, fileObj);
        save();
        rebuildFuseIndex();
    }

    function removeLyric(id) {
        lyricFiles.delete(id);
        save();
        rebuildFuseIndex();
    }

    function renameLyric(id, newTitle) {
        if (lyricFiles.has(id)) {
            lyricFiles.get(id).title = normalizeTitle(newTitle);
            save();
            rebuildFuseIndex();
        }
    }

    function editLyric(id, newLyrics) {
        if (lyricFiles.has(id)) {
            lyricFiles.get(id).lyrics = newLyrics;
            save();
        }
    }

    function getLyricById(id) {
        return lyricFiles.get(id) || null;
    }

    function getAllLyrics() {
        return Array.from(lyricFiles.values());
    }

    function searchLyrics(query) {
        if (!fuseIndex) rebuildFuseIndex();
        if (!query || !query.trim()) return getAllLyrics();
        return fuseIndex.search(query).map(res => res.item);
    }

    function rebuildFuseIndex() {
        fuseIndex = new Fuse(getAllLyrics(), {
            keys: ['title'],
            threshold: 0.4,
        });
    }

    async function bulkUpload(files) {
        const results = [];
        for (const file of files) {
            const result = {
                fileName: file.name,
                status: 'success',
                error: null,
                lyric: null
            };

            try {
                const ext = file.name.split('.').pop().toLowerCase();
                if (!['txt', 'docx'].includes(ext)) {
                    throw new Error('Unsupported file type');
                }

                let content = '';
                let fileType = ext;
                let title = file.name.replace(/\.[^/.]+$/, '');

                if (ext === 'txt') {
                    content = await file.text();
                } else if (ext === 'docx') {
                    const docResult = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
                    content = docResult.value.replace(/<\/?[^>]+(>|$)/g, ""); // Strip tags
                }

                const lyric = {
                    id: crypto.randomUUID(),
                    title,
                    lyrics: content,
                    fileType
                };

                result.lyric = lyric;
                results.push(result);
                addLyricFile(lyric);

            } catch (error) {
                result.status = 'error';
                result.error = error.message || 'Failed to process file';
                results.push(result);
            }
        }
        return results;
    }

    function exportLibrary() {
        return JSON.stringify(getAllLyrics(), null, 2);
    }

    function importLibrary(jsonStr) {
        const arr = JSON.parse(jsonStr);
        lyricFiles = new Map(arr.map(obj => [obj.id, { ...obj, title: normalizeTitle(obj.title) }]));
        save();
        rebuildFuseIndex();
    }

    load();

    return {
        addLyricFile,
        removeLyric,
        renameLyric,
        editLyric,
        getLyricById,
        getAllLyrics,
        searchLyrics,
        bulkUpload,
        exportLibrary,
        importLibrary,
        rebuildFuseIndex,
        load,
        save,
    };
})();

window.lyricsManager = lyricsManager;

