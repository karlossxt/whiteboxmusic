/* App - Router y inicializacion */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var routes = {
        dashboard: {
            render: renderDashboard,
            title: 'Dashboard',
            subtitle: 'Vista general del sitio'
        },
        stories: {
            render: renderStories,
            title: 'Gestionar Historias',
            subtitle: 'Administra las tarjetas de la seccion "Stories From The Scene"'
        },
        soundscapes: {
            render: renderSoundscapes,
            title: 'Latest Soundscapes',
            subtitle: 'Gestiona las tarjetas de Spotify'
        }
    };

    var currentSection = null;

    function setActiveNav(route) {
        var items = document.querySelectorAll('.admin-nav-item[data-section]');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('active');
            if (items[i].getAttribute('data-section') === route) {
                items[i].classList.add('active');
            }
        }
    }

    function updateHeader(route) {
        var r = routes[route];
        var h1 = document.querySelector('.admin-header h1');
        var sub = document.querySelector('.admin-subtitle');
        if (h1) h1.textContent = r.title;
        if (sub) sub.textContent = r.subtitle;
    }

    function showSection(route) {
        var sections = document.querySelectorAll('.admin-section');
        for (var i = 0; i < sections.length; i++) {
            sections[i].style.display = 'none';
        }
        var target = document.getElementById('section-' + route);
        if (target) target.style.display = 'block';
    }

    function renderDashboard(el) {
        window.WBAdmin.dashboard.mount(el);
    }

    function renderStories(el) {
        window.WBAdmin.stories.mount(el);
    }

    function renderSoundscapes(el) {
        window.WBAdmin.soundscapes.mount(el);
    }

    function unmountCurrent() {
        if (currentSection === 'stories' && window.WBAdmin.stories && window.WBAdmin.stories.unmount) {
            window.WBAdmin.stories.unmount();
        }
        if (currentSection === 'soundscapes' && window.WBAdmin.soundscapes && window.WBAdmin.soundscapes.unmount) {
            window.WBAdmin.soundscapes.unmount();
        }
    }

    function hideAllAddButtons() {
        var btnStory = document.getElementById('btnAddStory');
        var btnSs = document.getElementById('btnAddSoundscape');
        if (btnStory) btnStory.style.display = 'none';
        if (btnSs) btnSs.style.display = 'none';
    }

    function navigate(route) {
        if (!routes[route]) route = 'dashboard';
        if (route === currentSection) return;

        unmountCurrent();
        currentSection = route;
        setActiveNav(route);
        updateHeader(route);
        showSection(route);
        hideAllAddButtons();

        var target = document.getElementById('section-' + route);
        if (target) {
            routes[route].render(target);
        }

        if (window.location.hash !== '#' + route) {
            window.location.hash = route;
        }
    }

    function setupNav() {
        var items = document.querySelectorAll('.admin-nav-item[data-section]');
        for (var i = 0; i < items.length; i++) {
            items[i].addEventListener('click', function(e) {
                e.preventDefault();
                var route = this.getAttribute('data-section');
                if (route) navigate(route);
            });
        }
    }

    function handleHash() {
        var hash = window.location.hash.replace('#', '') || 'dashboard';
        navigate(hash);
    }

    window.WBAdmin.router = {
        navigate: navigate,
        getCurrent: function() { return currentSection; }
    };

    function setupGlobalKeys() {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                window.WBAdmin.modal.closeAll();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        setupNav();
        setupGlobalKeys();
        handleHash();
    });

    window.addEventListener('hashchange', handleHash);
})();
