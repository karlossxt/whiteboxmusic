/* Dashboard Module */
(function() {
    window.WBAdmin = window.WBAdmin || {};

    var section = null;

    function render() {
        var storyStats = window.WBAdmin.storiesService.getStats();
        var ssStats = window.WBAdmin.soundscapesService.getStats();

        section.innerHTML = '';

        var statsGrid = document.createElement('div');
        statsGrid.className = 'admin-stats';

        var cards = [
            { num: storyStats.total, label: 'Historias' },
            { num: storyStats.published, label: 'Historias publicadas' },
            { num: ssStats.total, label: 'Canciones' },
            { num: ssStats.published, label: 'Canciones publicadas' }
        ];

        cards.forEach(function(c) {
            var card = document.createElement('div');
            card.className = 'stat-card';
            var numDiv = document.createElement('div');
            numDiv.className = 'stat-number';
            numDiv.textContent = c.num;
            var labelDiv = document.createElement('div');
            labelDiv.className = 'stat-label';
            labelDiv.textContent = c.label;
            card.appendChild(numDiv);
            card.appendChild(labelDiv);
            statsGrid.appendChild(card);
        });

        section.appendChild(statsGrid);

        var quickActions = document.createElement('div');
        quickActions.className = 'dashboard-actions';

        var storyBtn = document.createElement('button');
        storyBtn.className = 'btn-primary';
        storyBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Historia';
        storyBtn.addEventListener('click', function() {
            window.WBAdmin.router.navigate('stories');
            setTimeout(function() { window.WBAdmin.stories.openAdd(); }, 100);
        });
        quickActions.appendChild(storyBtn);

        var ssBtn = document.createElement('button');
        ssBtn.className = 'btn-primary';
        ssBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Nueva Cancion';
        ssBtn.addEventListener('click', function() {
            window.WBAdmin.router.navigate('soundscapes');
            setTimeout(function() { window.WBAdmin.soundscapes.openAdd(); }, 100);
        });
        quickActions.appendChild(ssBtn);

        var viewBtn = document.createElement('button');
        viewBtn.className = 'btn-secondary';
        viewBtn.innerHTML = '<i class="fa-solid fa-external-link"></i> Ver sitio';
        viewBtn.addEventListener('click', function() { window.open('../index.html', '_blank'); });
        quickActions.appendChild(viewBtn);

        section.appendChild(quickActions);
    }

    window.WBAdmin.dashboard = {
        mount: function(el) {
            section = el;
            render();
        },
        refresh: function() {
            if (section) render();
        }
    };
})();
