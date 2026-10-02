/* ARTISTS DATA - Datos de la seccion "Descubre" (WhiteBox)
   Version Supabase: usa Supabase Postgres en lugar de Firestore.

   Orden de datos:
   1. Supabase: supabase.from('artists').select('*').eq('published', true)
   2. localStorage 'backstage_artists_data' (panel oficial Backstage, modo local)
   3. legacyArtistsDefault (datos historicos que estaban fijos en el HTML)

   LEGACY_ARTISTS: los artistas que antes vivian hardcodeados en
   descubre.html. Se conservan como fallback para no romper la pagina
   si Supabase y localStorage estan vacios.
*/

var legacyArtistsDefault = [
    {
        id: 'ar-legacy-1',
        name: 'Zoe',
        image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
        tags: ['SYNTH POP', 'DARKWAVE', 'GRAN CANARIA'],
        link: '',
        published: true,
        featured: false,
        order: 1
    },
    {
        id: 'ar-legacy-2',
        name: 'The Last Internationale',
        image: 'https://images.pexels.com/photos/1644613/pexels-photo-1644613.jpeg',
        tags: ['INDIE ROCK', 'ALTERNATIVE', 'BARCELONA'],
        link: '',
        published: true,
        featured: false,
        order: 2
    },
    {
        id: 'ar-legacy-3',
        name: 'Sia',
        image: 'https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg',
        tags: ['URBAN', 'TRAP', 'MADRID'],
        link: '',
        published: true,
        featured: false,
        order: 3
    },
    {
        id: 'ar-legacy-4',
        name: 'WhiteBox Live',
        image: 'https://images.pexels.com/photos/210922/pexels-photo-210922.jpeg',
        tags: ['SESSIONS', 'LONDON'],
        link: '',
        published: true,
        featured: false,
        order: 4
    }
];

/* Datos locales y legacy */
(function() {
    var BACKSTAGE_KEY = 'backstage_artists_data';
    var data = null;

    try {
        var saved = localStorage.getItem(BACKSTAGE_KEY);
        if (saved) data = JSON.parse(saved);
    } catch (e) { data = null; }

    artistsData = (data && data.length) ? data : legacyArtistsDefault.slice();
})();

/* Filtra y ordena el set local/legacy. Los documentos sin campo
   published (legacy) se consideran publicados por compatibilidad;
   los que tengan published false/'false' se ocultan. */
function sortPublishedArtists(list) {
    return (list || []).filter(function(artist) {
        return artist.published !== false && artist.published !== 'false';
    }).sort(function(a, b) {
        return (a.order || 999) - (b.order || 999);
    });
}

window.WhiteBoxArtists = window.WhiteBoxArtists || {};
window.WhiteBoxArtists.lastSource = null;
window.WhiteBoxArtists.lastError = null;
window.WhiteBoxArtists.LEGACY_ARTISTS = legacyArtistsDefault;

/* Async loader: Supabase primero, luego localStorage/default */
window.WhiteBoxArtists.loadPublished = function() {
    var sb = window.getSupabaseClient();
    if (!sb) {
        window.WhiteBoxArtists.lastSource = 'local';
        window.WhiteBoxArtists.lastError = 'Supabase client no disponible';
        return Promise.resolve(sortPublishedArtists(artistsData));
    }

    return sb.from('artists').select('*').eq('published', true).order('order', { ascending: true }).then(function(response) {
        var items = response.data || [];
        window.WhiteBoxArtists.lastError = null;

        if (items.length > 0) {
            items = items.map(function(item) { return { id: item.id || item._id, ...item }; });
            window.WhiteBoxArtists.lastSource = 'supabase';
            return items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
        }

        window.WhiteBoxArtists.lastSource = 'fallback';
        return sortPublishedArtists(artistsData);
    }).catch(function(err) {
        /* Si la tabla 'artists' aun no existe en Supabase, el panel
           y el sitio siguen funcionando con los datos legacy. */
        console.warn('[WhiteBoxArtists] No se pudo consultar Supabase, se usan los datos locales:', err);
        window.WhiteBoxArtists.lastSource = 'fallback';
        window.WhiteBoxArtists.lastError = err && err.message ? err.message : 'Error de Supabase';
        return sortPublishedArtists(artistsData);
    });
};

/* Busca por nombre y tags, que es lo que promete el placeholder
   "BUSCAR ARTISTA, GENERO O CIUDAD". */
window.WhiteBoxArtists.filter = function(list, query) {
    var q = (query || '').toLowerCase().trim();
    if (!q) return (list || []).slice();

    return (list || []).filter(function(artist) {
        if ((artist.name || '').toLowerCase().indexOf(q) !== -1) return true;
        var tags = artist.tags || [];
        for (var i = 0; i < tags.length; i++) {
            if (String(tags[i]).toLowerCase().indexOf(q) !== -1) return true;
        }
        return false;
    });
};
