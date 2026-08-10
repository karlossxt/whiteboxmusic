/* ============================================
   BACKSTAGE STUDIO — Dashboard Controller
   Conecta DashboardService con DashboardView.
   Recibe eventos de UI, delega al servicio, actualiza la vista.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Controllers = window.Backstage.Controllers || {};

    function DashboardController(dashboardService, dashboardView) {
        this.service = dashboardService;
        this.view = dashboardView;
        this._bound = false;
    }

    DashboardController.prototype.mount = function() {
        this._render();
        this._bindHeader();
    };

    DashboardController.prototype.unmount = function() {
        window.Backstage.Components.Header.hideAll();
    };

    DashboardController.prototype.refresh = function() {
        this._render();
    };

    DashboardController.prototype._render = function() {
        var cards = this.service.getStatCards();
        var recentStories = this.service.getRecentStories(5);
        var recentSoundscapes = this.service.getRecentSoundscapes(5);
        var recentInterviews = this.service.getRecentInterviews(5);
        var previewStory = this.service.getPreviewStory();
        var self = this;

        this.view.render(
            cards,
            recentStories,
            recentSoundscapes,
            recentInterviews,
            previewStory,
            {
                onNewStory: function() { window.Backstage.router.navigate('stories'); },
                onNewSong: function() { window.Backstage.router.navigate('soundscapes'); },
                onViewSite: function() { window.open('../index.html', '_blank'); },
                onViewStories: function() { window.Backstage.router.navigate('stories'); },
                onViewSoundscapes: function() { window.Backstage.router.navigate('soundscapes'); },
                onViewInterviews: function() { window.Backstage.router.navigate('interviews'); }
            }
        );
    };

    DashboardController.prototype._bindHeader = function() {
        window.Backstage.Components.Header.hideAll();
    };

    window.Backstage.Controllers.Dashboard = DashboardController;
})();
