/* ============================================
   BACKSTAGE STUDIO — Story Model
   Modelo de datos para historias.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function Story(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.title = raw.title || '';
        this.slug = raw.slug || '';
        this.excerpt = raw.excerpt || '';
        this.category = raw.category || '';
        this.author = raw.author || '';
        this.image = raw.image || '';
        this.content = raw.content || '';
        this.status = raw.status || 'draft';
        this.featured = raw.featured === true || raw.featured === 'true';
        this.date = raw.date || '';
        this.createdAt = raw.createdAt || Date.now();
        this.updatedAt = raw.updatedAt || Date.now();
        this.order = parseInt(raw.order, 10) || 1;
        this.location = raw.location || '';
        this.relatedSong = raw.relatedSong || '';
        this.initialLikes = parseInt(raw.initialLikes, 10) || 0;
    }

    Story.prototype.toJSON = function() {
        return {
            id: this.id,
            title: this.title,
            slug: this.slug,
            excerpt: this.excerpt,
            category: this.category,
            author: this.author,
            image: this.image,
            content: this.content,
            status: this.status,
            featured: this.featured,
            date: this.date,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            order: this.order,
            location: this.location,
            relatedSong: this.relatedSong,
            initialLikes: this.initialLikes
        };
    };

    Story.prototype.isPublished = function() {
        return this.status === 'published';
    };

    Story.prototype.isFeatured = function() {
        return this.featured === true;
    };

    Story.prototype.isDraft = function() {
        return this.status === 'draft';
    };

    Story.prototype.formatUpdatedAt = function() {
        try {
            var d = new Date(this.updatedAt);
            var day = d.getDate();
            var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        } catch (e) {
            return '-';
        }
    };

    Story.create = function(raw) {
        return new Story(raw);
    };

    window.Backstage.Story = Story;
})();
