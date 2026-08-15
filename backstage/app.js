/* ============================================
   BACKSTAGE STUDIO — App Bootstrap
   Supabase + Local fallback
   
   Flujo:
   0. Auth guard (verifica sesion Supabase)
   1. Crea registros separados (stories / soundscapes)
   2. preloadSupabaseData() solo descarga (NO importa de localStorage)
   3. Si falla Supabase: pantalla error con Reintentar + Modo local
   4. Crea repositories, services, views, controllers
   5. Router y start
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var supabaseDsGlobal = null;
    var storyRegGlobal = null;
    var soundscapeRegGlobal = null;
    var interviewRegGlobal = null;
    var localGlobal = null;
    var retryCount = 0;
    var MAX_RETRIES = 3;

    /* ------------------------------------------
       UI: Loading screen
       ------------------------------------------ */
    function showApp() {
        var loading = document.getElementById('adminLoading');
        var layout = document.getElementById('adminLayout');
        if (loading) loading.style.display = 'none';
        if (layout) layout.style.display = '';
    }

    function hidePreloadError() {
        var el = document.getElementById('adminPreloadError');
        if (el) el.style.display = 'none';
    }

    function showPreloadError(retrying) {
        var loading = document.getElementById('adminLoading');
        if (loading) loading.style.display = 'none';

        var el = document.getElementById('adminPreloadError');
        if (!el) return;
        el.style.display = 'flex';

        var spinner = el.querySelector('.preload-error-spinner');
        var msg = el.querySelector('.preload-error-msg');
        var actions = el.querySelector('.preload-error-actions');

        if (retrying) {
            if (spinner) spinner.style.display = '';
            if (msg) msg.textContent = 'Reconectando a Supabase...';
            if (actions) actions.style.display = 'none';
        } else {
            if (spinner) spinner.style.display = 'none';
            if (msg) msg.textContent = 'No se pudo conectar a Supabase. Verifica tu conexion e intenta de nuevo.';
            if (actions) actions.style.display = '';
        }
    }

    function displayUserEmail() {
        var emailEl = document.getElementById('adminUserEmail');
        var user = window.Backstage.Auth.getUser();
        if (emailEl && user) {
            emailEl.textContent = user.email || '';
        }
    }

    function bindLogout() {
        var logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                window.Backstage.Auth.logout();
            });
        }
    }

    /* ------------------------------------------
       1. DATASOURCE REGISTRIES (Blocker #3)
       StoryDatasourceRegistry: Supabase when available, else local
       SoundscapeDatasourceRegistry: always local (Supabase para writes es opcional)
       ------------------------------------------ */
    function initDatasources() {
        var storyRegistry = new window.Backstage.DatasourceRegistry();
        var soundscapeRegistry = new window.Backstage.DatasourceRegistry();
        var interviewRegistry = new window.Backstage.DatasourceRegistry();
        var siteConfigRegistry = new window.Backstage.DatasourceRegistry();
        var galleryRegistry = new window.Backstage.DatasourceRegistry();
        var sectionRegistry = new window.Backstage.DatasourceRegistry();
        var local = new window.Backstage.LocalDatasource();

        // Soundscapes, interviews, siteConfig, gallery, section siempre inician en local
        soundscapeRegistry.register('local', local);
        soundscapeRegistry.setActive('local');

        interviewRegistry.register('local', local);
        interviewRegistry.setActive('local');

        siteConfigRegistry.register('local', local);
        siteConfigRegistry.setActive('local');

        galleryRegistry.register('local', local);
        galleryRegistry.setActive('local');

        sectionRegistry.register('local', local);
        sectionRegistry.setActive('local');

        // Story puede usar Supabase si está disponible
        var supa = window.WhiteBoxSupabase ? window.WhiteBoxSupabase.client : null;
        var storySupabaseReady = false;
        try {
            if (supa) {
                var storySupa = new window.Backstage.SupabaseDatasource(supa.from('stories'));
                storyRegistry.register('supabase', storySupa);
                storyRegistry.register('local', local);
                storyRegistry.setActive('supabase');
                storySupabaseReady = true;
            }
        } catch (e) {
            console.warn('[Backstage] Supabase no disponible para stories:', e.message);
        }

        if (!storySupabaseReady) {
            storyRegistry.register('local', local);
            storyRegistry.setActive('local');
        }

        window.Backstage.storyDatasourceRegistry = storyRegistry;
        window.Backstage.soundscapeDatasourceRegistry = soundscapeRegistry;
        window.Backstage.interviewDatasourceRegistry = interviewRegistry;
        window.Backstage.siteConfigDatasourceRegistry = siteConfigRegistry;
        window.Backstage.galleryDatasourceRegistry = galleryRegistry;
        window.Backstage.sectionDatasourceRegistry = sectionRegistry;
        window.Backstage.datasource = storyRegistry;

        return {
            storyRegistry: storyRegistry,
            soundscapeRegistry: soundscapeRegistry,
            interviewRegistry: interviewRegistry,
            siteConfigRegistry: siteConfigRegistry,
            galleryRegistry: galleryRegistry,
            sectionRegistry: sectionRegistry,
            local: local
        };
    }

    /* ------------------------------------------
       2. PRELOAD (Blocker #4)
       Solo descarga datos remotos. NO importa de
       localStorage automaticamente.
       ------------------------------------------ */
    function preloadSupabaseData(storyDs) {
        var COLLECTIONS = ['stories', 'site_content', 'gallery', 'soundscapes', 'interviews', 'site_config'];

        storyDs._cache = storyDs._cache || {};

        function loadCollection(index) {
            if (index >= COLLECTIONS.length) {
                return Promise.resolve({
                    stories: storyDs._cache['stories'] ? storyDs._cache['stories'].length : 0,
                    sections: storyDs._cache['site_content'] ? storyDs._cache['site_content'].length : 0,
                    gallery: storyDs._cache['gallery'] ? storyDs._cache['gallery'].length : 0,
                    soundscapes: storyDs._cache['soundscapes'] ? storyDs._cache['soundscapes'].length : 0,
                    interviews: storyDs._cache['interviews'] ? storyDs._cache['interviews'].length : 0,
                    siteConfig: storyDs._cache['site_config'] ? storyDs._cache['site_config'].length : 0
                });
            }

            var name = COLLECTIONS[index];
            return storyDs._collectionRef(name).get().then(function(snapshot) {
                var items = [];
                snapshot.forEach(function(doc) {
                    var data = doc;
                    data.id = doc.id || doc._id;
                    items.push(data);
                });
                storyDs._cache[name] = items;
                return loadCollection(index + 1);
            });
        }

        return loadCollection(0);
    }

    /* ------------------------------------------
       3. RETRY + LOCAL MODE (Blocker #8)
       ------------------------------------------ */
    function attemptPreload(storyRegistry) {
        var storyDs = storyRegistry.sources['supabase'];
        if (!storyDs) {
            return Promise.resolve(false);
        }

        return preloadSupabaseData(storyDs).then(function() {
            return true;
        }).catch(function(err) {
            console.error('[Backstage] Preload Supabase falló:', err);
            retryCount++;

            if (retryCount < MAX_RETRIES) {
                showPreloadError(true);
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        attemptPreload(storyRegistry).then(resolve);
                    }, 2000 * retryCount);
                });
            }

            showPreloadError(false);
            return false;
        });
    }

    function bootWithLocalMode(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, local) {
        window.Backstage._localMode = true;

        /* Asegurar que el datasource activo sea local */
        storyReg.setActive('local');
        soundscapeReg.setActive('local');
        interviewReg.setActive('local');
        siteConfigReg.setActive('local');
        galleryReg.setActive('local');
        sectionReg.setActive('local');

        var storyRepo = new window.Backstage.StoryRepository(storyReg);
        var soundscapeRepo = new window.Backstage.SoundscapeRepository(soundscapeReg);
        var interviewRepo = new window.Backstage.InterviewRepository(interviewReg);
        var siteConfigRepo = new window.Backstage.SiteConfigRepository(local);
        var galleryRepo = new window.Backstage.GalleryRepository(galleryReg);
        var sectionRepo = new window.Backstage.SectionRepository(local);

        if (typeof storiesDataDefault !== 'undefined') {
            storyRepo.migrateFromDefaults(storiesDataDefault);
        }
        if (typeof soundscapesDataDefault !== 'undefined') {
            soundscapeRepo.migrateFromDefaults(soundscapesDataDefault);
        }
        if (window.WhiteBoxSiteSchema) {
            sectionRepo.migrateFromDefaults(window.WhiteBoxSiteSchema);
        }
        siteConfigRepo.migrateFromDefaults();

        bootApp(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, storyRepo, soundscapeRepo, interviewRepo, siteConfigRepo, galleryRepo, sectionRepo, false);
    }

    /* ------------------------------------------
       4. BOOT APP
       ------------------------------------------ */
    function bootApp(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, storyRepo, soundscapeRepo, interviewRepo, siteConfigRepo, galleryRepo, sectionRepo, isSupabase) {
        var storyService = new window.Backstage.StoryService(storyRepo);
        var soundscapeService = new window.Backstage.SoundscapeService(soundscapeRepo);
        var interviewService = new window.Backstage.InterviewService(interviewRepo);
        var siteConfigService = new window.Backstage.SiteConfigService(siteConfigRepo);
        var galleryService = new window.Backstage.GalleryService(galleryRepo);
        var dashboardService = new window.Backstage.DashboardService(storyService, soundscapeService, interviewService, siteConfigService);

        var dashboardView = window.Backstage.Views.Dashboard;
        dashboardView.init('section-dashboard');

        var storyView = window.Backstage.Views.Story;
        storyView.init('section-stories');

        var soundscapeView = window.Backstage.Views.Soundscape;
        soundscapeView.init('section-soundscapes');

        var interviewView = window.Backstage.Views.Interview;
        interviewView.init('section-interviews');

        var siteConfigView = window.Backstage.Views.SiteConfig;
        siteConfigView.init('section-settings');

        var galleryView = window.Backstage.Views.Gallery;
        galleryView.init('section-gallery');

        var sectionService = null;
        var sectionView = null;
        var sectionCtrl = null;
        if (window.WhiteBoxSiteSchema) {
            sectionService = new window.Backstage.SectionService(sectionRepo, window.WhiteBoxSiteSchema);
            sectionView = window.Backstage.Views.Sections;
            sectionView.init('section-sections');
            sectionCtrl = new window.Backstage.Controllers.Sections(sectionService, window.WhiteBoxSiteSchema, sectionView);
        }

        var dashboardCtrl = new window.Backstage.Controllers.Dashboard(dashboardService, dashboardView);
        var storyCtrl = new window.Backstage.Controllers.Story(storyService, storyView);
        var soundscapeCtrl = new window.Backstage.Controllers.Soundscape(soundscapeService, soundscapeView);
        var interviewCtrl = new window.Backstage.Controllers.Interview(interviewService, interviewView);
        var siteConfigCtrl = new window.Backstage.Controllers.SiteConfig(siteConfigService, siteConfigView);
        var galleryCtrl = new window.Backstage.Controllers.Gallery(galleryService, galleryView);

        if (window.Backstage._localMode) {
            showLocalModeBanner();
        }

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
            unmount: function() { dashboardCtrl.unmount(); }
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
            unmount: function() { storyCtrl.unmount(); }
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
            unmount: function() { soundscapeCtrl.unmount(); }
        });

        router.register('interviews', {
            title: 'Gestionar Entrevistas',
            subtitle: 'Administra las entrevistas de la seccion "Interviews"',
            mount: function() {
                showSection('interviews');
                window.Backstage.Components.Sidebar.setActive('interviews');
                window.Backstage.Components.Header.updateForRoute('interviews');
                interviewCtrl.mount();
                window.Backstage.Components.Header.showOnly('btnAddInterview');
            },
            unmount: function() { interviewCtrl.unmount(); }
        });

        router.register('gallery', {
            title: 'Galería Fotográfica',
            subtitle: 'Administra los eventos y fotos del archivo visual',
            mount: function() {
                showSection('gallery');
                window.Backstage.Components.Sidebar.setActive('gallery');
                window.Backstage.Components.Header.updateForRoute('gallery');
                galleryCtrl.mount();
                window.Backstage.Components.Header.showOnly('btnAddGallery');
            },
            unmount: function() { galleryCtrl.unmount(); }
        });

        if (sectionCtrl) {
            router.register('sections', {
                title: 'Páginas del Sitio',
                subtitle: 'Edita los textos y secciones de cada página',
                mount: function() {
                    showSection('sections');
                    window.Backstage.Components.Sidebar.setActive('sections');
                    window.Backstage.Components.Header.updateForRoute('sections');
                    sectionCtrl.mount();
                    window.Backstage.Components.Header.hideAll();
                },
                unmount: function() { sectionCtrl.unmount(); }
            });

            router.register('home', {
                title: 'Inicio',
                subtitle: 'Edita el contenido de la portada',
                mount: function() {
                    showSection('sections');
                    window.Backstage.Components.Sidebar.setActive('home');
                    window.Backstage.Components.Header.updateForRoute('home');
                    sectionCtrl.mount();
                    sectionCtrl.openEditor('home');
                    window.Backstage.Components.Header.hideAll();
                },
                unmount: function() { sectionCtrl.unmount(); }
            });
        }

        router.register('settings', {
            title: 'Configuración del Sitio',
            subtitle: 'Datos globales: identidad, redes y contacto',
            mount: function() {
                showSection('settings');
                window.Backstage.Components.Sidebar.setActive('settings');
                window.Backstage.Components.Header.updateForRoute('settings');
                siteConfigCtrl.mount();
                window.Backstage.Components.Header.hideAll();
            },
            unmount: function() { siteConfigCtrl.unmount(); }
        });

        window.Backstage.router = router;

        window.Backstage.Components.Sidebar.init();
        window.Backstage.Components.Header.init();
        displayUserEmail();
        bindLogout();

        window.Backstage.EventBus.on('dashboard:refresh', function() {
            dashboardCtrl.refresh();
        });

        window.addEventListener('storage', function(e) {
            if (!e.key) return;
            if (e.key === 'backstage_stories_data' || e.key === 'backstage_stories_data_backup') {
                var current = router.getCurrent();
                if (current === 'stories') storyCtrl.refresh();
                if (current === 'dashboard') dashboardCtrl.refresh();
            }
            if (e.key === 'backstage_soundscapes_data' || e.key === 'backstage_soundscapes_data_backup') {
                var current2 = router.getCurrent();
                if (current2 === 'soundscapes') soundscapeCtrl.refresh();
                if (current2 === 'dashboard') dashboardCtrl.refresh();
            }
            if (e.key === 'backstage_interviews_data' || e.key === 'backstage_interviews_data_backup') {
                var current5 = router.getCurrent();
                if (current5 === 'interviews') interviewCtrl.refresh();
                if (current5 === 'dashboard') dashboardCtrl.refresh();
            }
            if (e.key === 'backstage_site_config' || e.key === 'backstage_site_config_backup') {
                var current6 = router.getCurrent();
                if (current6 === 'settings') siteConfigCtrl.refresh();
            }
            if (e.key === 'gallery_events_data' || e.key === 'gallery_events_data_backup') {
                var current3 = router.getCurrent();
                if (current3 === 'gallery') galleryCtrl.refresh();
                if (current3 === 'dashboard') dashboardCtrl.refresh();
            }
            if (e.key === 'backstage_site_content' || e.key === 'backstage_site_content_backup') {
                var current4 = router.getCurrent();
                if (current4 === 'sections' && sectionCtrl) sectionCtrl.refresh();
                if (current4 === 'home' && sectionCtrl) sectionCtrl.refresh();
            }
        });

        showApp();
        hidePreloadError();
        router.start();
    }

    function showLocalModeBanner() {
        var banner = document.getElementById('localModeBanner');
        if (banner) banner.style.display = '';
    }

    function bindErrorScreenButtons(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, local) {
        var retryBtn = document.getElementById('preloadRetryBtn');
        var localBtn = document.getElementById('preloadLocalBtn');

        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                retryCount = 0;
                showPreloadError(true);
                attemptPreload(storyReg).then(function(ok) {
                    if (ok) {
                        bootWithSupabase(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, local);
                    } else {
                        showPreloadError(false);
                    }
                });
            });
        }

        if (localBtn) {
            localBtn.addEventListener('click', function() {
                hidePreloadError();
                bootWithLocalMode(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, local);
            });
        }
    }

    function bootWithSupabase(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, local) {
        var storyDs = storyReg.sources['supabase'];
        if (!storyDs) {
            // Fallback a local si Supabase no está disponible
            bootWithLocalMode(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, local);
            return;
        }

        window.Backstage._localMode = false;
        bootApp(storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, storyReg, soundscapeReg, interviewReg, siteConfigReg, galleryReg, sectionReg, true);
    }

    /* ------------------------------------------
       INIT
       ------------------------------------------ */
    function init() {
        var ds = initDatasources();

        // Intentar preload con Supabase
        var booted = false;
        function safeBoot(mode) {
            if (booted) return;
            booted = true;
            if (mode === 'supabase') {
                bootWithSupabase(ds.storyRegistry, ds.soundscapeRegistry, ds.interviewRegistry, ds.siteConfigRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            } else {
                bootWithLocalMode(ds.storyRegistry, ds.soundscapeRegistry, ds.interviewRegistry, ds.siteConfigRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            }
        }

        // Timeout de 10 segundos
        setTimeout(function() {
            if (!booted) {
                console.warn('[Backstage] Preload timeout, falling back to local mode');
                safeBoot('local');
            }
        }, 10000);

        attemptPreload(ds.storyRegistry).then(function(ok) {
            safeBoot(ok ? 'supabase' : 'local');
        });
    }

    function showAppSplash() {
        // Puede usarse para mostrar splash inicial
    }

    document.addEventListener('DOMContentLoaded', function() {
        window.Backstage.Auth.guard().then(function() {
            init();
        }).catch(function(err) {
            console.error('[Backstage] Auth guard failed', err);
            // Si auth falla, intentar cargar en modo local
            init();
        });
    });
})();