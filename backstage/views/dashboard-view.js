/* ============================================
   BACKSTAGE STUDIO — Dashboard View
   Renderiza el dashboard con métricas, contenido reciente
   y simulador celular (vista previa del sitio).
   No conoce servicios ni datos.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Views = window.Backstage.Views || {};

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function safeImageUrl(url) {
        if (!url || typeof url !== 'string') return '';
        var trimmed = url.trim();
        if (!trimmed) return '';
        var lower = trimmed.toLowerCase();
        if (lower.indexOf('javascript:') === 0) return '';
        if (lower.indexOf('data:text/html') === 0) return '';
        return trimmed;
    }

    function tagClassFor(category) {
        var cat = (category || '').toLowerCase();
        if (cat.indexOf('historia') !== -1 || cat === 'historia') return 'tag-history';
        if (cat.indexOf('entrevista') !== -1 || cat === 'entrevista') return 'tag-interview';
        return 'tag-article';
    }

    function timeAgo(ts) {
        if (!ts) return '';
        var diff = Date.now() - ts;
        if (diff < 0) return '';
        var minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'hace un momento';
        if (minutes < 60) return 'hace ' + minutes + ' min';
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return 'hace ' + hours + ' h';
        var days = Math.floor(hours / 24);
        if (days === 1) return 'hace 1 día';
        if (days < 30) return 'hace ' + days + ' días';
        var months = Math.floor(days / 30);
        if (months < 12) return 'hace ' + months + ' mes' + (months > 1 ? 'es' : '');
        var years = Math.floor(months / 12);
        return 'hace ' + years + ' año' + (years > 1 ? 's' : '');
    }

    window.Backstage.Views.Dashboard = {
        _container: null,

        init: function(containerId) {
            this._container = document.getElementById(containerId);
        },

        render: function(cards, recentStories, recentSoundscapes, previewStory, handlers) {
            if (!this._container) return;
            this._container.textContent = '';

            /* ---- PASO 1: tarjetas de métricas ---- */
            var metrics = el('div', 'dashboard-metrics');
            (cards || []).forEach(function(c) {
                var card = el('div', 'metric-card');

                var icon = el('div', 'metric-icon ' + (c.color || 'pink'));
                var i = el('i', 'fa-solid ' + (c.icon || 'fa-chart-simple'));
                icon.appendChild(i);
                card.appendChild(icon);

                var info = el('div', 'metric-info');
                var value = el('h3', '', c.value);
                var label = el('p', '', c.label);
                info.appendChild(value);
                info.appendChild(label);
                if (c.trend) {
                    var trend = el('span', 'trend ' + (c.trendClass || 'neutral'), c.trend);
                    info.appendChild(trend);
                }
                card.appendChild(info);

                metrics.appendChild(card);
            });
            this._container.appendChild(metrics);

            /* ---- PASO 2: rejilla principal ---- */
            var grid = el('div', 'dashboard-grid');

            /* Columna 1: Contenido reciente */
            grid.appendChild(this._buildContentCol(recentStories, {
                title: 'Contenido reciente',
                viewAllText: 'Ver todas',
                onViewAll: handlers.onViewStories,
                badgeFor: function(s) {
                    return { text: s.status === 'published' ? 'Publicado' : 'Borrador', cls: s.status === 'published' ? 'published' : 'draft' };
                },
                metaFor: function(s) { return s.category; }
            }));

            /* Columna 2: Simulador celular + acciones */
            var col2 = el('div', 'dash-col');
            var header2 = el('div', 'col-header');
            header2.appendChild(el('h2', '', 'Vista previa'));
            col2.appendChild(header2);

            var group = el('div', 'dash-col-group');
            group.appendChild(this._buildPhoneMockup(previewStory));
            group.appendChild(this._buildActions(handlers));
            col2.appendChild(group);
            grid.appendChild(col2);

            /* Columna 3: Música reciente */
            grid.appendChild(this._buildContentCol(recentSoundscapes, {
                title: 'Música reciente',
                viewAllText: 'Ver todas',
                onViewAll: handlers.onViewSoundscapes,
                badgeFor: function(ss) {
                    return { text: ss.published ? 'Publicado' : 'Borrador', cls: ss.published ? 'published' : 'draft' };
                },
                metaFor: function(ss) { return ss.artist || ''; },
                imgField: 'cover'
            }));

            this._container.appendChild(grid);
        },

        _buildContentCol: function(items, opts) {
            var col = el('div', 'dash-col');
            var header = el('div', 'col-header');
            header.appendChild(el('h2', '', opts.title));
            var link = el('button', 'view-all', opts.viewAllText || 'Ver todas');
            link.addEventListener('click', opts.onViewAll || function() {});
            header.appendChild(link);
            col.appendChild(header);

            var list = el('div', 'content-list');
            if (!items || !items.length) {
                list.appendChild(el('div', 'dash-empty', 'Aún no hay contenido.'));
            } else {
                items.forEach(function(item) {
                    list.appendChild(this._buildContentItem(item, opts));
                }, this);
            }
            col.appendChild(list);

            var moreBtn = el('button', 'btn-view-more-flat', 'Ver todo el contenido');
            moreBtn.addEventListener('click', opts.onViewAll || function() {});
            col.appendChild(moreBtn);

            return col;
        },

        _buildContentItem: function(item, opts) {
            var row = el('div', 'content-item');

            var imgField = opts.imgField || 'image';
            var imgUrl = safeImageUrl(item[imgField]);
            if (imgUrl) {
                var img = el('img', 'content-img');
                img.src = imgUrl;
                img.alt = item.title || '';
                row.appendChild(img);
            }

            var info = el('div', 'content-info');
            info.appendChild(el('h3', '', item.title || '(sin título)'));

            var metaP = el('p', '');
            if (opts.metaFor) {
                var metaText = opts.metaFor(item);
                if (metaText) {
                    var tag = el('span', 'meta-tag ' + tagClassFor(metaText), metaText);
                    metaP.appendChild(tag);
                }
            }
            info.appendChild(metaP);
            row.appendChild(info);

            var status = el('div', 'content-status');
            var badge = opts.badgeFor(item);
            if (badge.text) {
                var badgeEl = el('span', 'status-badge ' + (badge.cls || ''), badge.text);
                status.appendChild(badgeEl);
            }
            if (item.updatedAt) {
                status.appendChild(el('span', 'time-ago', timeAgo(item.updatedAt)));
            }
            row.appendChild(status);

            var dots = el('button', 'btn-dots');
            dots.setAttribute('aria-label', 'Acciones');
            dots.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';
            row.appendChild(dots);

            return row;
        },

        _buildPhoneMockup: function(story) {
            var phone = el('div', 'phone-mockup');

            var header = el('div', 'phone-header');
            header.appendChild(el('span', 'phone-brand', 'WHITEBOX'));
            var headerRight = el('div', 'phone-header-actions');
            headerRight.appendChild(el('span', 'fa-solid fa-bars'));
            header.appendChild(headerRight);
            phone.appendChild(header);

            var body = el('div', 'phone-body');
            var bg = safeImageUrl(story ? story.image : '');
            if (bg) body.style.backgroundImage = 'url("' + bg.replace(/"/g, '\\"') + '")';

            var bottom = el('div', 'phone-content-bottom');
            if (story) {
                var badge = el('span', 'phone-badge', story.category || 'Historia');
                bottom.appendChild(badge);
                bottom.appendChild(el('h2', '', story.title || 'Sin título'));
                bottom.appendChild(el('p', '', story.excerpt || ''));
            } else {
                bottom.appendChild(el('p', '', 'Publica contenido para previsualizarlo aquí.'));
            }

            var pagination = el('div', 'phone-pagination');
            for (var i = 0; i < 3; i++) {
                pagination.appendChild(el('span', 'dot' + (i === 0 ? ' active' : '')));
            }
            bottom.appendChild(pagination);

            body.appendChild(bottom);
            phone.appendChild(body);

            return phone;
        },

        _buildActions: function(handlers) {
            var wrap = el('div', 'dash-actions');

            var storyBtn = el('button', 'btn-primary', '');
            storyBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Historia';
            storyBtn.addEventListener('click', handlers.onNewStory || function() {});
            wrap.appendChild(storyBtn);

            var ssBtn = el('button', 'btn-primary', '');
            ssBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Canción';
            ssBtn.addEventListener('click', handlers.onNewSong || function() {});
            wrap.appendChild(ssBtn);

            var viewBtn = el('button', 'btn-secondary', '');
            viewBtn.innerHTML = '<i class="fa-solid fa-external-link"></i> Ver sitio';
            viewBtn.addEventListener('click', handlers.onViewSite || function() {});
            wrap.appendChild(viewBtn);

            return wrap;
        }
    };
})();
