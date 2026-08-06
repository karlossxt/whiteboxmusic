/* MÓDULO DE HISTORIAS - Implementación modular basada en Gemini React para whiteboxmusic */

(function(window, document) {
    'use strict';

    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        STORAGE_KEY: 'wbox_story_likes',
        MAX_INDEX_STORIES: 3,
        FALLBACK_IMAGE: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="680" height="340" fill="%231a1a1a"%3E%3Crect width="680" height="340"/%3E%3Ctext x="50%25" y="50%25" fill="%23444" font-size="16" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E',
        MODAL_SELECTORS: {
            overlay: '#storiesModalOverlay',
            modal: '#storiesModal',
            close: '#storiesModalClose',
            image: '#storiesModalImage',
            meta: '#storiesModalMeta',
            title: '#storiesModalTitle',
            author: '#storiesModalAuthor',
            story: '#storiesModalStory',
            song: '#storiesModalSong',
            songText: '#storiesModalSongText',
            likeBtn: '#storiesModalLikeBtn',
            likeCount: '#storiesModalLikeCount',
            date: '#storiesModalDate'
        }
    };

    // ===== UTILIDADES =====
    const Utils = {
        safeImageUrl: function(url) {
            if (!url || typeof url !== 'string') return '';
            var trimmed = url.trim();
            if (!trimmed) return '';
            var lower = trimmed.toLowerCase();
            if (lower.indexOf('javascript:') === 0) return '';
            if (lower.indexOf('data:text/html') === 0) return '';
            return trimmed;
        },

        escapeRegExp: function(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },

        getStorageItem: function(key, defaultValue) {
            try {
                var value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },

        setStorageItem: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('[StoriesModule] No se pudo guardar en localStorage:', e);
            }
        }
    };

    // ===== DATA MANAGEMENT =====
    const DataManager = (function() {
        var defaultStories = [
            {
                id: "story-1",
                title: "Cuando conocí a Blackpink",
                author: "Daniela Reyes",
                location: "Ciudad de México, MX",
                image: "Blackpint2.jpg",
                excerpt: "Esperé meses para ese concierto y, aun así, cuando se apagaron las luces sentí que no estaba preparada para lo que iba a vivir.",
                content: "Cuando conocí a Blackpink: Esperé meses para ese concierto y, aun así, cuando se apagaron las luces sentí que no estaba preparada para lo que iba a vivir. En cuanto sonó la primera canción y vi a Jisoo, Jennie, Rosé y Lisa salir al escenario, se me llenaron los ojos de lágrimas. Después de tantos videos y transmisiones, por fin las estaba viendo frente a mí.\n\nCanté cada canción con personas que ni siquiera conocía, pero que sentían la misma emoción que yo. Hubo momentos en los que solo me quedé observando el mar de lightsticks rosas iluminando todo el recinto. Fue una imagen que nunca voy a olvidar.\n\nEse concierto no solo me dejó fotos y videos. Me recordó lo bonito que es compartir la música con miles de personas al mismo tiempo. Desde ese día, cada vez que escucho una canción de Blackpink, vuelvo por un momento a esa noche que siempre llevaré en el corazón.",
                relatedSong: "Blackpink - Forever Young",
                status: "published",
                featured: true,
                order: 1,
                initialLikes: 124,
                date: "Octubre 2023"
            },
            {
                id: "story-2",
                title: "La noche que ensayamos en el garage y nació nuestra banda",
                author: "Tomas Aguirre",
                location: "Buenos Aires, AR",
                image: "garege.jpg",
                excerpt: "Éramos cuatro amigos que solo queríamos hacer ruido. Un garage inundado, amplificadores prestados y una batería que se tambaleaba. Fue todo lo que necesitamos.",
                content: "La noche que ensayamos en el garage y nació nuestra banda: Éramos cuatro amigos que solo queríamos hacer ruido. Un garage inundado, amplificadores prestados y una batería que se tambaleaba. Fue todo lo que necesitamos.\n\nEra invierno del 2021, estábamos todos encerrados por la pandemia y no teníamos nada que hacer. Alguien dijo \"¿por qué no ensayamos?\" y nadie dijo que no. Armamos los equipos en el garage de Martín, en Villa Crespo. No había silla para todos, el techo goteaba y el bajo hacía un ruido que no era del todo musical.\n\nPero algo mágico pasó esa noche. Las canciones salieron solas. No éramos buenos técnicamente, pero había una energía cruda que hacía que todo sonara real. Martín grabó todo con el celular y esa misma noche subimos dos temas a SoundCloud.\n\nA la mañana siguiente teníamos 200 reproducciones. Hoy somos Los Carport y tenemos un EP que nos grabamos nosotros mismos. Todo empezó con cuatro pendejos y un garage mojado. La música no necesita permiso para existir.",
                relatedSong: "Los Carport - Garage Sessions",
                status: "published",
                featured: false,
                order: 2,
                initialLikes: 87,
                date: "Agosto 2021"
            },
            {
                id: "story-3",
                title: "La tienda de vinilos que cambió la forma en que escucho música",
                author: "Kenji Watanabe",
                location: "Tokyo, JP",
                image: "tienda.jpg",
                excerpt: "Entré a Disk Union en Shimokitazawa buscando un regalo. Tres horas después salí con una nueva comprensión de lo que el sonido realmente significa.",
                content: "La tienda de vinilos que cambió la forma en que escucho música: Entré a Disk Union en Shimokitazawa buscando un regalo. Tres horas después salí con una nueva comprensión de lo que el sonido realmente significa. El dueño, un hombre mayor llamado Tanaka-san, me notó hojeando discos sin dirección.\n\nSe acercó y sin decir una palabra sacó una edición de un disco de jazz japonés de 1978 que nunca había escuchado. Lo puso en la tornamesa de la tienda y subió el volumen. Toda la tienda en silencio. Era crudo, imperfecto y hermoso.\n\nEse momento me enseñó que la música independiente no es solo un género. Es una filosofía. Se trata de encontrar belleza en las cosas que no están pulidas para el consumo masivo. Desde entonces colecciono vinilos y ahora dirijo un fanzine digital dedicado a la música underground japonesa. Todo porque un desconocido decidió compartir un disco conmigo.",
                relatedSong: "Naniwa Jazz Collective - Twilight in Osaka",
                status: "published",
                featured: false,
                order: 3,
                initialLikes: 63,
                date: "Noviembre 2022"
            }
        ];

        var storiesData = null;

        function initializeData() {
            try {
                var saved = localStorage.getItem('backstage_stories_data');
                if (saved) {
                    var parsed = JSON.parse(saved);
                    if (parsed && parsed.length) {
                        storiesData = parsed;
                        return;
                    }
                }
            } catch (e) {}

            try {
                var legacy = localStorage.getItem('wbox_stories_data');
                if (legacy) {
                    var parsed = JSON.parse(legacy);
                    if (parsed && parsed.length) {
                        storiesData = parsed;
                        return;
                    }
                }
            } catch (e) {}

            storiesData = defaultStories.slice();
        }

        function getPublishedStories() {
            var published = storiesData.filter(function(s) { return s.status === 'published'; });
            return published.sort(function(a, b) {
                return (a.order || 999) - (b.order || 999);
            });
        }

        function getStoryById(id) {
            return storiesData.find(function(s) { return s.id === id; });
        }

        initializeData();

        return {
            getPublishedStories: getPublishedStories,
            getStoryById: getStoryById
        };
    })();

    // ===== LIKE MANAGER =====
    const LikeManager = (function() {
        function getLikes() {
            return Utils.getStorageItem(CONFIG.STORAGE_KEY, {});
        }

        function setLike(id, liked) {
            var likes = getLikes();
            if (liked) {
                likes[id] = true;
            } else {
                delete likes[id];
            }
            Utils.setStorageItem(CONFIG.STORAGE_KEY, likes);
        }

        function isLiked(id) {
            var likes = getLikes();
            return !!likes[id];
        }

        function getLikeCount(story) {
            var base = Number(story.initialLikes) || 0;
            return isLiked(story.id) ? base + 1 : base;
        }

        return {
            getLikes: getLikes,
            setLike: setLike,
            isLiked: isLiked,
            getLikeCount: getLikeCount
        };
    })();

    // ===== DOM ELEMENTS =====
    const DOM = {
        storiesGrid: null,
        overlay: null,
        modal: null,
        modalClose: null,
        modalImage: null,
        modalMeta: null,
        modalTitle: null,
        modalAuthor: null,
        modalStory: null,
        modalSong: null,
        modalSongText: null,
        modalLikeBtn: null,
        modalLikeCount: null,
        modalDate: null,
        storiesSeeMore: null,
        storiesFallbackBanner: null,
        emptyMessage: null,

        init: function() {
            this.storiesGrid = document.getElementById('storiesGrid');
            this.overlay = document.querySelector(CONFIG.MODAL_SELECTORS.overlay);
            this.modal = document.querySelector(CONFIG.MODAL_SELECTORS.modal);
            this.modalClose = document.querySelector(CONFIG.MODAL_SELECTORS.close);
            this.modalImage = document.querySelector(CONFIG.MODAL_SELECTORS.image);
            this.modalMeta = document.querySelector(CONFIG.MODAL_SELECTORS.meta);
            this.modalTitle = document.querySelector(CONFIG.MODAL_SELECTORS.title);
            this.modalAuthor = document.querySelector(CONFIG.MODAL_SELECTORS.author);
            this.modalStory = document.querySelector(CONFIG.MODAL_SELECTORS.story);
            this.modalSong = document.querySelector(CONFIG.MODAL_SELECTORS.song);
            this.modalSongText = document.querySelector(CONFIG.MODAL_SELECTORS.songText);
            this.modalLikeBtn = document.querySelector(CONFIG.MODAL_SELECTORS.likeBtn);
            this.modalLikeCount = document.querySelector(CONFIG.MODAL_SELECTORS.likeCount);
            this.modalDate = document.querySelector(CONFIG.MODAL_SELECTORS.date);
            this.storiesSeeMore = document.getElementById('storiesSeeMore');
            this.storiesFallbackBanner = document.getElementById('storiesFallbackBanner');
            this.emptyMessage = document.getElementById('histEmpty');

            if (!this.storiesGrid) {
                console.warn('[StoriesModule] storiesGrid no encontrado');
            }
        }
    };

    // ===== RENDERER =====
    const Renderer = (function() {
        function createStoryCard(story, liked, count) {
            var card = document.createElement('article');
            card.className = 'story-card';
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', 'Leer historia: ' + story.title);
            card.setAttribute('data-story-id', story.id);

            var imageDiv = document.createElement('div');
            imageDiv.className = 'story-card-image';

            var img = document.createElement('img');
            img.src = Utils.safeImageUrl(story.image) || CONFIG.FALLBACK_IMAGE;
            img.alt = story.title;
            img.loading = 'lazy';
            img.onerror = function() {
                img.onerror = null;
                img.src = CONFIG.FALLBACK_IMAGE;
            };
            imageDiv.appendChild(img);

            var categorySpan = document.createElement('span');
            categorySpan.className = 'story-card-category';
            categorySpan.textContent = story.location;
            imageDiv.appendChild(categorySpan);

            var bodyDiv = document.createElement('div');
            bodyDiv.className = 'story-card-body';

            var titleH3 = document.createElement('h3');
            titleH3.className = 'story-card-title';
            titleH3.textContent = story.title;
            bodyDiv.appendChild(titleH3);

            var excerptP = document.createElement('p');
            excerptP.className = 'story-card-excerpt';
            excerptP.textContent = story.excerpt;
            bodyDiv.appendChild(excerptP);

            var footerDiv = document.createElement('div');
            footerDiv.className = 'story-card-footer';

            var authorSpan = document.createElement('span');
            authorSpan.className = 'story-card-author';
            var byText = document.createTextNode('by ');
            authorSpan.appendChild(byText);
            var strongAuthor = document.createElement('strong');
            strongAuthor.textContent = story.author;
            authorSpan.appendChild(strongAuthor);
            footerDiv.appendChild(authorSpan);

            var actionsDiv = document.createElement('div');
            actionsDiv.className = 'story-card-actions';

            var likeBtn = document.createElement('button');
            likeBtn.className = 'story-like-btn' + (liked ? ' liked' : '');
            likeBtn.setAttribute('data-story-id', story.id);
            likeBtn.setAttribute('aria-label', 'Like');
            likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
            var heartIcon = document.createElement('i');
            heartIcon.className = 'fa-' + (liked ? 'solid' : 'regular') + ' fa-heart';
            likeBtn.appendChild(heartIcon);
            var likeCountSpan = document.createElement('span');
            likeCountSpan.className = 'story-like-count';
            likeCountSpan.textContent = String(count);
            likeBtn.appendChild(likeCountSpan);
            actionsDiv.appendChild(likeBtn);

            var readBtn = document.createElement('button');
            readBtn.className = 'story-read-button';
            readBtn.setAttribute('aria-label', 'Leer historia: ' + story.title);
            readBtn.setAttribute('data-story-id', story.id);
            readBtn.textContent = 'Read Story';
            actionsDiv.appendChild(readBtn);

            footerDiv.appendChild(actionsDiv);
            card.appendChild(imageDiv);
            card.appendChild(bodyDiv);
            card.appendChild(footerDiv);

            return card;
        }

        function renderCards() {
            DataManager.getPublishedStories().then(function(published) {
                var isIndex = !!DOM.storiesGrid && document.getElementById('storiesSection');
                var storiesToShow = isIndex ? published.slice(0, CONFIG.MAX_INDEX_STORIES) : published;

                DOM.storiesGrid.textContent = '';

                if (published.length === 0) {
                    if (DOM.emptyMessage) {
                        DOM.emptyMessage.style.display = 'block';
                    }
                    return;
                }

                if (DOM.emptyMessage) {
                    DOM.emptyMessage.style.display = 'none';
                }

                published.forEach(function(story) {
                    var liked = LikeManager.isLiked(story.id);
                    var count = LikeManager.getLikeCount(story);
                    var card = createStoryCard(story, liked, count);
                    DOM.storiesGrid.appendChild(card);
                });

                if (isIndex && DOM.storiesSeeMore) {
                    if (published.length > CONFIG.MAX_INDEX_STORIES) {
                        DOM.storiesSeeMore.style.display = '';
                    } else {
                        DOM.storiesSeeMore.style.display = 'none';
                    }
                }

                attachCardListeners();
            });
        }

        function attachCardListeners() {
            if (!DOM.storiesGrid) return;

            var readBtns = DOM.storiesGrid.querySelectorAll('.story-read-button');
            readBtns.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openModal(btn.getAttribute('data-story-id'));
                });
            });

            var cardClickAreas = DOM.storiesGrid.querySelectorAll('.story-card-image, .story-card-body');
            cardClickAreas.forEach(function(area) {
                area.addEventListener('click', function() {
                    var card = area.closest('.story-card');
                    if (card) {
                        openModal(card.getAttribute('data-story-id'));
                    }
                });
            });

            var cards = DOM.storiesGrid.querySelectorAll('.story-card');
            cards.forEach(function(card) {
                card.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal(card.getAttribute('data-story-id'));
                    }
                });
            });

            var likeBtns = DOM.storiesGrid.querySelectorAll('.story-like-btn');
            likeBtns.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var storyId = btn.getAttribute('data-story-id');
                    toggleStoryLike(storyId, btn);
                });
            });
        }

        return {
            renderCards: renderCards
        };
    })();

    // ===== MODAL HANDLING =====
    const ModalManager = (function() {
        var currentStoryId = null;
        var previousFocus = null;
        var loadedStories = [];
        var focusableSelectors = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        function setCurrentStory(story) {
            currentStoryId = story.id;
            loadedStories.push(story);
        }

        function openModal(id) {
            var story = DataManager.getStoryById(id);
            if (!story) return;

            setCurrentStory(story);
            previousFocus = document.activeElement;

            DOM.modalImage.src = Utils.safeImageUrl(story.image) || CONFIG.FALLBACK_IMAGE;
            DOM.modalImage.alt = story.title;
            DOM.modalImage.onerror = function() {
                DOM.modalImage.onerror = null;
                DOM.modalImage.src = CONFIG.FALLBACK_IMAGE;
            };

            DOM.modalMeta.textContent = '';
            var locSpan = document.createElement('span');
            locSpan.textContent = story.location;
            DOM.modalMeta.appendChild(locSpan);
            var divider = document.createElement('span');
            divider.className = 'modal-divider';
            DOM.modalMeta.appendChild(divider);
            var dateSpan = document.createElement('span');
            dateSpan.textContent = story.date;
            DOM.modalMeta.appendChild(dateSpan);

            DOM.modalTitle.textContent = story.title;

            DOM.modalAuthor.textContent = '';
            var authorByText = document.createTextNode('by ');
            DOM.modalAuthor.appendChild(authorByText);
            var authorStrong = document.createElement('strong');
            authorStrong.textContent = story.author;
            DOM.modalAuthor.appendChild(authorStrong);

            DOM.modalStory.textContent = '';
            var paragraphs = (story.content || '').split('\n\n');
            paragraphs.forEach(function(para, i) {
                var p = document.createElement('p');
                p.textContent = para;
                if (i > 0) {
                    p.classList.add('stories-modal-story-gap');
                }
                DOM.modalStory.appendChild(p);
            });

            DOM.modalDate.textContent = story.date;

            if (story.relatedSong) {
                DOM.modalSong.classList.remove('is-hidden');
                DOM.modalSongText.textContent = '';
                var parts = story.relatedSong.split(' - ');
                var songStrong = document.createElement('strong');
                songStrong.textContent = parts[0];
                DOM.modalSongText.appendChild(songStrong);
                if (parts.length > 1) {
                    var dashText = document.createTextNode(' \u2014 ' + parts.slice(1).join(' - '));
                    DOM.modalSongText.appendChild(dashText);
                }
            } else {
                DOM.modalSong.classList.add('is-hidden');
            }

            updateModalLikeUI(id);

            document.body.style.overflow = 'hidden';
            DOM.overlay.classList.remove('is-hidden');
            requestAnimationFrame(function() {
                DOM.overlay.classList.add('active');
            });

            DOM.modal.scrollTop = 0;
            DOM.modalClose.focus();

            DOM.modalLikeBtn.onclick = function() {
                toggleStoryLike(id, null);
            };
        }

        function closeModal() {
            DOM.overlay.classList.remove('active');
            setTimeout(function() {
                DOM.overlay.classList.add('is-hidden');
                document.body.style.overflow = '';
                currentStoryId = null;
                if (previousFocus) {
                    previousFocus.focus();
                    previousFocus = null;
                }
            }, 300);
        }

        function updateModalLikeUI(id) {
            var liked = LikeManager.isLiked(id);
            var story = DataManager.getStoryById(id);
            if (!story) return;

            var count = LikeManager.getLikeCount(story);
            DOM.modalLikeCount.textContent = String(count);
            DOM.modalLikeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');

            if (liked) {
                DOM.modalLikeBtn.classList.add('liked');
                DOM.modalLikeBtn.querySelector('i').className = 'fa-solid fa-heart';
            } else {
                DOM.modalLikeBtn.classList.remove('liked');
                DOM.modalLikeBtn.querySelector('i').className = 'fa-regular fa-heart';
            }
        }

        function updateCardLikeUI(storyId, btn) {
            var liked = LikeManager.isLiked(storyId);
            var story = DataManager.getStoryById(storyId);
            if (!story) return;

            var card = document.querySelector('[data-story-id="' + storyId + '"]');
            if (!card) return;

            if (btn) {
                if (liked) {
                    btn.classList.add('liked');
                    btn.querySelector('i').className = 'fa-solid fa-heart';
                } else {
                    btn.classList.remove('liked');
                    btn.querySelector('i').className = 'fa-regular fa-heart';
                }
                btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
                btn.querySelector('.story-like-count').textContent = String(LikeManager.getLikeCount(story));
            } else {
                var cardBtn = card.querySelector('.story-like-btn');
                if (cardBtn) {
                    if (liked) {
                        cardBtn.classList.add('liked');
                        cardBtn.querySelector('i').className = 'fa-solid fa-heart';
                    } else {
                        cardBtn.classList.remove('liked');
                        cardBtn.querySelector('i').className = 'fa-regular fa-heart';
                    }
                    cardBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
                    cardBtn.querySelector('.story-like-count').textContent = String(LikeManager.getLikeCount(story));
                }
            }
        }

        function toggleStoryLike(id, btn) {
            var liked = LikeManager.isLiked(id);
            LikeManager.setLike(id, !liked);
            updateCardLikeUI(id, btn);

            if (currentStoryId === id) {
                updateModalLikeUI(id);
            }
        }

        function trapFocus(e) {
            if (!DOM.overlay.classList.contains('active')) return;

            var focusable = DOM.modal.querySelectorAll(focusableSelectors);
            if (focusable.length === 0) return;

            var first = focusable[0];
            var last = focusable[focusable.length - 1];

            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        }

        function attachModalListeners() {
            if (DOM.modalClose) {
                DOM.modalClose.addEventListener('click', closeModal);
            }

            if (DOM.overlay) {
                DOM.overlay.addEventListener('click', function(e) {
                    if (e.target === DOM.overlay) {
                        closeModal();
                    }
                });
            }

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && DOM.overlay.classList.contains('active')) {
                    closeModal();
                }
                trapFocus(e);
            });

            if (DOM.modal) {
                DOM.modal.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
            }
        }

        return {
            openModal: openModal,
            closeModal: closeModal,
            toggleStoryLike: toggleStoryLike,
            updateCardLikeUI: updateCardLikeUI,
            attachModalListeners: attachModalListeners,
            renderCards: Renderer.renderCards
        };
    })();

    // ===== INITIALIZATION =====
    function init() {
        DOM.init();

        if (!DOM.storiesGrid) {
            console.warn('[StoriesModule] storiesGrid no encontrado, skipping initialization');
            return;
        }

        ModalManager.attachModalListeners();
        ModalManager.renderCards();

        document.dispatchEvent(new CustomEvent('stories:initialized', {
            detail: { module: 'GeminiStyleStories' }
        }));
    }

    // ===== BACKSTAGE INTEGRATION =====
    var BackstageIntegration = (function() {
        var BACKSTAGE_KEY = 'backstage_stories_data';
        var LEGACY_KEY = 'wbox_stories_data';

        function loadBackstageData() {
            try {
                var saved = localStorage.getItem(BACKSTAGE_KEY);
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (e) {}

            try {
                var legacy = localStorage.getItem(LEGACY_KEY);
                if (legacy) {
                    return JSON.parse(legacy);
                }
            } catch (e) {}

            return null;
        }

        function isBackstageContent() {
            return !!localStorage.getItem(BACKSTAGE_KEY);
        }

        function showFallbackBanner() {
            if (isBackstageContent()) {
                if (DOM.storiesFallbackBanner) {
                    DOM.storiesFallbackBanner.style.display = 'none';
                }
            } else {
                if (DOM.storiesFallbackBanner) {
                    DOM.storiesFallbackBanner.style.display = '';
                }
            }
        }

        return {
            loadBackstageData: loadBackstageData,
            isBackstageContent: isBackstageContent,
            showFallbackBanner: showFallbackBanner
        };
    })();

    // ===== INITIALIZATION =====
    function init() {
        DOM.init();

        if (!DOM.storiesGrid) {
            console.warn('[StoriesModule] storiesGrid no encontrado, skipping initialization');
            return;
        }

        BackstageIntegration.showFallbackBanner();
        ModalManager.attachModalListeners();
        ModalManager.renderCards();

        document.dispatchEvent(new CustomEvent('stories:initialized', {
            detail: { module: 'GeminiStyleStories' }
        }));
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, document);

// ===== BACKSTAGE GLOBAL API =====
window.WhiteBoxStories = window.WhiteBoxStories || {};
window.WhiteBoxStories.lastSource = null;
window.WhiteBoxStories.lastError = null;
window.WhiteBoxStories.loadPublished = function() {
    var wbf = window.WhiteBoxFirebase;
    if (wbf && wbf.db) {
        return wbf.db.collection('stories')
            .where('status', '==', 'published')
            .get()
            .then(function(snapshot) {
                var items = [];
                snapshot.forEach(function(doc) {
                    var d = doc.data();
                    d.id = doc.id;
                    items.push(d);
                });

                window.WhiteBoxStories.lastSource = 'firestore';

                if (items.length > 0) {
                    return items.sort(function(a, b) {
                        return (a.order || 999) - (b.order || 999);
                    });
                }

                window.WhiteBoxStories.lastSource = 'fallback';
                return storiesData
                    .filter(function(s) { return s.status === 'published'; })
                    .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
            })
            .catch(function(err) {
                window.WhiteBoxStories.lastSource = 'fallback';
                window.WhiteBoxStories.lastError = err && err.message ? err.message : 'Error de Firestore';
                return storiesData
                    .filter(function(s) { return s.status === 'published'; })
                    .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
            });
    }

    window.WhiteBoxStories.lastSource = 'local';
    return Promise.resolve(
        storiesData
            .filter(function(s) { return s.status === 'published'; })
            .sort(function(a, b) { return (a.order || 999) - (b.order || 999); })
    );
};

// ===== EVENT HANDLING =====
document.addEventListener('stories:content-applied', function(e) {
    console.log('[StoriesModule] Content applied:', e.detail);
});
