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
    /* Espera entre reintentos, en segundos. El primer reintento
       espera BACKOFF*1, el segundo BACKOFF*2, etc. */
    var RETRY_BACKOFF_SEC = 2;
    /* Presupuesto total de reintentos. El intento 1 falla de
       inmediato; entre intento N y N+1 se espera BACKOFF*N. Con
       MAX_RETRIES=3 son dos esperas: 2s + 4s = 6s.
       El timeout de seguridad tiene que ser MAYOR que esto, o el
       fallback automatico le ganaba la carrera a la pantalla de error
       y sus botones nunca eran usables. */
    var RETRY_BUDGET_MS = (function() {
        var sum = 0;
        for (var i = 1; i < MAX_RETRIES; i++) sum += RETRY_BACKOFF_SEC * i;
        return sum * 1000;
    })();
    var PRELOAD_TIMEOUT_MS = RETRY_BUDGET_MS + 8000;

    /* ------------------------------------------
       UI: Loading screen
       ------------------------------------------ */
    function showApp() {
        var loading = document.getElementById('adminLoading');
        var layout = document.getElementById('adminLayout');
        if (loading) loading.style.display = 'none';
        if (layout) layout.style.display = '';
    }

    /* Refleja si la pantalla de error esta visible. La usa el arranque
       para no taparle la decision al usuario: si los reintentos ya se
       agotaron, los botones ("Reintentar" / "Continuar en modo local")
       son los que deciden, no un fallback automatico. */
    function isPreloadErrorVisible() {
        var el = document.getElementById('adminPreloadError');
        return !!(el && el.style.display && el.style.display !== 'none');
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
        var artistRegistry = new window.Backstage.DatasourceRegistry();
        var siteConfigRegistry = new window.Backstage.DatasourceRegistry();
        var galleryRegistry = new window.Backstage.DatasourceRegistry();
        var sectionRegistry = new window.Backstage.DatasourceRegistry();
        var local = new window.Backstage.LocalDatasource();

        // Soundscapes, interviews, siteConfig, gallery, section siempre inician en local
        soundscapeRegistry.register('local', local);
        soundscapeRegistry.setActive('local');

        interviewRegistry.register('local', local);
        interviewRegistry.setActive('local');

        artistRegistry.register('local', local);
        artistRegistry.setActive('local');

        siteConfigRegistry.register('local', local);
        siteConfigRegistry.setActive('local');

        galleryRegistry.register('local', local);
        galleryRegistry.setActive('local');

        sectionRegistry.register('local', local);
        sectionRegistry.setActive('local');

        // Story puede usar Supabase si está disponible.
        // Hay que pedir el cliente con getSupabaseClient() en vez de leer
        // WhiteBoxSupabase.client a secas: ese campo solo se llena cuando
        // alguien llama a getSupabaseClient() (lo hacia auth-guard.js), y
        // leerlo directo nos dejaba en local sin avisar.
        var supa = null;
        try {
            if (typeof window.getSupabaseClient === 'function') {
                supa = window.getSupabaseClient();
            } else if (window.WhiteBoxSupabase) {
                supa = window.WhiteBoxSupabase.client;
            }
        } catch (e) {
            console.warn('[Backstage] No se pudo obtener el cliente de Supabase:', e.message);
        }
        var storySupabaseReady = false;
        try {
            if (supa) {
                var storySupa = new window.Backstage.SupabaseDatasource(supa);
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
        window.Backstage.artistDatasourceRegistry = artistRegistry;
        window.Backstage.siteConfigDatasourceRegistry = siteConfigRegistry;
        window.Backstage.galleryDatasourceRegistry = galleryRegistry;
        window.Backstage.sectionDatasourceRegistry = sectionRegistry;
        window.Backstage.datasource = storyRegistry;

        return {
            storyRegistry: storyRegistry,
            soundscapeRegistry: soundscapeRegistry,
            interviewRegistry: interviewRegistry,
            artistRegistry: artistRegistry,
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
        var COLLECTIONS = [
            { table: 'stories', key: 'stories_data' },
            { table: 'soundscapes', key: 'soundscapes_data' },
            { table: 'interviews', key: 'interviews_data' },
            { table: 'artists', key: 'artists_data' },
            { table: 'gallery', key: 'gallery_events_data' },
            { table: 'site_content', key: 'site_content' },
            { table: 'site_config', key: 'site_config' }
        ];

        storyDs._cache = storyDs._cache || {};
        storyDs._loadErrors = storyDs._loadErrors || [];

        function loadCollection(index) {
            if (index >= COLLECTIONS.length) {
                return Promise.resolve({
                    stories: storyDs._cache['stories_data'] ? storyDs._cache['stories_data'].length : 0,
                    sections: storyDs._cache['site_content'] ? storyDs._cache['site_content'].length : 0,
                    gallery: storyDs._cache['gallery_events_data'] ? storyDs._cache['gallery_events_data'].length : 0,
                    soundscapes: storyDs._cache['soundscapes_data'] ? storyDs._cache['soundscapes_data'].length : 0,
                    interviews: storyDs._cache['interviews_data'] ? storyDs._cache['interviews_data'].length : 0,
                    artists: storyDs._cache['artists_data'] ? storyDs._cache['artists_data'].length : 0,
                    siteConfig: storyDs._cache['site_config'] ? storyDs._cache['site_config'].length : 0
                });
            }

            var entry = COLLECTIONS[index];
            return storyDs._collectionRef(entry.table).get().then(function(snapshot) {
                var items = [];
                snapshot.forEach(function(doc) {
                    var data = doc;
                    data.id = doc.id || doc._id;
                    items.push(data);
                });
                storyDs._cache[entry.key] = items;

                /* El datasource se traga el error de la query y
                   devuelve una coleccion vacia, asi que la cache
                   queda indistinguible de "la tabla existe pero no
                   tiene filas". Guardamos cuales fallaron para poder
                   distinguir los dos casos y no mostrar un estado
                   vacio que mienta (ej: "aun no hay artistas" cuando
                   en realidad la tabla no existe). */
                if (snapshot.error) {
                    storyDs._loadErrors.push({
                        table: entry.table,
                        key: entry.key,
                        error: snapshot.error
                    });
                }

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
                    }, RETRY_BACKOFF_SEC * 1000 * retryCount);
                });
            }

            showPreloadError(false);
            return false;
        });
    }

    function bootWithLocalMode(storyReg, soundscapeReg, interviewReg, artistReg, siteConfigReg, galleryReg, sectionReg, local) {
        window.Backstage._localMode = true;

        /* En local la tabla no aplica: los datos viven en
           localStorage y la semilla legacy se aplica abajo. */
        window.Backstage.missingTables = [];
        window.Backstage.artistTableMissing = false;

        /* Asegurar que el datasource activo sea local */
        storyReg.setActive('local');
        soundscapeReg.setActive('local');
        interviewReg.setActive('local');
        artistReg.setActive('local');
        siteConfigReg.setActive('local');
        galleryReg.setActive('local');
        sectionReg.setActive('local');

        var storyRepo = new window.Backstage.StoryRepository(storyReg);
        var soundscapeRepo = new window.Backstage.SoundscapeRepository(soundscapeReg);
        var interviewRepo = new window.Backstage.InterviewRepository(interviewReg);
        var artistRepo = new window.Backstage.ArtistRepository(artistReg);
        var siteConfigRepo = new window.Backstage.SiteConfigRepository(local);
        var galleryRepo = new window.Backstage.GalleryRepository(galleryReg);
        var sectionRepo = new window.Backstage.SectionRepository(local);

        if (typeof storiesDataDefault !== 'undefined') {
            storyRepo.migrateFromDefaults(storiesDataDefault);
        }
        if (typeof soundscapesDataDefault !== 'undefined') {
            soundscapeRepo.migrateFromDefaults(soundscapesDataDefault);
        }
        if (window.WhiteBoxArtists && window.WhiteBoxArtists.LEGACY_ARTISTS) {
            artistRepo.migrateFromDefaults(window.WhiteBoxArtists.LEGACY_ARTISTS);
        }
        if (window.WhiteBoxSiteSchema) {
            sectionRepo.migrateFromDefaults(window.WhiteBoxSiteSchema);
        }
        siteConfigRepo.migrateFromDefaults();

        bootApp(storyReg, soundscapeReg, interviewReg, artistReg, siteConfigReg, galleryReg, storyRepo, soundscapeRepo, interviewRepo, artistRepo, siteConfigRepo, galleryRepo, sectionRepo, false);
    }

    /* ------------------------------------------
       4. BOOT APP
       ------------------------------------------ */
    function bootApp(storyReg, soundscapeReg, interviewReg, artistReg, siteConfigReg, galleryReg, storyRepo, soundscapeRepo, interviewRepo, artistRepo, siteConfigRepo, galleryRepo, sectionRepo, isSupabase) {
        var storyService = new window.Backstage.StoryService(storyRepo);
        var soundscapeService = new window.Backstage.SoundscapeService(soundscapeRepo);
        var interviewService = new window.Backstage.InterviewService(interviewRepo);
        var artistService = new window.Backstage.ArtistService(artistRepo);
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

        var artistView = window.Backstage.Views.Artist;
        artistView.init('section-artists');

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
        var artistCtrl = new window.Backstage.Controllers.Artist(artistService, artistView);
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

        router.register('artists', {
            title: 'Artistas de Descubre',
            subtitle: 'Administra las tarjetas de la seccion "Descubre"',
            mount: function() {
                showSection('artists');
                window.Backstage.Components.Sidebar.setActive('artists');
                window.Backstage.Components.Header.updateForRoute('artists');
                artistCtrl.mount();
                window.Backstage.Components.Header.showOnly('btnAddArtist');
            },
            unmount: function() { artistCtrl.unmount(); }
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
            if (e.key === 'backstage_artists_data' || e.key === 'backstage_artists_data_backup') {
                var current7 = router.getCurrent();
                if (current7 === 'artists') artistCtrl.refresh();
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

    /* Botones de la pantalla de error de Supabase.
       Recibe callbacks en vez de los registries porque el arranque
       tiene que pasar por safeBoot(), que es lo unico que evita un
       doble boot si el usuario insiste en el boton. */
    function bindErrorScreenButtons(onRetry, onLocal) {
        var retryBtn = document.getElementById('preloadRetryBtn');
        var localBtn = document.getElementById('preloadLocalBtn');

        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                if (typeof onRetry === 'function') onRetry();
            });
        }

        if (localBtn) {
            localBtn.addEventListener('click', function() {
                if (typeof onLocal === 'function') onLocal();
            });
        }
    }

    function bootWithSupabase(storyReg, soundscapeReg, interviewReg, artistReg, siteConfigReg, galleryReg, sectionReg, local) {
        var storyDs = storyReg.sources['supabase'];
        if (!storyDs) {
            // Fallback a local si Supabase no está disponible
            bootWithLocalMode(storyReg, soundscapeReg, interviewReg, artistReg, siteConfigReg, galleryReg, sectionReg, local);
            return;
        }

        window.Backstage._localMode = false;

        /* Tablas que no se pudieron leer, normalmente porque aun no
           existen. Sin esto la vista no puede distinguir "no has
           agregado nada" de "no puedo leer nada", y el estado vacio
           termina mintiendo. */
        var failedTables = (storyDs._loadErrors || []).map(function(entry) {
            return entry.table;
        });
        window.Backstage.missingTables = failedTables;
        window.Backstage.artistTableMissing = failedTables.indexOf('artists') !== -1;

        /*
         * Registros que apuntan a Supabase.
         * Todos usan el mismo datasource pre-cargado, que ya
         * contiene stories, soundscapes, interviews y site_config.
         */
        var supabaseStoryRegistry = new window.Backstage.DatasourceRegistry();
        var supabaseSoundscapeRegistry = new window.Backstage.DatasourceRegistry();
        var supabaseInterviewRegistry = new window.Backstage.DatasourceRegistry();

        supabaseStoryRegistry.register('supabase', storyDs);
        supabaseStoryRegistry.register('local', local);
        supabaseStoryRegistry.setActive('supabase');

        supabaseSoundscapeRegistry.register('supabase', storyDs);
        supabaseSoundscapeRegistry.register('local', local);
        supabaseSoundscapeRegistry.setActive('supabase');

        supabaseInterviewRegistry.register('supabase', storyDs);
        supabaseInterviewRegistry.register('local', local);
        supabaseInterviewRegistry.setActive('supabase');

        var supabaseArtistRegistry = new window.Backstage.DatasourceRegistry();
        supabaseArtistRegistry.register('supabase', storyDs);
        supabaseArtistRegistry.register('local', local);
        supabaseArtistRegistry.setActive('supabase');

        /*
         * Ahora sí creamos REPOSITORIES.
         */
        var storyRepo =
            new window.Backstage.StoryRepository(
                supabaseStoryRegistry
            );

        var soundscapeRepo =
            new window.Backstage.SoundscapeRepository(
                supabaseSoundscapeRegistry
            );

        var interviewRepo =
            new window.Backstage.InterviewRepository(
                supabaseInterviewRegistry
            );

        var artistRepo =
            new window.Backstage.ArtistRepository(
                supabaseArtistRegistry
            );

        /*
         * Configuración, galería y secciones
         * también se leen de Supabase para que el panel
         * muestre el mismo contenido que el sitio público.
         */
        var siteConfigRepo =
            new window.Backstage.SiteConfigRepository(
                supabaseStoryRegistry
            );

        var galleryRepo =
            new window.Backstage.GalleryRepository(
                supabaseStoryRegistry
            );

        var sectionRepo =
            new window.Backstage.SectionRepository(
                supabaseStoryRegistry
            );

        bootApp(
            supabaseStoryRegistry,
            supabaseSoundscapeRegistry,
            supabaseInterviewRegistry,
            supabaseArtistRegistry,
            siteConfigReg,
            galleryReg,

            storyRepo,
            soundscapeRepo,
            interviewRepo,
            artistRepo,
            siteConfigRepo,
            galleryRepo,
            sectionRepo,

            true
        );
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
                bootWithSupabase(ds.storyRegistry, ds.soundscapeRegistry, ds.interviewRegistry, ds.artistRegistry, ds.siteConfigRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            } else {
                bootWithLocalMode(ds.storyRegistry, ds.soundscapeRegistry, ds.interviewRegistry, ds.artistRegistry, ds.siteConfigRegistry, ds.galleryRegistry, ds.sectionRegistry, ds.local);
            }
        }

        // Botones de la pantalla de error: reconectar, o seguir en local.
        // Ambos pasan por safeBoot para no arrancar la app dos veces.
        bindErrorScreenButtons(
            function retryPreload() {
                retryCount = 0;
                showPreloadError(true);
                attemptPreload(ds.storyRegistry).then(function(ok) {
                    if (ok) {
                        safeBoot('supabase');
                    } else {
                        showPreloadError(false);
                    }
                });
            },
            function goLocal() {
                hidePreloadError();
                safeBoot('local');
            }
        );

        // Red de seguridad por si el preload se queda colgado sin
        // resolver. Va MAS ALLÁ del presupuesto de reintentos a
        // propósito: si no, este timeout le ganaba la carrera a la
        // pantalla de error y sus botones nunca se podían usar.
        setTimeout(function() {
            if (!booted) {
                console.warn('[Backstage] Preload timeout, falling back to local mode');
                safeBoot('local');
            }
        }, PRELOAD_TIMEOUT_MS);

        attemptPreload(ds.storyRegistry).then(function(ok) {
            if (ok) {
                safeBoot('supabase');
                return;
            }
            // Si se agotaron los reintentos, la pantalla de error ya
            // esta visible con sus botones: esperamos a que el usuario
            // elija. Si no hay nada visible (p.ej. no habia datasource
            // de Supabase), arrancamos en local sin interrumpir.
            if (isPreloadErrorVisible()) return;
            safeBoot('local');
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