/* ============================================
   WHITEBOX SITE — Site Content Applier
   Aplica el contenido guardado desde Backstage
   a cada pagina del sitio.

   Flujo:
   1. Detecta que pagina es (por nombre de archivo o [data-page])
   2. Lee localStorage 'backstage_site_content' (la misma clave
      que usa el panel en modo local; Firestore se sincroniza
      al localStorage desde el panel).
   3. Por cada campo del schema, si hay un valor guardado,
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
        var stored = getStorage();
        if (!stored) return;

        var applied = applyPage(page, stored);

        document.dispatchEvent(new CustomEvent(CONTENT_EVENT, {
            detail: { pageId: pageId, applied: applied }
        }));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
