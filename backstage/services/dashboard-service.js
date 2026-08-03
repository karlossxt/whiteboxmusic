/* ============================================
   BACKSTAGE STUDIO — Dashboard Service
   Estadisticas agregadas para el dashboard.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function DashboardService(storyService, soundscapeService) {
        this.storyService = storyService;
        this.soundscapeService = soundscapeService;
    }

    DashboardService.prototype.getOverview = function() {
        return {
            stories: this.storyService.getStats(),
            soundscapes: this.soundscapeService.getStats()
        };
    };

    DashboardService.prototype._lastModifiedText = function(ts) {
        if (!ts) return '-';
        try {
            var d = new Date(ts);
            var day = d.getDate();
            var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        } catch (e) { return '-'; }
    };

    DashboardService.prototype.getStatCards = function() {
        var s = this.storyService.getStats();
        var ss = this.soundscapeService.getStats();
        return [
            { value: s.total, label: 'Historias', icon: 'fa-book-open', color: 'pink', trend: 'En total', trendClass: 'neutral' },
            { value: s.published, label: 'Publicadas', icon: 'fa-check', color: 'green', trend: 'Visibles en el sitio', trendClass: 'positive' },
            { value: s.draft, label: 'Borradores', icon: 'fa-pen', color: 'orange', trend: 'Pendientes de publicar', trendClass: 'neutral' },
            { value: s.featured, label: 'Destacadas', icon: 'fa-star', color: 'purple', trend: 'En portada', trendClass: 'neutral' },
            { value: ss.playlists, label: 'Playlists', icon: 'fa-headphones', color: 'blue', trend: 'Playlists creadas', trendClass: 'neutral' }
        ];
    };

    DashboardService.prototype.getRecentStories = function(limit) {
        limit = limit || 5;
        var items = this.storyService.getAll();
        var sorted = items.slice().sort(function(a, b) {
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
        return sorted.slice(0, limit).map(function(s) {
            return {
                id: s.id,
                title: s.title,
                category: s.category,
                status: s.status,
                featured: s.isFeatured(),
                image: s.image || '',
                excerpt: s.excerpt || '',
                updatedAt: s.updatedAt || 0
            };
        });
    };

    DashboardService.prototype.getPreviewStory = function() {
        var items = this.storyService.getAll();
        if (!items.length) return null;
        var featured = items.filter(function(s) { return s.isPublished() && s.isFeatured(); });
        var pool = featured.length ? featured : items.filter(function(s) { return s.isPublished(); });
        var source = pool.length ? pool : items;
        var sorted = source.slice().sort(function(a, b) {
            return (b.updatedAt || 0) - (a.updatedAt || 0);
        });
        var top = sorted[0];
        return {
            id: top.id,
            title: top.title,
            category: top.category,
            image: top.image || '',
            excerpt: top.excerpt || ''
        };
    };

    DashboardService.prototype.getRecentSoundscapes = function(limit) {
        limit = limit || 5;
        var items = this.soundscapeService.getAll();
        var sorted = items.slice().sort(function(a, b) {
            return (b.order || 0) - (a.order || 0);
        });
        return sorted.slice(0, limit).map(function(ss) {
            return {
                id: ss.id,
                title: ss.title,
                artist: ss.artist,
                playlist: ss.playlist,
                published: ss.isPublished(),
                cover: ss.cover || ''
            };
        });
    };

    window.Backstage.DashboardService = DashboardService;
})();
