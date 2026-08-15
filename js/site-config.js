/* ============================================
   WHITEBOX SITE — Site Config Applier (Supabase)
   Aplica la configuracion global del sitio guardada
   en Supabase (coleccion site_config) y localStorage
   'backstage_site_config'.

   Flujo:
   1. Aplica inmediatamente la config de localStorage
      (pintado rapido + modo offline).
   2. Si Supabase esta disponible, lee 'public.site_config'
      y aplica encima (fuente de verdad), refrescando
      la cache local.

   Aplica:
   - Links sociales del footer (spotify, instagram,
     tiktok, youtube, facebook).
   - Defaults SEO solo si la pagina no define los suyos
     (meta description, og:image). El <title> propio de
     cada pagina se conserva.
   ============================================ */

(function() {
    var STORAGE_KEY = 'backstage_site_config';
    var SOCIAL_MAP = {
        spotify: 'Spotify',
        instagram: 'Instagram',
        tiktok: 'TikTok',
        youtube: 'YouTube',
        facebook: 'Facebook'
    };

    function getLocalConfig() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (Array.isArray(data)) return data[0] || null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function cacheConfig(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function applySocial(config) {
        var social = config.social;
        if (!social || typeof social !== 'object') return;
        var links = document.querySelectorAll('.site-footer .social-icons a[title]');
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            var title = (link.getAttribute('title') || '').trim().toLowerCase();
            var key = null;
            Object.keys(SOCIAL_MAP).forEach(function(k) {
                if (SOCIAL_MAP[k].toLowerCase() === title) key = k;
            });
            if (!key) continue;
            var url = social[key];
            if (!url) continue;
            link.setAttribute('href', url);
            if (url.indexOf('mailto:') !== 0) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        }
    }

    function ensureMeta(attrName, attrValue, content) {
        if (!content) return;
        var selector = 'meta[' + attrName + '="' + attrValue + '"]';
        var meta = document.querySelector(selector);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attrName, attrValue);
            document.head.appendChild(meta);
        }
        if (!meta.getAttribute('content')) {
            meta.setAttribute('content', content);
        }
    }

    function applySeo(config) {
        ensureMeta('name', 'description', config.defaultSeoDescription || config.siteDescription);
        ensureMeta('property', 'og:image', config.defaultOgImage || config.logoUrl);
        if (config.defaultSeoTitle && !document.title) {
            document.title = config.defaultSeoTitle;
        }
    }

    function applyConfig(config) {
        if (!config) return;
        applySocial(config);
        applySeo(config);
    }

    function fetchRemote() {
        var sb = window.getSupabaseClient();
        if (!sb) return Promise.resolve(null);
        return sb.from('site_config').select('*').maybeSingle().then(function(response) {
            var data = response.data;
            if (!data) return null;
            cacheConfig(data);
            return data;
        }).catch(function(err) {
            console.warn('[SiteConfig] Supabase no disponible, se usa la config local', err);
            return null;
        });
    }

    function init() {
        applyConfig(getLocalConfig());
        fetchRemote().then(function(remote) {
            if (remote) applyConfig(remote);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();