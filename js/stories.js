/* STORIES - Renderizado dinámico, modal y likes con localStorage */

document.addEventListener('DOMContentLoaded', function() {

    var storiesGrid = document.getElementById('storiesGrid');
    if (!storiesGrid) return;

    var STORAGE_KEY = 'wbox_story_likes';
    var overlay = document.getElementById('storiesModalOverlay');
    var modal = document.getElementById('storiesModal');
    var modalClose = document.getElementById('storiesModalClose');
    var modalImage = document.getElementById('storiesModalImage');
    var modalMeta = document.getElementById('storiesModalMeta');
    var modalTitle = document.getElementById('storiesModalTitle');
    var modalAuthor = document.getElementById('storiesModalAuthor');
    var modalStory = document.getElementById('storiesModalStory');
    var modalSong = document.getElementById('storiesModalSong');
    var modalSongText = document.getElementById('storiesModalSongText');
    var modalLikeBtn = document.getElementById('storiesModalLikeBtn');
    var modalLikeCount = document.getElementById('storiesModalLikeCount');
    var modalDate = document.getElementById('storiesModalDate');
    var previousFocus = null;
    var currentStoryId = null;
    var loadedStories = [];

    var storiesSeeMore = document.getElementById('storiesSeeMore');
    var MAX_INDEX_STORIES = 3;

    var FOCUSABLE_SELECTORS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    var FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="680" height="340" fill="%231a1a1a"%3E%3Crect width="680" height="340"/%3E%3Ctext x="50%25" y="50%25" fill="%23444" font-size="16" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';

    function safeImageUrl(url) {
        if (!url || typeof url !== 'string') return '';
        var trimmed = url.trim();
        if (!trimmed) return '';
        var lower = trimmed.toLowerCase();
        if (lower.indexOf('javascript:') === 0) return '';
        if (lower.indexOf('data:text/html') === 0) return '';
        return trimmed;
    }

    function getPublishedStories() {
        if (window.WhiteBoxStories && window.WhiteBoxStories.loadPublished) {
            return window.WhiteBoxStories.loadPublished();
        }
        var stories = storiesData
            .filter(function(s) { return s.status === 'published'; })
            .sort(function(a, b) { return (a.order || 999) - (b.order || 999); });
        return Promise.resolve(stories);
    }

    function showFallbackBanner() {
        var wbs = window.WhiteBoxStories;
        var banner = document.getElementById('storiesFallbackBanner');
        if (!banner) return;
        if (wbs && wbs.lastSource === 'fallback') {
            banner.style.display = '';
        } else {
            banner.style.display = 'none';
        }
    }

    function getLikes() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }

    function setLike(storyId, liked) {
        var likes = getLikes();
        if (liked) {
            likes[storyId] = true;
        } else {
            delete likes[storyId];
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
        } catch (e) { /* localStorage unavailable or full */ }
    }

    function isLiked(storyId) {
        var likes = getLikes();
        return !!likes[storyId];
    }

    function getLikeCount(story) {
        var base = Number(story.initialLikes) || 0;
        if (isLiked(story.id)) {
            return base + 1;
        }
        return base;
    }

    function renderCards() {
        getPublishedStories().then(function(published) {
            loadedStories = published;
            var isIndex = !!document.getElementById('storiesSection');
            var storiesToShow = isIndex ? published.slice(0, MAX_INDEX_STORIES) : published;

            showFallbackBanner();

            storiesGrid.textContent = '';
            storiesToShow.forEach(function(story) {
                var liked = isLiked(story.id);
                var count = getLikeCount(story);

                var card = document.createElement('article');
                card.className = 'story-card';
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', 'Leer historia: ' + story.title);
                card.setAttribute('data-story-id', story.id);

                var imageDiv = document.createElement('div');
                imageDiv.className = 'story-card-image';

                var img = document.createElement('img');
                img.src = safeImageUrl(story.image) || FALLBACK_IMAGE;
                img.alt = story.title;
                img.loading = 'lazy';
                img.onerror = function() {
                    img.onerror = null;
                    img.src = FALLBACK_IMAGE;
                };
                imageDiv.appendChild(img);

                var categorySpan = document.createElement('span');
                categorySpan.className = 'story-card-category';
                categorySpan.textContent = story.category || story.location;
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
                storiesGrid.appendChild(card);
            });

            if (isIndex && storiesSeeMore) {
                if (published.length > MAX_INDEX_STORIES) {
                    storiesSeeMore.style.display = '';
                } else {
                    storiesSeeMore.style.display = 'none';
                }
            }

            attachCardListeners();
        });
    }

    function attachCardListeners() {
        var readBtns = storiesGrid.querySelectorAll('.story-read-button');
        readBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openModal(btn.getAttribute('data-story-id'));
            });
        });

        var cardClickAreas = storiesGrid.querySelectorAll('.story-card-image, .story-card-body');
        cardClickAreas.forEach(function(area) {
            area.addEventListener('click', function() {
                var card = area.closest('.story-card');
                if (card) {
                    openModal(card.getAttribute('data-story-id'));
                }
            });
        });

        var cards = storiesGrid.querySelectorAll('.story-card');
        cards.forEach(function(card) {
            card.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(card.getAttribute('data-story-id'));
                }
            });
        });

        var likeBtns = storiesGrid.querySelectorAll('.story-like-btn');
        likeBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var storyId = btn.getAttribute('data-story-id');
                toggleStoryLike(storyId);
            });
        });
    }

    function updateCardLikeUI(storyId) {
        var liked = isLiked(storyId);
        var story = loadedStories.find(function(s) { return s.id === storyId; });
        if (!story) return;
        var count = getLikeCount(story);

        var card = storiesGrid.querySelector('[data-story-id="' + storyId + '"]');
        if (!card) return;

        var btn = card.querySelector('.story-like-btn');
        if (!btn) return;

        if (liked) {
            btn.classList.add('liked');
            btn.querySelector('i').className = 'fa-solid fa-heart';
        } else {
            btn.classList.remove('liked');
            btn.querySelector('i').className = 'fa-regular fa-heart';
        }
        btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
        btn.querySelector('.story-like-count').textContent = String(count);
    }

    function toggleStoryLike(storyId) {
        var liked = isLiked(storyId);
        setLike(storyId, !liked);
        updateCardLikeUI(storyId);
        if (currentStoryId === storyId) {
            updateModalLikeUI(storyId);
        }
    }

    function updateModalLikeUI(storyId) {
        var liked = isLiked(storyId);
        var story = loadedStories.find(function(s) { return s.id === storyId; });
        if (!story) return;
        var count = getLikeCount(story);
        modalLikeCount.textContent = String(count);
        modalLikeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
        if (liked) {
            modalLikeBtn.classList.add('liked');
            modalLikeBtn.querySelector('i').className = 'fa-solid fa-heart';
        } else {
            modalLikeBtn.classList.remove('liked');
            modalLikeBtn.querySelector('i').className = 'fa-regular fa-heart';
        }
    }

    function openModal(storyId) {
        var story = loadedStories.find(function(s) { return s.id === storyId; });
        if (!story) return;
        currentStoryId = storyId;
        previousFocus = document.activeElement;

        modalImage.src = safeImageUrl(story.image) || FALLBACK_IMAGE;
        modalImage.alt = story.title;
        modalImage.onerror = function() {
            modalImage.onerror = null;
            modalImage.src = FALLBACK_IMAGE;
        };

        modalMeta.textContent = '';
        var locSpan = document.createElement('span');
        locSpan.textContent = story.location;
        modalMeta.appendChild(locSpan);
        var divider = document.createElement('span');
        divider.className = 'modal-divider';
        modalMeta.appendChild(divider);
        var dateSpan = document.createElement('span');
        dateSpan.textContent = story.date;
        modalMeta.appendChild(dateSpan);

        modalTitle.textContent = story.title;

        modalAuthor.textContent = '';
        var authorByText = document.createTextNode('by ');
        modalAuthor.appendChild(authorByText);
        var authorStrong = document.createElement('strong');
        authorStrong.textContent = story.author;
        modalAuthor.appendChild(authorStrong);

        modalStory.textContent = '';
        var paragraphs = (story.content || '').split('\n\n');
        paragraphs.forEach(function(para, i) {
            var p = document.createElement('p');
            p.textContent = para;
            if (i > 0) {
                p.classList.add('stories-modal-story-gap');
            }
            modalStory.appendChild(p);
        });

        modalDate.textContent = story.date;

        if (story.relatedSong) {
            modalSong.classList.remove('is-hidden');
            modalSongText.textContent = '';
            var parts = story.relatedSong.split(' - ');
            var songStrong = document.createElement('strong');
            songStrong.textContent = parts[0];
            modalSongText.appendChild(songStrong);
            if (parts.length > 1) {
                var dashText = document.createTextNode(' \u2014 ' + parts.slice(1).join(' - '));
                modalSongText.appendChild(dashText);
            }
        } else {
            modalSong.classList.add('is-hidden');
        }

        updateModalLikeUI(storyId);

        document.body.style.overflow = 'hidden';
        overlay.classList.remove('is-hidden');
        requestAnimationFrame(function() {
            overlay.classList.add('active');
        });

        modal.scrollTop = 0;
        modalClose.focus();

        modalLikeBtn.onclick = function() {
            toggleStoryLike(storyId);
        };
    }

    function closeModal() {
        overlay.classList.remove('active');
        setTimeout(function() {
            overlay.classList.add('is-hidden');
            document.body.style.overflow = '';
            currentStoryId = null;
            if (previousFocus) {
                previousFocus.focus();
                previousFocus = null;
            }
        }, 300);
    }

    function trapFocus(e) {
        if (!overlay.classList.contains('active')) return;
        var focusable = modal.querySelectorAll(FOCUSABLE_SELECTORS);
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

    modalClose.addEventListener('click', closeModal);

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeModal();
        }
        trapFocus(e);
    });

    modal.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    renderCards();
});
