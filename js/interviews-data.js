/* INTERVIEWS DATA - Datos del archivo de entrevistas WhiteBox
   Versión Supabase: usa Supabase Postgres en lugar de Firestore.

   Orden de datos:
   1. Supabase: supabase.from('interviews').select('*').eq('published', true)
   2. localStorage 'backstage_interviews_data' (panel oficial Backstage, modo local)
   3. localStorage 'wbox_interviews_data' (panel legado)
   4. legacyInterviews (datos historicos del sitio)

   LEGACY_INTERVIEWS: entrevistas individuales que antes se editaban como
   campos iv1, iv2 e iv3 dentro de site_content / entreE.html. Se
   conservan como fallback para no romper el sitio si Supabase y
   localStorage estan vacios.
*/

var legacyInterviewsDefault = [
    {
        id: 'iv-legacy-1',
        num: 'VOL. 01',
        category: 'PORTADA / INDIE',
        title: 'La distorsión como lenguaje',
        excerpt: 'Hablamos con las mentes creativas detrás del sonido que está sacudiendo los garajes de la ciudad...',
        cta: 'LEER ENTREVISTA',
        ctaUrl: 'articulo-entrevista.html',
        image: 'https://images.pexels.com/photos/1649691/pexels-photo-1649691.jpeg'
    },
    {
        id: 'iv-legacy-2',
        num: 'VOL. 02',
        category: 'SYNTH WAVE',
        title: 'Madame Bleu: Hija del Neón',
        excerpt: 'Un viaje íntimo a través de los sintetizadores y las letras melancólicas que definen su nuevo álbum...',
        cta: 'LEER ENTREVISTA',
        ctaUrl: '#',
        image: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'
    },
    {
        id: 'iv-legacy-3',
        num: 'VOL. 03',
        category: 'CULTURA URBANA',
        title: 'Ritmo, rima y realidad',
        excerpt: 'Dani Hache nos abre las puertas de su studio para explicarnos cómo se cocina el trap más crudo del momento...',
        cta: 'LEER ENTREVISTA',
        ctaUrl: '#',
        image: 'https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg'
    }
];

/* Datos locales y legacy */
(function() {
    var BACKSTAGE_KEY = 'backstage_interviews_data';
    var LEGACY_KEY = 'wbox_interviews_data';
    var data = null;

    try {
        var saved = localStorage.getItem(BACKSTAGE_KEY);
        if (saved) data = JSON.parse(saved);
    } catch (e) { data = null; }

    if (!data || !data.length) {
        try {
            var legacy = localStorage.getItem(LEGACY_KEY);
            if (legacy) data = JSON.parse(legacy);
        } catch (e) { data = null; }
    }

    interviewsData = (data && data.length) ? data : legacyInterviewsDefault.slice();
})();

/* Filtra y ordena el set local/legacy. Los documentos sin campo
   published (legacy) se consideran publicados por compatibilidad;
   los que tengan published false/'false' se ocultan. */
function sortPublishedInterviews(list) {
    return (list || []).filter(function(iv) {
        return iv.published !== false && iv.published !== 'false';
    }).sort(function(a, b) {
        return (a.order || 999) - (b.order || 999);
    });
}

window.WhiteBoxInterviews = window.WhiteBoxInterviews || {};
window.WhiteBoxInterviews.lastSource = null;
window.WhiteBoxInterviews.lastError = null;
window.WhiteBoxInterviews.LEGACY_INTERVIEWS = legacyInterviewsDefault;

/* Async loader: Supabase primero, luego localStorage/default */
window.WhiteBoxInterviews.loadPublished = function() {
    var sb = window.getSupabaseClient();
    if (!sb) {
        window.WhiteBoxInterviews.lastSource = 'local';
        window.WhiteBoxInterviews.lastError = 'Supabase client no disponible';
        return Promise.resolve(sortPublishedInterviews(interviewsData));
    }

    return sb.from('interviews').select('*').eq('published', true).order('order', { ascending: true }).then(function(response) {
        var items = response.data || [];
        window.WhiteBoxInterviews.lastError = null;

        if (items.length > 0) {
            items = items.map(function(item) { return { id: item.id || item._id, ...item }; });
            window.WhiteBoxInterviews.lastSource = 'supabase';
            return items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
        }

        window.WhiteBoxInterviews.lastSource = 'fallback';
        window.WhiteBoxInterviews.lastError = null;
        return sortPublishedInterviews(interviewsData);
    }).catch(function(err) {
        console.error('[WhiteBoxInterviews] Error consultando Supabase:', err);
        window.WhiteBoxInterviews.lastSource = 'fallback';
        window.WhiteBoxInterviews.lastError = err && err.message ? err.message : 'Error de Supabase';
        return sortPublishedInterviews(interviewsData);
    });

    window.WhiteBoxInterviews.lastSource = 'local';
    window.WhiteBoxInterviews.lastError = null;
    return Promise.resolve(sortPublishedInterviews(interviewsData));
};