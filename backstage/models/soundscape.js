/* ============================================
   BACKSTAGE STUDIO — Soundscape Model
   Modelo de datos para canciones/recomendaciones Spotify.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function Soundscape(data) {
        var raw = data || {};
        this.id = raw.id || '';
        this.title = raw.title || '';
        this.artist = raw.artist || '';
        this.cover = raw.cover || '';
        this.spotifyUrl = raw.spotifyUrl || '';
        this.playlist = raw.playlist || '';
        this.duration = parseInt(raw.duration, 10) || 180;
        this.published = raw.published === true;
        this.order = parseInt(raw.order, 10) || 1;
    }

    Soundscape.prototype.toJSON = function() {
        return {
            id: this.id,
            title: this.title,
            artist: this.artist,
            cover: this.cover,
            spotifyUrl: this.spotifyUrl,
            playlist: this.playlist,
            duration: this.duration,
            published: this.published,
            order: this.order
        };
    };

    Soundscape.prototype.isPublished = function() {
        return this.published === true;
    };

    Soundscape.prototype.formatDuration = function() {
        var m = Math.floor(this.duration / 60);
        var s = Math.floor(this.duration % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    };

    Soundscape.create = function(raw) {
        return new Soundscape(raw);
    };

    window.Backstage.Soundscape = Soundscape;
})();
