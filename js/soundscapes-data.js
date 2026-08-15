/* SOUNDSCAPES DATA - Latest Soundscapes - WhiteBox Music
   Versión Supabase: usa Supabase Postgres en lugar de Firestore.

   Orden de datos:
   1. Supabase: supabase.from('soundscapes').select('*').eq('published', true)
   2. localStorage 'backstage_soundscapes_data' (panel oficial Backstage, modo local)
   3. localStorage 'wbox_soundscapes_data' (panel legado)
   4. soundscapesDataDefault (datos por defecto)
*/

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

/* Datos locales y legacy */
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

/* Cargador async: intenta Supabase primero, luego localStorage/defaults */
window.WhiteBoxSoundscapes = window.WhiteBoxSoundscapes || {};
window.WhiteBoxSoundscapes.lastSource = null;
window.WhiteBoxSoundscapes.lastError = null;

function whiteBoxSoundscapesGetLocal() {
    return (window.soundscapesData || soundscapesDataDefault || [])
        .filter(function(s) { return s.published === true || s.published === 'true'; })
        .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
}

window.WhiteBoxSoundscapes.loadPublished = function() {
    var sb = window.getSupabaseClient();
    if (!sb) {
        window.WhiteBoxSoundscapes.lastSource = 'local';
        window.WhiteBoxSoundscapes.lastError = 'Supabase client no disponible';
        return Promise.resolve(whiteBoxSoundscapesGetLocal());
    }

    return sb.from('soundscapes').select('*').eq('published', true).order('order', { ascending: true }).then(function(response) {
        var items = response.data || [];
        window.WhiteBoxSoundscapes.lastSource = 'supabase';
        window.WhiteBoxSoundscapes.lastError = null;

        if (items.length > 0) {
            items = items.map(function(item) { return { id: item.id || item._id, ...item }; });
            return items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
        }

        window.WhiteBoxSoundscapes.lastSource = 'fallback';
        window.WhiteBoxSoundscapes.lastError = null;
        return whiteBoxSoundscapesGetLocal();
    }).catch(function(err) {
        console.error('[WhiteBoxSoundscapes] Error consultando Supabase:', err);
        window.WhiteBoxSoundscapes.lastSource = 'fallback';
        window.WhiteBoxSoundscapes.lastError = err && err.message ? err.message : 'Error de Supabase';
        return whiteBoxSoundscapesGetLocal();
    });
    window.WhiteBoxSoundscapes.lastSource = 'local';
    window.WhiteBoxSoundscapes.lastError = null;
    return Promise.resolve(whiteBoxSoundscapesGetLocal());
};