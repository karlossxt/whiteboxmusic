/* ============================================
   BACKSTAGE STUDIO — Stress Test Script
   Ejecutar en consola del navegador.
   
   Uso:
     StressTest.generate(100)   — genera 100 historias de prueba
     StressTest.generate(500)   — genera 500 historias
     StressTest.generate(1000)  — genera 1000 historias
     StressTest.measure()       — mide tiempos de carga/render
     StressTest.clean()         — elimina SOLO datos de prueba
     StressTest.report()        — muestra resumen de almacenamiento
   ============================================ */

var StressTest = (function() {
    var STORAGE_KEY = 'backstage_stories_data';
    var TEST_PREFIX = 'test-story-';
    var categories = ['Rock', 'Metal', 'Indie', 'Pop', 'Jazz', 'Otro'];
    var titles = [
        'La noche del concierto', 'Vinilos y recuerdos', 'Rock en el garaje',
        'Festival perdido', 'El primer ensayo', 'Cancion para nadie',
        'Bajo tierra', 'Luces de neon', 'Guitarra rota', 'El ultimo show',
        'Ritmo salvaje', 'Silencio after hours', 'Revolucion sonora',
        'La banda invisible', 'Ecos del pasado', 'Noche de estrellas',
        'El estudio casero', 'Melodia perdida', 'Puertas cerradas',
        'El camino del rock', 'Suenos de vinilo', 'Canto urbano',
        'La escena subterranea', 'Horas extras', 'El sonido del barrio'
    ];

    function generateId() {
        return 'test-story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }

    function randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function randomText(minLen, maxLen) {
        var words = 'la el de en un una por con para sin sobre entre hasta desde contra'.split(' ');
        var result = '';
        while (result.length < minLen) {
            result += (result ? ' ' : '') + randomItem(words);
        }
        return result.substr(0, maxLen);
    }

    function generate(count) {
        console.time('StressTest.generate');
        var existing = [];
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) existing = JSON.parse(raw);
            if (!Array.isArray(existing)) existing = [];
        } catch (e) { existing = []; }

        var testStories = [];
        for (var i = 0; i < count; i++) {
            testStories.push({
                id: generateId(),
                title: randomItem(titles) + ' #' + (i + 1),
                slug: 'test-story-' + (i + 1),
                excerpt: randomText(80, 200),
                category: randomItem(categories),
                author: 'Tester #' + (i + 1),
                image: '',
                content: randomText(500, 2000),
                status: Math.random() > 0.5 ? 'published' : 'draft',
                featured: Math.random() > 0.8,
                date: 'Test 2026',
                createdAt: Date.now() - Math.floor(Math.random() * 86400000),
                updatedAt: Date.now() - Math.floor(Math.random() * 86400000),
                order: i + 1,
                location: 'Test City',
                relatedSong: '',
                initialLikes: Math.floor(Math.random() * 100)
            });
        }

        var combined = existing.concat(testStories);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
        } catch (e) {
            console.error('localStorage is full or unavailable:', e.message);
            var size = new Blob([JSON.stringify(combined)]).size;
            console.error('Attempted to write ~' + Math.round(size / 1024) + ' KB');
            return false;
        }

        console.timeEnd('StressTest.generate');
        console.log('Generated ' + count + ' test stories. Total: ' + combined.length);
        report();
        return true;
    }

    function clean() {
        console.time('StressTest.clean');
        var existing = [];
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) existing = JSON.parse(raw);
            if (!Array.isArray(existing)) existing = [];
        } catch (e) { existing = []; }

        var before = existing.length;
        var cleaned = existing.filter(function(s) {
            return s.id && s.id.indexOf('test-story-') !== 0;
        });
        var removed = before - cleaned.length;

        try {
            if (cleaned.length > 0) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.error('Error cleaning:', e.message);
        }

        console.timeEnd('StressTest.clean');
        console.log('Removed ' + removed + ' test stories. Remaining: ' + cleaned.length);
        report();
        return removed;
    }

    function measure() {
        var results = {};
        var t0, t1;

        t0 = performance.now();
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var parsed = raw ? JSON.parse(raw) : [];
            t1 = performance.now();
            results.localStorageRead = Math.round(t1 - t0) + 'ms';
            results.totalStories = Array.isArray(parsed) ? parsed.length : 0;
        } catch (e) {
            results.localStorageRead = 'ERROR: ' + e.message;
        }

        var repo = window.Backstage && window.Backstage.StoryService;
        if (repo) {
            t0 = performance.now();
            var svc = new window.Backstage.StoryService(
                new window.Backstage.StoryRepository(window.Backstage.datasource)
            );
            var all = svc.getAll();
            t1 = performance.now();
            results.getAll = Math.round(t1 - t0) + 'ms (' + all.length + ' stories)';

            t0 = performance.now();
            var stats = svc.getStats();
            t1 = performance.now();
            results.getStats = Math.round(t1 - t0) + 'ms';

            t0 = performance.now();
            var searched = svc.search('test');
            t1 = performance.now();
            results.search = Math.round(t1 - t0) + 'ms (' + searched.length + ' results)';

            var size = new Blob([raw || '[]']).size;
            results.storageSize = Math.round(size / 1024) + ' KB';

            if (typeof navigator.storage !== 'undefined' && navigator.storage.estimate) {
                navigator.storage.estimate().then(function(est) {
                    console.log('Storage estimate:', Math.round(est.usage / 1024) + ' KB used of ' + Math.round(est.quota / 1024) + ' KB');
                });
            }
        }

        console.table(results);
        return results;
    }

    function report() {
        var raw = localStorage.getItem(STORAGE_KEY);
        var parsed = [];
        try { parsed = raw ? JSON.parse(raw) : []; } catch (e) {}
        var size = new Blob([raw || '[]']).size;
        var testCount = parsed.filter(function(s) { return s.id && s.id.indexOf('test-story-') === 0; }).length;
        var realCount = parsed.length - testCount;

        console.log('=== Storage Report ===');
        console.log('Total stories: ' + parsed.length);
        console.log('Real stories: ' + realCount);
        console.log('Test stories: ' + testCount);
        console.log('Storage size: ' + Math.round(size / 1024) + ' KB');
        console.log('Approximate per story: ' + (parsed.length > 0 ? Math.round(size / parsed.length) : 0) + ' bytes');

        if (size > 4 * 1024 * 1024) {
            console.warn('WARNING: Approaching localStorage limit (~5MB)');
        }
    }

    function runFullTest(count) {
        console.log('=== Starting full stress test with ' + count + ' stories ===');
        clean();
        generate(count);
        measure();

        console.log('');
        console.log('=== Manual test instructions ===');
        console.log('1. Reload the page');
        console.log('2. Navigate to Historias section');
        console.log('3. Test search, filters, sort');
        console.log('4. Open the editor (click Nueva Historia)');
        console.log('5. Create/edit/duplicate/delete stories');
        console.log('6. Check Dashboard stats');
        console.log('7. When done, run: StressTest.clean()');
    }

    return {
        generate: generate,
        clean: clean,
        measure: measure,
        report: report,
        runFullTest: runFullTest
    };
})();
