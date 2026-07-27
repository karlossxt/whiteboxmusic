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

    DashboardService.prototype.getStatCards = function() {
        var s = this.storyService.getStats();
        var ss = this.soundscapeService.getStats();
        var lastModText = '-';
        if (s.lastModified) {
            try {
                var d = new Date(s.lastModified);
                var day = d.getDate();
                var months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                lastModText = day + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
            } catch (e) { lastModText = '-'; }
        }
        return [
            { value: s.total, label: 'Historias' },
            { value: s.published, label: 'Publicadas' },
            { value: s.draft, label: 'Borradores' },
            { value: s.featured, label: 'Destacadas' }
        ];
    };

    window.Backstage.DashboardService = DashboardService;
})();
