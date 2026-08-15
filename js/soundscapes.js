/* SOUNDSCAPES - Renderizado dinámico y reproductor */

document.addEventListener('DOMContentLoaded', function() {

    var grid = document.querySelector('.soundscapes-grid');
    if (!grid) return;

    var playerInitialized = false;

    function buildCard(item) {
        var card = document.createElement('div');
        card.className = 'soundscapes-card';
        card.setAttribute('data-titulo', item.title || '');
        card.setAttribute('data-artista', item.artist || '');
        card.setAttribute('data-portada', item.cover || '');
        card.setAttribute('data-spotify', item.spotifyUrl || item.spotify || '');
        card.setAttribute('data-playlist', item.playlist || '');
        card.setAttribute('data-duracion', item.duration || 180);

        var imageWrapper = document.createElement('div');
        imageWrapper.className = 'card-image-wrapper';

        var nowPlaying = document.createElement('div');
        nowPlaying.className = 'now-playing-indicator';
        var waves = document.createElement('div');
        waves.className = 'now-playing-waves';
        for (var w = 0; w < 4; w++) { waves.appendChild(document.createElement('span')); }
        nowPlaying.appendChild(waves);
        nowPlaying.appendChild(document.createTextNode(' Now Playing'));
        imageWrapper.appendChild(nowPlaying);

        var img = document.createElement('img');
        img.src = item.cover || '';
        img.alt = item.title || '';
        img.loading = 'lazy';
        imageWrapper.appendChild(img);

        var playBtn = document.createElement('button');
        playBtn.className = 'card-play-btn';
        playBtn.setAttribute('aria-label', 'Reproducir ' + (item.title || ''));
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        imageWrapper.appendChild(playBtn);

        var info = document.createElement('div');
        info.className = 'card-info';

        var titleEl = document.createElement('h3');
        titleEl.className = 'card-title';
        titleEl.textContent = item.title;
        info.appendChild(titleEl);

        var artistEl = document.createElement('p');
        artistEl.className = 'card-artist';
        artistEl.textContent = item.artist;
        info.appendChild(artistEl);

        var tag = document.createElement('div');
        tag.className = 'card-playlist-tag';
        var tagLabel = document.createElement('span');
        tagLabel.className = 'tag-label';
        tagLabel.textContent = 'Spotify Playlist:';
        tag.appendChild(tagLabel);
        var tagName = document.createElement('span');
        tagName.className = 'tag-name';
        tagName.textContent = item.playlist;
        tag.appendChild(tagName);
        info.appendChild(tag);

        card.appendChild(imageWrapper);
        card.appendChild(info);
        return card;
    }

    function showGridState(className, icon, text) {
        grid.textContent = '';
        var el = document.createElement('div');
        el.className = className;
        var iconEl = document.createElement('i');
        iconEl.className = icon;
        el.appendChild(iconEl);
        var p = document.createElement('p');
        p.textContent = text;
        el.appendChild(p);
        grid.appendChild(el);
    }

    function setFallbackBanner(visible) {
        var banner = document.getElementById('soundscapesFallbackBanner');
        if (banner) banner.style.display = visible ? '' : 'none';
    }

    function renderSoundscapes() {
        showGridState('soundscapes-loading', 'fa-solid fa-spinner fa-spin', 'Cargando soundscapes...');

        window.WhiteBoxSoundscapes.loadPublished().then(function(items) {
            grid.textContent = '';

            if (!items || items.length === 0) {
                showGridState('soundscapes-empty', 'fa-solid fa-music', 'No hay soundscapes publicados todavia. Vuelve pronto.');
                setFallbackBanner(false);
            } else {
                items.forEach(function(item) { grid.appendChild(buildCard(item)); });
                setFallbackBanner(window.WhiteBoxSoundscapes.lastSource !== 'supabase');
            }

            if (!playerInitialized) {
                initPlayer();
                playerInitialized = true;
            }
        }).catch(function(err) {
            console.error('[Soundscapes] No se pudo renderizar:', err);
            showGridState('soundscapes-error', 'fa-solid fa-triangle-exclamation', 'No se pudo cargar la musica.');
            setFallbackBanner(false);
            if (!playerInitialized) {
                initPlayer();
                playerInitialized = true;
            }
        });
    }

    function initPlayer() {
        var elPlayerBar = document.getElementById('playerBar');
        var elThumb = document.getElementById('playerThumb');
        var elTrackName = document.getElementById('playerTrackName');
        var elTrackArtist = document.getElementById('playerTrackArtist');
        var elPlaylist = document.getElementById('playerPlaylist');
        var elTotalTime = document.getElementById('totalTime');
        var elCurrentTime = document.getElementById('currentTime');
        var elProgressFill = document.getElementById('progressFill');
        var elPlayPauseIcon = document.getElementById('playPauseIcon');
        var elProgressBar = document.getElementById('progressBar');
        var elVolumeFill = document.getElementById('volumeFill');
        var elVolumeIcon = document.getElementById('volumeIcon');
        var elVolumeBar = document.getElementById('volumeBar');
        var elShuffle = document.getElementById('btnShuffle');
        var elRepeat = document.getElementById('btnRepeat');
        var elLike = document.getElementById('playerLike');
        var elSpotify = document.getElementById('btnSpotify');

        var currentCard = null;
        var isPlaying = false;
        var progressInterval = null;
        var currentProgress = 0;
        var totalDuration = 0;
        var isShuffle = false;
        var isRepeat = false;
        var isMuted = false;
        var isLiked = false;
        var volume = 70;

        function formatTime(sec) {
            var m = Math.floor(sec / 60);
            var s = Math.floor(sec % 60);
            return m + ':' + (s < 10 ? '0' : '') + s;
        }

        function readCardData(card) {
            return {
                titulo: card.getAttribute('data-titulo') || 'Unknown',
                artista: card.getAttribute('data-artista') || 'Unknown',
                portada: card.getAttribute('data-portada') || '',
                spotify: card.getAttribute('data-spotify') || '#',
                playlist: card.getAttribute('data-playlist') || '',
                duracion: parseInt(card.getAttribute('data-duracion'), 10) || 180
            };
        }

        function updatePlayerUI(data) {
            var trackInfo = document.querySelector('.player-track-info');
            trackInfo.classList.add('fade-out');

            setTimeout(function() {
                elThumb.src = data.portada;
                elTrackName.textContent = data.titulo;
                elTrackArtist.textContent = data.artista;
                elPlaylist.textContent = 'Spotify Playlist: ' + data.playlist;
                elTotalTime.textContent = formatTime(data.duracion);
                elCurrentTime.textContent = '0:00';
                elProgressFill.style.width = '0%';
                elPlayPauseIcon.className = 'fa-solid fa-pause';
                elPlayerBar.classList.remove('player-inactive');

                if (data.spotify && data.spotify !== '#' && data.spotify.includes('spotify.com/track/')) {
                    elSpotify.href = data.spotify;
                    elSpotify.classList.remove('disabled');
                } else {
                    elSpotify.href = '#';
                    elSpotify.classList.add('disabled');
                }

                trackInfo.classList.remove('fade-out');
            }, 150);

            var allCards = grid.querySelectorAll('.soundscapes-card');
            allCards.forEach(function(c) { c.classList.remove('active-card'); });
            if (currentCard) currentCard.classList.add('active-card');

            var allBtns = grid.querySelectorAll('.card-play-btn');
            allBtns.forEach(function(btn) {
                btn.classList.remove('active');
                btn.querySelector('i').className = 'fa-solid fa-play';
            });
            var activeBtn = currentCard.querySelector('.card-play-btn');
            activeBtn.classList.add('active');
            activeBtn.querySelector('i').className = 'fa-solid fa-pause';
        }

        function playCard(card) {
            if (currentCard === card && isPlaying) { pauseTrack(); return; }
            currentCard = card;
            isPlaying = true;
            currentProgress = 0;
            var data = readCardData(card);
            totalDuration = data.duracion;
            updatePlayerUI(data);
            startProgress();
        }

        function pauseTrack() {
            isPlaying = false;
            elPlayPauseIcon.className = 'fa-solid fa-play';
            if (currentCard) {
                var btn = currentCard.querySelector('.card-play-btn');
                btn.querySelector('i').className = 'fa-solid fa-play';
            }
            clearInterval(progressInterval);
        }

        function togglePlay() {
            if (!currentCard) return;
            if (isPlaying) pauseTrack(); else playCard(currentCard);
        }

        function nextTrack() {
            if (!currentCard) return;
            var all = Array.from(grid.querySelectorAll('.soundscapes-card'));
            var idx = all.indexOf(currentCard);
            var next;
            if (isShuffle) { next = Math.floor(Math.random() * all.length); } else { next = (idx + 1) % all.length; }
            playCard(all[next]);
        }

        function prevTrack() {
            if (!currentCard) return;
            if (currentProgress > 3) { currentProgress = 0; elProgressFill.style.width = '0%'; elCurrentTime.textContent = '0:00'; return; }
            var all = Array.from(grid.querySelectorAll('.soundscapes-card'));
            var idx = all.indexOf(currentCard);
            var prev = (idx - 1 + all.length) % all.length;
            playCard(all[prev]);
        }

        function startProgress() {
            clearInterval(progressInterval);
            progressInterval = setInterval(function() {
                if (!isPlaying) return;
                currentProgress += 0.5;
                if (currentProgress >= totalDuration) {
                    if (isRepeat) { currentProgress = 0; } else { nextTrack(); return; }
                }
                elProgressFill.style.width = ((currentProgress / totalDuration) * 100) + '%';
                elCurrentTime.textContent = formatTime(currentProgress);
            }, 500);
        }

        function seekTrack(e) {
            if (!currentCard) return;
            var rect = elProgressBar.getBoundingClientRect();
            var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            currentProgress = pct * totalDuration;
            elProgressFill.style.width = (pct * 100) + '%';
            elCurrentTime.textContent = formatTime(currentProgress);
        }

        function toggleShuffle() { isShuffle = !isShuffle; elShuffle.classList.toggle('ctrl-active', isShuffle); }
        function toggleRepeat() { isRepeat = !isRepeat; elRepeat.classList.toggle('ctrl-active', isRepeat); }
        function toggleLike() { isLiked = !isLiked; elLike.className = isLiked ? 'fa-solid fa-heart player-like active' : 'fa-regular fa-heart player-like'; }

        function toggleMute() {
            isMuted = !isMuted;
            elVolumeIcon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            elVolumeFill.style.width = isMuted ? '0%' : volume + '%';
        }

        function setVolume(e) {
            var rect = elVolumeBar.getBoundingClientRect();
            volume = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
            elVolumeFill.style.width = volume + '%';
            if (isMuted && volume > 0) { isMuted = false; elVolumeIcon.className = 'fa-solid fa-volume-high'; }
        }

        elVolumeFill.style.width = volume + '%';

        grid.addEventListener('click', function(e) {
            var playBtn = e.target.closest('.card-play-btn');
            if (playBtn) {
                var card = playBtn.closest('.soundscapes-card');
                if (card) playCard(card);
                return;
            }
            var card = e.target.closest('.soundscapes-card');
            if (card) playCard(card);
        });

        window.togglePlay = togglePlay;
        window.nextTrack = nextTrack;
        window.prevTrack = prevTrack;
        window.toggleShuffle = toggleShuffle;
        window.toggleRepeat = toggleRepeat;
        window.toggleLike = toggleLike;
        window.toggleMute = toggleMute;
        window.setVolume = setVolume;
        window.seekTrack = seekTrack;

        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (document.getElementById('storiesModalOverlay') &&
                document.getElementById('storiesModalOverlay').classList.contains('active')) return;
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextTrack();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    prevTrack();
                    break;
            }
        });
    }

    renderSoundscapes();
});
