/* ============================================
   BACKSTAGE STUDIO — Dashboard Service
   Estadísticas agregadas para el dashboard.
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
        return [
            { value: s.total, label: 'Historias' },
            { value: s.published, label: 'Historias publicadas' },
            { value: ss.total, label: 'Canciones' },
            { value: ss.published, label: 'Canciones publicadas' }
        ];
    };

    window.Backstage.DashboardService = DashboardService;
})();
