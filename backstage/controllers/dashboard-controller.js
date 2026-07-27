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
        var self = this;

        this.view.render(
            cards,
            function() { window.Backstage.router.navigate('stories'); },
            function() { window.Backstage.router.navigate('soundscapes'); },
            function() { window.open('../index.html', '_blank'); }
        );
    };

    DashboardController.prototype._bindHeader = function() {
        window.Backstage.Components.Header.hideAll();
    };

    window.Backstage.Controllers.Dashboard = DashboardController;
})();
