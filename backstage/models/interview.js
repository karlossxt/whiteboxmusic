/* ============================================
   BACKSTAGE STUDIO — Interview Model
   Modelo de datos para entrevistas.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function Interview(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.title = raw.title || '';
        this.slug = raw.slug || '';
        this.excerpt = raw.excerpt || '';
        this.content = raw.content || '';
        this.category = raw.category || '';
        this.author = raw.author || '';
        this.cover = raw.cover || '';
        this.youtubeUrl = raw.youtubeUrl || '';
        this.spotifyUrl = raw.spotifyUrl || '';
        this.published = raw.published === true || raw.published === 'true';
        this.featured = raw.featured === true || raw.featured === 'true';
        this.publishDate = raw.publishDate || '';
        this.order = parseInt(raw.order, 10) || 1;
        this.createdAt = raw.createdAt || Date.now();
        this.updatedAt = raw.updatedAt || Date.now();
    }

    Interview.prototype.toJSON = function() {
        return {
            id: this.id,
            title: this.title,
            slug: this.slug,
            excerpt: this.excerpt,
            content: this.content,
            category: this.category,
            author: this.author,
            cover: this.cover,
            youtubeUrl: this.youtubeUrl,
            spotifyUrl: this.spotifyUrl,
            published: this.published,
            featured: this.featured,
            publishDate: this.publishDate,
            order: this.order,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    };

    Interview.prototype.isPublished = function() {
        return this.published === true;
    };

    Interview.prototype.isFeatured = function() {
        return this.featured === true;
    };

    Interview.prototype.formatUpdatedAt = function() {
        try {
            var d = new Date(this.updatedAt);
            var day = d.getDate();
            var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        } catch (e) {
            return '-';
        }
    };

    Interview.create = function(raw) {
        return new Interview(raw);
    };

    window.Backstage.Interview = Interview;
})();
