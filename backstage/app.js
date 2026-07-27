/* ============================================
   BACKSTAGE STUDIO — App Bootstrap
   Inicializa todas las capas y arranca el sistema.
   
   Flujo:
   1. Configura datasource (localStorage)
   2. Crea repositories
   3. Crea services
   4. Crea views
   5. Crea controllers
   6. Registra rutas
   7. Inicia router
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function init() {
        /* ------------------------------------------
           1. DATASOURCE
           ------------------------------------------ */
        var registry = new window.Backstage.DatasourceRegistry();
        var local = new window.Backstage.LocalDatasource();

        registry.register('local', local);
        registry.setActive('local');

        window.Backstage.datasource = registry;

        /* ------------------------------------------
           2. MIGRATION
           Migra datos legacy (wbox_*) a backstage_*.
           La migración es idempotente y crea backup.
           ------------------------------------------ */
        local.migrateFromLegacy('stories_data', 'stories_data');
        local.migrateFromLegacy('soundscapes_data', 'soundscapes_data');

        /* ------------------------------------------
           3. REPOSITORIES
           ------------------------------------------ */
        var storyRepo = new window.Backstage.StoryRepository(registry);
        var soundscapeRepo = new window.Backstage.SoundscapeRepository(registry);

        /* Migrate from default data if first run */
        if (typeof storiesDataDefault !== 'undefined') {
            storyRepo.migrateFromDefaults(storiesDataDefault);
        }
        if (typeof soundscapesDataDefault !== 'undefined') {
            soundscapeRepo.migrateFromDefaults(soundscapesDataDefault);
        }

        /* ------------------------------------------
           4. SERVICES
           ------------------------------------------ */
        var storyService = new window.Backstage.StoryService(storyRepo);
        var soundscapeService = new window.Backstage.SoundscapeService(soundscapeRepo);
        var dashboardService = new window.Backstage.DashboardService(storyService, soundscapeService);

        /* ------------------------------------------
           5. VIEWS
           ------------------------------------------ */
        var dashboardView = new window.Backstage.Views.Dashboard();
        dashboardView.init('section-dashboard');

        var storyView = new window.Backstage.Views.Story();
        storyView.init('section-stories');

        var soundscapeView = new window.Backstage.Views.Soundscape();
        soundscapeView.init('section-soundscapes');

        /* ------------------------------------------
           6. CONTROLLERS
           ------------------------------------------ */
        var dashboardCtrl = new window.Backstage.Controllers.Dashboard(dashboardService, dashboardView);
        var storyCtrl = new window.Backstage.Controllers.Story(storyService, storyView);
        var soundscapeCtrl = new window.Backstage.Controllers.Soundscape(soundscapeService, soundscapeView);

        /* ------------------------------------------
           7. ROUTER
           ------------------------------------------ */
        var router = new window.Backstage.Router();

        function showSection(route) {
            var sections = document.querySelectorAll('.admin-section');
            for (var i = 0; i < sections.length; i++) {
                sections[i].style.display = 'none';
            }
            var target = document.getElementById('section-' + route);
            if (target) target.style.display = 'block';
        }

        router.register('dashboard', {
            title: 'Dashboard',
            subtitle: 'Vista general del sitio',
            mount: function() {
                showSection('dashboard');
                window.Backstage.Components.Sidebar.setActive('dashboard');
                window.Backstage.Components.Header.updateForRoute('dashboard');
                dashboardCtrl.mount();
            },
            unmount: function() {
                dashboardCtrl.unmount();
            }
        });

        router.register('stories', {
            title: 'Gestionar Historias',
            subtitle: 'Administra las tarjetas de la seccion "Stories From The Scene"',
            mount: function() {
                showSection('stories');
                window.Backstage.Components.Sidebar.setActive('stories');
                window.Backstage.Components.Header.updateForRoute('stories');
                storyCtrl.mount();
                window.Backstage.Components.Header.showOnly('btnAddStory');
            },
            unmount: function() {
                storyCtrl.unmount();
            }
        });

        router.register('soundscapes', {
            title: 'Latest Soundscapes',
            subtitle: 'Gestiona las tarjetas de Spotify',
            mount: function() {
                showSection('soundscapes');
                window.Backstage.Components.Sidebar.setActive('soundscapes');
                window.Backstage.Components.Header.updateForRoute('soundscapes');
                soundscapeCtrl.mount();
                window.Backstage.Components.Header.showOnly('btnAddSoundscape');
            },
            unmount: function() {
                soundscapeCtrl.unmount();
            }
        });

        window.Backstage.router = router;

        /* ------------------------------------------
           8. COMPONENTS
           ------------------------------------------ */
        window.Backstage.Components.Sidebar.init();
        window.Backstage.Components.Header.init();

        /* ------------------------------------------
           9. GLOBAL EVENTS
           ------------------------------------------ */
        window.Backstage.EventBus.on('dashboard:refresh', function() {
            dashboardCtrl.refresh();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.Backstage.Components.Modal.closeAll();
            }
        });

        /* ------------------------------------------
           10. START
           ------------------------------------------ */
        router.start();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
