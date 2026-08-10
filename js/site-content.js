/* ============================================
   WHITEBOX SITE — Site Content Applier
   Aplica el contenido guardado desde Backstage
   a cada pagina del sitio.

   Flujo:
   1. Detecta que pagina es (por nombre de archivo o [data-page])
   2. Aplica inmediatamente el contenido de localStorage
      'backstage_site_content' (pintado rapido + modo offline).
   3. Intenta cargar 'site_content' desde Firestore (fuente
      de verdad). Si hay contenido remoto, lo aplica encima
      y refresca la cache local.
   4. Por cada campo del schema, si hay un valor guardado,
      lo aplica al selector segun su tipo (apply).
   ============================================ */

(function() {
    var STORAGE_KEY = 'backstage_site_content';
    var CONTENT_EVENT = 'site:content-applied';

    function getStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);

            /* Formato actual: array de { id, fields, updatedAt } */
            if (Array.isArray(data)) {
                var map = {};
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    if (item && item.id && item.fields) {
                        map[item.id] = item.fields;
                    }
                }
                return map;
            }
            /* Formato legacy: objeto { pageId: { key: value } } */
            return data;
        } catch (e) {
            console.warn('[SiteContent] No se pudo leer contenido guardado', e);
            return null;
        }
    }

    /* Fuente de verdad: Cloud Firestore. La coleccion 'site_content'
       usa como id el pageId y como data { fields, updatedAt }.
       Devuelve un mapa { pageId: { key: value } } o null si falla. */
    function getFirestoreContent() {
        var wbf = window.WhiteBoxFirebase;
        if (!wbf || !wbf.db) {
            return Promise.resolve(null);
        }

        return wbf.db.collection('site_content').get().then(function(snapshot) {
            var map = {};
            snapshot.forEach(function(doc) {
                var data = doc.data();
                if (data && data.fields) {
                    map[doc.id] = data.fields;
                }
            });
            if (Object.keys(map).length > 0) {
                cacheRemoteContent(map);
            }
            return map;
        }).catch(function(err) {
            console.warn('[SiteContent] Firestore no disponible, se usa el contenido local', err);
            return null;
        });
    }

    /* Cache local del contenido remoto para pintado rapido y
       navegacion sin conexion. No reemplaza el flujo del panel. */
    function cacheRemoteContent(map) {
        try {
            var array = [];
            var keys = Object.keys(map);
            for (var i = 0; i < keys.length; i++) {
                array.push({ id: keys[i], fields: map[keys[i]], updatedAt: Date.now() });
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
        } catch (e) {
            console.warn('[SiteContent] No se pudo cachear el contenido remoto', e);
        }
    }

    function detectPageId() {
        var schema = window.WhiteBoxSiteSchema;
        if (!schema) return null;

        var bodyPage = document.body ? document.body.getAttribute('data-page') : null;
        if (bodyPage && schema.getById(bodyPage)) return bodyPage;

        var name = location.pathname.split('/').pop();
        if (!name) name = 'index.html';
        var page = schema.getByFile(name);
        return page ? page.id : null;
    }

    function setHtml(el, value) {
        el.innerHTML = value;
    }

    function setText(el, value) {
        el.textContent = value;
    }

    function setSrc(el, value) {
        el.setAttribute('src', value);
    }

    function setHref(el, value) {
        el.setAttribute('href', value);
    }

    function setPlaceholder(el, value) {
        el.setAttribute('placeholder', value);
    }

    function setBackground(el, value) {
        el.style.backgroundImage = "url('" + value.replace(/'/g, "\\'") + "')";
    }

    function setMailto(el, value) {
        el.setAttribute('href', 'mailto:' + value);
    }

    function setList(els, value) {
        if (!els.length) return;
        var lines = String(value).split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
        if (!lines.length) return;

        var parent = els[0].parentNode;
        var template = els[0].cloneNode(true);

        while (parent.firstChild) parent.removeChild(parent.firstChild);

        for (var i = 0; i < lines.length; i++) {
            var node = template.cloneNode(true);
            node.textContent = lines[i];
            parent.appendChild(node);
        }
    }

    function applyField(field, value) {
        var els;
        try {
            els = document.querySelectorAll(field.selector);
        } catch (e) {
            console.warn('[SiteContent] Selector invalido: ' + field.selector, e);
            return;
        }
        if (!els.length) return;

        switch (field.apply) {
            case 'html': for (var i = 0; i < els.length; i++) setHtml(els[i], value); break;
            case 'src': for (var j = 0; j < els.length; j++) setSrc(els[j], value); break;
            case 'href': for (var k = 0; k < els.length; k++) setHref(els[k], value); break;
            case 'placeholder': for (var m = 0; m < els.length; m++) setPlaceholder(els[m], value); break;
            case 'background': for (var n = 0; n < els.length; n++) setBackground(els[n], value); break;
            case 'mailto': for (var p = 0; p < els.length; p++) setMailto(els[p], value); break;
            case 'list': setList(Array.prototype.slice.call(els), value); break;
            default: for (var q = 0; q < els.length; q++) setText(els[q], value); break;
        }
    }

    function applyPage(page, stored) {
        var pageData = stored[page.id];
        if (!pageData) return false;

        var applied = 0;
        for (var i = 0; i < page.fields.length; i++) {
            var field = page.fields[i];
            if (!Object.prototype.hasOwnProperty.call(pageData, field.key)) continue;
            var value = pageData[field.key];
            if (value === null || value === undefined) continue;
            applyField(field, value);
            applied++;
        }
        return applied > 0;
    }

    function init() {
        var schema = window.WhiteBoxSiteSchema;
        if (!schema) {
            console.warn('[SiteContent] WhiteBoxSiteSchema no disponible');
            return;
        }
        var pageId = detectPageId();
        if (!pageId) {
            console.warn('[SiteContent] Pagina no reconocida por el schema');
            return;
        }
        var page = schema.getById(pageId);

        function finish(remoteMap, appliedLocal) {
            var applied = appliedLocal;
            if (remoteMap && Object.keys(remoteMap).length > 0) {
                applied = applyPage(page, remoteMap);
            }

            document.dispatchEvent(new CustomEvent(CONTENT_EVENT, {
                detail: { pageId: pageId, applied: applied }
            }));
        }

        /* Pintado rapido con la cache local */
        var stored = getStorage();
        var appliedLocal = stored ? applyPage(page, stored) : false;

        /* Fuente de verdad: Firestore aplica encima si hay contenido */
        getFirestoreContent().then(function(remoteMap) {
            finish(remoteMap, appliedLocal);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
