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
        const SUPABASE_URL = 'https://vtodlxjfbzzexgpcjajj.supabase.co';
        const SUPABASE_ANON_KEY ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0b2RseGpmYnp6ZXhncGNqYWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NTE1NzYsImV4cCI6MjEwMjMyNzU3Nn0.yxgsIbtmppXLkkynfAR0ZN6-HD00-ZVgRN8dOA8Vi-o';

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