/* ============================================
   BACKSTAGE STUDIO — Story Model
   Modelo de datos para historias.
   Centraliza la estructura y validación inicial.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var defaults = {
        id: '',
        title: '',
        author: '',
        location: '',
        image: '',
        excerpt: '',
        content: '',
        relatedSong: '',
        date: '',
        status: 'draft',
        featured: false,
        order: 1,
        initialLikes: 0
    };

    function Story(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.title = raw.title || '';
        this.author = raw.author || '';
        this.location = raw.location || '';
        this.image = raw.image || '';
        this.excerpt = raw.excerpt || '';
        this.content = raw.content || '';
        this.relatedSong = raw.relatedSong || '';
        this.date = raw.date || '';
        this.status = raw.status || 'draft';
        this.featured = raw.featured === true || raw.featured === 'true';
        this.order = parseInt(raw.order, 10) || 1;
        this.initialLikes = parseInt(raw.initialLikes, 10) || 0;
    }

    Story.prototype.toJSON = function() {
        return {
            id: this.id,
            title: this.title,
            author: this.author,
            location: this.location,
            image: this.image,
            excerpt: this.excerpt,
            content: this.content,
            relatedSong: this.relatedSong,
            date: this.date,
            status: this.status,
            featured: this.featured,
            order: this.order,
            initialLikes: this.initialLikes
        };
    };

    Story.prototype.isPublished = function() {
        return this.status === 'published';
    };

    Story.prototype.isFeatured = function() {
        return this.featured === true;
    };

    Story.create = function(raw) {
        return new Story(raw);
    };

    Story.defaults = defaults;

    window.Backstage.Story = Story;
})();
