/* ============================================
   WHITEBOX MUSIC — Supabase Config
   Reemplaza firebase-config.js para usar Supabase.

   Inicializa el cliente Supabase desde CDN.
   ============================================ */

(function() {
    window.WhiteBoxSupabase = {
        client: null,
        initialized: false
    };

    function init() {
        if (window.WhiteBoxSupabase.initialized) return;
        
        // ✅ Cambia estos valores por tu proyecto Supabase
        //
        // La key es la "publishable key" (prefijo sb_publishable_), que
        // es el formato nuevo de Supabase y reemplaza al viejo JWT
        // de anon. Mismo rol y mismos permisos: sirve para leer y para
        // escribir solo lo que las policies de RLS permitan.
        // NO es una service_role key: esa si se salta RLS y jamas
        // debe ir en el cliente.
        const SUPABASE_URL = 'https://vtodlxjfbzzexgpcjajj.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_FIcB3IgkXxM1mKh1a2OzsQ_caM7UEO9';

        if (!window.supabase) {
            // Cargar SDK dinámicamente si no está disponible
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = function() {
                window.WhiteBoxSupabase.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                window.WhiteBoxSupabase.initialized = true;
            };
            document.head.appendChild(script);
        } else {
            window.WhiteBoxSupabase.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.WhiteBoxSupabase.initialized = true;
        }
    }

    // Exportar para que los módulos puedan usarlo
    window.getSupabaseClient = function() {
        init();
        return window.WhiteBoxSupabase.client;
    };
})();