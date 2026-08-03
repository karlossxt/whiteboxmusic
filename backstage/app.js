/* ============================================
   BACKSTAGE STUDIO — App Bootstrap
   v0.3A — Firebase + Local fallback

   Flujo:
   0. Auth guard (verifica sesion Firebase)
   1. Crea registros separados (stories / soundscapes)
   2. preloadFirestoreData() solo descarga (NO importa de localStorage)
   3. Si falla Firestore: pantalla error con Reintentar + Modo local
   4. Crea repositories, services, views, controllers
   5. Router y start
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    var AUTHORIZED_UID = 'qtguil5JI0ejOeJ0fpiXrxTJvIq2';
    var firestoreDsGlobal = null;
    var storyRegGlobal = null;
    var soundscapeRegGlobal = null;
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
            if (msg) msg.textContent = 'Reconectando a Firestore...';
            if (actions) actions.style.display = 'none';
        } else {
            if (spinner) spinner.style.display = 'none';
            if (msg) msg.textContent = 'No se pudo conectar a Firestore. Verifica tu conexion e intenta de nuevo.';
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
       StoryDatasourceRegistry: Firestore when available, else local
       SoundscapeDatasourceRegistry: always local
       ------------------------------------------ */
    function initDatasources() {
        var storyRegistry = new window.Backstage.DatasourceRegistry();
        var soundscapeRegistry = new window.Backstage.DatasourceRegistry();
        var galleryRegistry = new window.Backstage.DatasourceRegistry();
        var sectionRegistry = new window.Backstage.DatasourceRegistry();
        var local = new window.Backstage.LocalDatasource();

        soundscapeRegistry.register('local', local);
        soundscapeRegistry.setActive('local');

        galleryRegistry.register('local', local);
        galleryRegistry.setActive('local');

        sectionRegistry.register('local', local);
        sectionRegistry.setActive('local');

        var firestoreReady = false;
        try {
            var wbf = window.WhiteBoxFirebase;
            if (wbf && wbf.db && wbf.auth && wbf.auth.currentUser) {
                var firestore = new window.Backstage.FirestoreDatasource();
                storyRegistry.register('firestore', firestore);
                storyRegistry.register('local', local);
                storyRegistry.setActive('firestore');
                sectionRegistry.register('firestore', firestore);
                sectionRegistry.setActive('firestore');
                firestoreReady = true;
                firestoreDsGlobal = firestore;
            }
        } catch (e) {
            console.warn('[Backstage] Firestore no disponible:', e.message);
        }

        if (!firestoreReady) {
            storyRegistry.register('local', local);
            storyRegistry.setActive('local');
        }

        window.Backstage.storyDatasourceRegistry = storyRegistry;
        window.Backstage.soundscapeDatasourceRegistry = soundscapeRegistry;
        window.Backstage.galleryDatasourceRegistry = galleryRegistry;
        window.Backstage.sectionDatasourceRegistry = sectionRegistry;
        window.Backstage.datasource = storyRegistry;

        return {
            storyRegistry: storyRegistry,
            soundscapeRegistry: soundscapeRegistry,
            galleryRegistry: galleryRegistry,
            sectionRegistry: sectionRegistry,
            local: local,
            firestoreReady: firestoreReady
        };
    }

    /* ------------------------------------------
       2. PRELOAD (Blocker #4)
       Solo descarga datos remotos. NO importa de
       localStorage automaticamente.
       ------------------------------------------ */
    function preloadFirestoreData(firestoreDs) {
        var COLLECTIONS = ['stories', 'site_content'];

        firestoreDs._cache = firestoreDs._cache || {};

        function loadCollection(index) {
            if (index >= COLLECTIONS.length) {
                return Promise.resolve({
                    stories: firestoreDs._cache['stories'] ? firestoreDs._cache['stories'].length : 0,
                    sections: firestoreDs._cache['site_content'] ? firestoreDs._cache['site_content'].length : 0
                });
            }

            var name = COLLECTIONS[index];
            return firestoreDs._collectionRef(name).get().then(function(snapshot) {
                var items = [];
                snapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    items.push(data);
                });
                firestoreDs._cache[name] = items;
                return loadCollection(index + 1);
            });
        }

        return loadCollection(0);
    }

    /* ------------------------------------------
       3. RETRY + LOCAL MODE (Blocker #8)
       ------------------------------------------ */
    function attemptPreload(storyRegistry) {
        var firestoreDs = storyRegistry.sources['firestore'];
        if (!firestoreDs) {
            return Promise.resolve(false);
        }

        return preloadFirestoreData(firestoreDs).then(function() {
            return true;
        }).catch(function(err) {
            console.error('[Backstage] Preload Firestore falló:', err);
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

    function bootWithLocalMode(storyReg, soundscapeReg, galleryReg, sectionReg, local) {
        window.Backstage._localMode = true;

        var storyRepo = new window.Backstage.StoryRepository(storyReg);
        var soundscapeRepo = new window.Backstage.SoundscapeRepository(soundscapeReg);
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

        bootApp(storyReg, soundscapeReg, galleryReg, storyRepo, soundscapeRepo, galleryRepo, sectionRepo, false);
    }

    /* ------------------------------------------
       4. BOOT APP
       ------------------------------------------ */
    function bootApp(storyReg, soundscapeReg, galleryReg, storyRepo, soundscapeRepo, galleryRepo, sectionRepo, isFirestore) {
        var storyService = new window.Backstage.StoryService(storyRepo);
        var soundscapeService = new window.Backstage.SoundscapeService(soundscapeRepo);
        var galleryService = new window.Backstage.GalleryService(galleryRepo);
        var dashboardService = new window.Backstage.DashboardService(storyService, soundscapeService);

        var dashboardView = window.Backstage.Views.Dashboard;
        dashboardView.init('section-dashboard');

        var storyView = window.Backstage.Views.Story;
        storyView.init('section-stories');

        var soundscapeView = window.Backstage.Views.Soundscape;
        soundscapeView.init('section-soundscapes');

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
                title: 'Contenido del Sitio',
                subtitle: 'Edita los textos y secciones de cada pagina',
                mount: function() {
                    showSection('sections');
                    window.Backstage.Components.Sidebar.setActive('sections');
                    window.Backstage.Components.Header.updateForRoute('sections');
                    sectionCtrl.mount();
                    window.Backstage.Components.Header.hideAll();
                },
                unmount: function() { sectionCtrl.unmount(); }
            });
        }

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
            if (e.key === 'gallery_events_data' || e.key === 'gallery_events_data_backup') {
                var current3 = router.getCurrent();
                if (current3 === 'gallery') galleryCtrl.refresh();
                if (current3 === 'dashboard') dashboardCtrl.refresh();
            }
            if (e.key === 'backstage_site_content' || e.key === 'backstage_site_content_backup') {
                var current4 = router.getCurrent();
                if (current4 === 'sections' && sectionCtrl) sectionCtrl.refresh();
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

    function bindErrorScreenButtons(storyReg, soundscapeReg, galleryReg, sectionReg, local) {
        var retryBtn = document.getElementById('preloadRetryBtn');
        var localBtn = document.getElementById('preloadLocalBtn');

        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                retryCount = 0;
                showPreloadError(true);
                attemptPreload(storyReg).then(function(ok) {
                    if (ok) {
                        bootWithFirestore(storyReg, soundscapeReg, galleryReg, sectionReg, local);
                    } else {
                        showPreloadError(false);
                    }
                });
            });
        }

        if (localBtn) {
            localBtn.addEventListener('click', function() {
                hidePreloadError();
                bootWithLocalMode(storyReg, soundscapeReg, galleryReg, sectionReg, local);
            });
        }
    }

    function bootWithFirestore(storyReg, soundscapeReg, galleryReg, sectionReg, local) {
        var firestoreDs = storyReg.sources['firestore'];
        var storyRepo = new window.Backstage.FirestoreStoryRepository(storyReg);
        var soundscapeRepo = new window.Backstage.SoundscapeRepository(soundscapeReg);
        var galleryRepo = new window.Backstage.GalleryRepository(galleryReg);
        var sectionRepo = new window.Backstage.FirestoreSectionRepository(sectionReg);

        if (typeof soundscapesDataDefault !== 'undefined') {
            soundscapeRepo.migrateFromDefaults(soundscapesDataDefault);
        }

        window.Backstage._localMode = false;
        bootApp(storyReg, soundscapeReg, galleryReg, storyRepo, soundscapeRepo, galleryRepo, sectionRepo, true);
    }

    /* ------------------------------------------
       INIT
       ------------------------------------------ */
    function init() {
        var ds = initDatasources();

        if (!ds.firestoreReady) {
            bootWithLocalMode(ds.storyRegistry, ds.soundscapeRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            return;
        }

        bindErrorScreenButtons(ds.storyRegistry, ds.soundscapeRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);

        var booted = false;
        function safeBoot(mode) {
            if (booted) return;
            booted = true;
            if (mode === 'firestore') {
                bootWithFirestore(ds.storyRegistry, ds.soundscapeRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            } else {
                bootWithLocalMode(ds.storyRegistry, ds.soundscapeRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            }
        }

        setTimeout(function() {
            if (!booted) {
                console.warn('[Backstage] Preload timeout, falling back to local mode');
                safeBoot('local');
            }
        }, 10000);

        attemptPreload(ds.storyRegistry).then(function(ok) {
            safeBoot(ok ? 'firestore' : 'local');
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        window.Backstage.Auth.guard().then(function() {
            init();
        }).catch(function(err) {
            console.error('[Backstage] Auth guard failed', err);
        });
    });
})();
