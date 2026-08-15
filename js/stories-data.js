/* STORIES DATA - Datos de las historias de la comunidad
   Versión Supabase: usa Supabase Postgres en lugar de Firestore.

   Orden de datos:
   1. Supabase: supabase.from('stories').select('*').eq('status', 'published')
   2. localStorage 'backstage_stories_data' (panel oficial Backstage, modo local)
   3. localStorage 'wbox_stories_data' (panel legado)
   4. storiesDataDefault (datos por defecto)
*/

var storiesDataDefault = [
    {
        id: "story-1",
        title: "Cuando conocí a Blackpink",
        author: "Daniela Reyes",
        location: "Ciudad de México, MX",
        image: "Blackpint2.jpg",
        excerpt: "Esperé meses para ese concierto y, aun así, cuando se apagaron las luces sentí que no estaba preparada para lo que iba a vivir.",
        content: "Cuando conocí a Blackpink: Esperé meses para ese concierto y, aun así, cuando se apagaron las luces sentí que no estaba preparada para lo que iba a vivir. En cuanto sonó la primera canción y vi a Jisoo, Jennie, Rosé y Lisa salir al escenario, se me llenaron los ojos de lágrimas. Después de tantos videos y transmisiones, por fin las estaba viendo frente a mí.\n\nCanté cada canción con personas que ni siquiera conocía, pero que sentían la misma emoción que yo. Hubo momentos en los que solo me quedé observando el mar de lightsticks rosas iluminando todo el recinto. Fue una imagen que nunca voy a olvidar.\n\nEse concierto no solo me dejó fotos y videos. Me recordó lo bonito que es compartir la música con miles de personas al mismo tiempo. Desde ese día, cada vez que escucho una canción de Blackpink, vuelvo por un momento a esa noche que siempre llevaré en el corazón.",
        relatedSong: "Blackpink - Forever Young",
        status: "published",
        featured: true,
        order: 1,
        initialLikes: 124,
        date: "Octubre 2023"
    },
    {
        id: "story-2",
        title: "La noche que ensayamos en el garage y nació nuestra banda",
        author: "Tomas Aguirre",
        location: "Buenos Aires, AR",
        image: "garege.jpg",
        excerpt: "Éramos cuatro amigos que solo queríamos hacer ruido. Un garage inundado, amplificadores prestados y una batería que se tambaleaba. Fue todo lo que necesitamos.",
        content: "La noche que ensayamos en el garage y nació nuestra banda: Éramos cuatro amigos que solo queríamos hacer ruido. Un garage inundado, amplificadores prestados y una batería que se tambaleaba. Fue todo lo que necesitamos.\n\nEra invierno del 2021, estábamos todos encerrados por la pandemia y no teníamos nada que hacer. Alguien dijo \"¿por qué no ensayamos?\" y nadie dijo que no. Armamos los equipos en el garage de Martín, en Villa Crespo. No había silla para todos, el techo goteaba y el bajo hacía un ruido que no era del todo musical.\n\nPero algo mágico pasó esa noche. Las canciones salieron solas. No éramos buenos técnicamente, pero había una energía cruda que hacía que todo sonara real. Martín grabó todo con el celular y esa misma noche subimos dos temas a SoundCloud.\n\nA la mañana siguiente teníamos 200 reproducciones. Hoy somos Los Carport y tenemos un EP que nos grabamos nosotros mismos. Todo empezó con cuatro pendejos y un garage mojado. La música no necesita permiso para existir.",
        relatedSong: "Los Carport - Garage Sessions",
        status: "published",
        featured: false,
        order: 2,
        initialLikes: 87,
        date: "Agosto 2021"
    },
    {
        id: "story-3",
        title: "La tienda de vinilos que cambió la forma en que escucho música",
        author: "Kenji Watanabe",
        location: "Tokyo, JP",
        image: "tienda.jpg",
        excerpt: "Entré a Disk Union en Shimokitazawa buscando un regalo. Tres horas después salí con una nueva comprensión de lo que el sonido realmente significa.",
        content: "La tienda de vinilos que cambió la forma en que escucho música: Entré a Disk Union en Shimokitazawa buscando un regalo. Tres horas después salí con una nueva comprensión de lo que el sonido realmente significa. El dueño, un hombre mayor llamado Tanaka-san, me notó Henceforth dealing with discs without direction.\n\nSe acercó y sin decir una palabra sacó una edición de un disco de jazz japonés de 1978 que nunca había escuchado. Lo puso en la tornamesa de la tienda y subió el volumen. Toda la tienda en silencio. Era crudo, imperfecto y hermoso.\n\nEse momento me enseñó que la música independiente no es solo un género. Es una filosofía. Se trata de encontrar belleza en las cosas que no están pulidas para el consumo masivo. Desde entonces colecciono vinilos y ahora dirijo un fanzine digital dedicado a la música underground japonesa. Todo porque un desconocido decidió compartir un disco conmigo.",
        relatedSong: "Naniwa Jazz Collective - Twilight in Osaka",
        status: "published",
        featured: false,
        order: 3,
        initialLikes: 63,
        date: "Noviembre 2022"
    },
    {
        id: "story-4",
        title: "El festival donde perdí el miedo a cantar frente a la gente",
        author: "Carla Domínguez",
        location: "Barcelona, ES",
        image: "fest.jpg",
        excerpt: "Nunca había cantado en público. Tenía tanto miedo que una semana antes dejé de dormir. Pero subí al escenario y lo que pasó después lo cambió todo.",
        content: "El festival donde perdí el miedo a cantar frente a la gente: Nunca había cantado en público. Tenía tanto miedo que una semana antes dejé de dormir. Pero subí al escenario y lo que pasó después lo cambió todo.\n\nEra un festival pequeño en un pueblo costero de Cataluña. No había más de 200 personas, pero para mí era el Madison Square Garden. Mi amiga Laura me había inscrito sin decirme y cuando lo supe ya estaba demasiado tarde para cancelar.\n\nSubí al escenario con las manos temblando. Empecé a cantar la primera nota y cerré los ojos. Cuando los abrí, vi a la primera fila: un hombre mayor moviéndose con la música, una pareja abrazada, una niña bailando descalza. Nadie me estaba juzgando. Todos simplemente estaban sintiendo.\n\nTerminé la canción y el silencio duró un segundo que me pareció una eternidad. Luego vino la ovación. Me derrumbé de emoción backstage. Laura me abrazó y me dijo \"¿ves? Siempre pudiste.\" Desde ese día toco en bares pequeños cada fin de semana. No busco ser famosa. Solo quiero volver a sentir eso.",
        relatedSong: "Vera Blue - Private",
        status: "published",
        featured: false,
        order: 4,
        initialLikes: 102,
        date: "Julio 2023"
    }
];

/* Suponemos que el panel escribe en una tabla 'stories' de Supabase.
   Si no hay conexión a Supabase, cae a localStorage / defaults. */

(function() {
    var BACKSTAGE_KEY = 'backstage_stories_data';
    var LEGACY_KEY = 'wbox_stories_data';
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
    storiesData = (data && data.length) ? data : storiesDataDefault;
})();

/* Async loader: tries Supabase first, falls back to localStorage/default */
window.WhiteBoxStories = window.WhiteBoxStories || {};
window.WhiteBoxStories.lastSource = null;
window.WhiteBoxStories.lastError = null;

function whiteBoxStoriesGetLocal() {
    return (window.storiesData || storiesDataDefault || [])
        .filter(function(s) { return s.status === 'published'; })
        .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
}

window.WhiteBoxStories.loadPublished = function() {
    var sb = window.getSupabaseClient();
    if (!sb) {
        window.WhiteBoxStories.lastSource = 'local';
        window.WhiteBoxStories.lastError = 'Supabase client no disponible';
        return Promise.resolve(whiteBoxStoriesGetLocal());
    }

    return sb.from('stories').select('*').eq('status', 'published').order('order', { ascending: true }).then(function(response) {
        var items = response.data || [];
        window.WhiteBoxStories.lastSource = 'supabase';
        window.WhiteBoxStories.lastError = null;

        if (items.length > 0) {
            // Asegurar que todos tengan id
            items = items.map(function(item) { return { id: item.id || item.slug || item._id, ...item }; });
            return items.sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
        }

        window.WhiteBoxStories.lastSource = 'fallback';
        window.WhiteBoxStories.lastError = null;
        return whiteBoxStoriesGetLocal();
    }).catch(function(err) {
        console.error('[WhiteBoxStories] Error consultando Supabase:', err);
        window.WhiteBoxStories.lastSource = 'fallback';
        window.WhiteBoxStories.lastError = err && err.message ? err.message : 'Error de Supabase';
        return whiteBoxStoriesGetLocal();
    });
    window.WhiteBoxStories.lastSource = 'local';
    window.WhiteBoxStories.lastError = null;
    return Promise.resolve(whiteBoxStoriesGetLocal());
};