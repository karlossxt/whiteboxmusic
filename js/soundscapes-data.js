/* SOUNDSCAPES DATA - Latest Soundscapes - WhiteBox Music */

var soundscapesDataDefault = [
    {
        id: "cobra-geese",
        title: "Cobra",
        artist: "Geese",
        cover: "https://placehold.co/400x400/1a1a1a/ffffff?text=Cobra",
        spotifyUrl: "https://open.spotify.com/track/7qOBKhD1a54OvLvVee2tGf",
        playlist: "Fresh Indie Rock",
        duration: 185,
        published: true,
        order: 1
    },
    {
        id: "toyota-camry-radio-free-alice",
        title: "Toyota Camry",
        artist: "Radio Free Alice",
        cover: "https://placehold.co/400x400/1a1a1a/ffffff?text=Toyota+Camry",
        spotifyUrl: "https://open.spotify.com/track/1QdrlnWDAjaAR4KeWMu3Zj",
        playlist: "Fresh Indie Rock",
        duration: 191,
        published: true,
        order: 2
    },
    {
        id: "mirar-atras-la-plata",
        title: "mirar atrás",
        artist: "La Plata",
        cover: "https://placehold.co/400x400/1a1a1a/ffffff?text=Interzona",
        spotifyUrl: "https://open.spotify.com/album/00OzolR84dt2rwKPOEQ0Tg",
        playlist: "Indie & Rock Underground en Español",
        duration: 176,
        published: true,
        order: 3
    },
    {
        id: "royal-raceway-glitch-kingdom",
        title: "Royal Raceway",
        artist: "Glitch Kingdom",
        cover: "https://placehold.co/400x400/1a1a1a/ffffff?text=Royal+Raceway",
        spotifyUrl: "https://open.spotify.com/album/3wzvmWP6QKNoHh6kq8Qv90",
        playlist: "Underground Indie & Alternative",
        duration: 200,
        published: true,
        order: 4
    },
    {
        id: "excuses-margot-sinclair",
        title: "Excuses",
        artist: "Margot Sinclair",
        cover: "https://placehold.co/400x400/1a1a1a/ffffff?text=Excuses",
        spotifyUrl: "https://open.spotify.com/track/7gGBmsMCpY1pSzuU5Mc9Cz",
        playlist: "NEW Indie & Alternative",
        duration: 210,
        published: true,
        order: 5
    }
];

(function() {
    var BACKSTAGE_KEY = 'backstage_soundscapes_data';
    var LEGACY_KEY = 'wbox_soundscapes_data';
    var data = null;
    try {
        var saved = localStorage.getItem(BACKSTAGE_KEY);
        if (saved) { data = JSON.parse(saved); }
    } catch (e) { data = null; }
    if (!data || !data.length) {
        try {
            var legacy = localStorage.getItem(LEGACY_KEY);
            if (legacy) { data = JSON.parse(legacy); }
        } catch (e) { data = null; }
    }
    soundscapesData = (data && data.length) ? data : soundscapesDataDefault;
})();

/* Async loader: tries Firestore first, falls back to localStorage/default */
window.WhiteBoxSoundscapes = window.WhiteBoxSoundscapes || {};
window.WhiteBoxSoundscapes.lastSource = null;
window.WhiteBoxSoundscapes.lastError = null;

window.WhiteBoxSoundscapes.loadPublished = function() {
    var wbf = window.WhiteBoxFirebase;
    if (wbf && wbf.db) {
        return wbf.db.collection('soundscapes')
            .where('published', '==', true)
            .get()
            .then(function(snapshot) {
                var items = [];
                snapshot.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    items.push(d);
                });

                window.WhiteBoxSoundscapes.lastError = null;

                if (items.length > 0) {
                    window.WhiteBoxSoundscapes.lastSource = 'firestore';
                    return items.sort(function(a, b) {
                        return (a.order || 999) - (b.order || 999);
                    });
                }

                window.WhiteBoxSoundscapes.lastSource = 'fallback';
                window.WhiteBoxSoundscapes.lastError = null;
                return soundscapesData
                    .filter(function(s) { return s.published === true || s.published === 'true'; })
                    .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
            })
            .catch(function(err) {
                window.WhiteBoxSoundscapes.lastSource = 'fallback';
                window.WhiteBoxSoundscapes.lastError = err && err.message ? err.message : 'Error de Firestore';
                return soundscapesData
                    .filter(function(s) { return s.published === true || s.published === 'true'; })
                    .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
            });
    }
    window.WhiteBoxSoundscapes.lastSource = 'local';
    window.WhiteBoxSoundscapes.lastError = null;
    return Promise.resolve(
        soundscapesData
            .filter(function(s) { return s.published === true || s.published === 'true'; })
            .sort(function(a, b) { return (a.order || 999) - (b.order || 999); })
    );
};
