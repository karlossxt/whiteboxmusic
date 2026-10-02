/* ============================================
   BACKSTAGE STUDIO — Artist Model
   Modelo de datos para los artistas de la
   seccion "Descubre" (descubre.html).
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function Artist(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.name = raw.name || '';
        this.image = raw.image || '';
        this.tags = Artist.normalizeTags(raw.tags);
        this.link = raw.link || '';
        this.interview = raw.interview || '';
        this.published = raw.published === true || raw.published === 'true';
        this.featured = raw.featured === true || raw.featured === 'true';
        this.order = parseInt(raw.order, 10) || 1;
        this.createdAt = raw.createdAt || Date.now();
        this.updatedAt = raw.updatedAt || Date.now();
    }

    /* Los tags llegan como array, como texto separado por
       comas o como array ya normalizado. Siempre se
       guardan como array de strings sin vacios. */
    Artist.normalizeTags = function(value) {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value
                .map(function(t) { return String(t == null ? '' : t).trim(); })
                .filter(function(t) { return t.length > 0; });
        }
        return String(value)
            .split(',')
            .map(function(t) { return t.trim(); })
            .filter(function(t) { return t.length > 0; });
    };

    Artist.prototype.toJSON = function() {
        return {
            id: this.id,
            name: this.name,
            image: this.image,
            tags: this.tags.slice(),
            link: this.link,
            interview: this.interview,
            published: this.published,
            featured: this.featured,
            order: this.order,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    };

    Artist.prototype.getTagsText = function() {
        return this.tags.join(', ');
    };

    Artist.prototype.isPublished = function() {
        return this.published === true;
    };

    Artist.prototype.isFeatured = function() {
        return this.featured === true;
    };

    Artist.prototype.formatUpdatedAt = function() {
        try {
            var d = new Date(this.updatedAt);
            var day = d.getDate();
            var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        } catch (e) {
            return '-';
        }
    };

    Artist.create = function(raw) {
        return new Artist(raw);
    };

    window.Backstage.Artist = Artist;
})();
