/* ============================================
   BACKSTAGE STUDIO — Auth Guard
   Verifica sesión de Firebase. Si no hay
   sesión válida, redirige a login.html.
   Solo el UID autorizado puede acceder.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Auth = window.Backstage.Auth || {};

    var AUTHORIZED_UID = 'qtguil5JI0ejOeJ0fpiXrxTJvIq2';

    window.Backstage.Auth.guard = function() {
        return new Promise(function(resolve, reject) {
            var auth = window.WhiteBoxFirebase ? window.WhiteBoxFirebase.auth : null;

            if (!auth) {
                reject(new Error('Firebase Auth no disponible'));
                return;
            }

            var resolved = false;
            var unsubscribe = auth.onAuthStateChanged(function(user) {
                if (resolved) return;
                resolved = true;
                unsubscribe();

                if (!user) {
                    window.location.href = 'login.html';
                    return;
                }

                if (user.uid !== AUTHORIZED_UID) {
                    auth.signOut().then(function() {
                        alert('Acceso no autorizado.');
                        window.location.href = 'login.html';
                    });
                    return;
                }

                resolve(user);
            });

            setTimeout(function() {
                if (!resolved) {
                    resolved = true;
                    unsubscribe();
                    window.location.href = 'login.html';
                }
            }, 8000);
        });
    };

    window.Backstage.Auth.getUser = function() {
        var auth = window.WhiteBoxFirebase ? window.WhiteBoxFirebase.auth : null;
        return auth ? auth.currentUser : null;
    };

    window.Backstage.Auth.getUserEmail = function() {
        var user = window.Backstage.Auth.getUser();
        return user ? user.email : '';
    };

    window.Backstage.Auth.logout = function() {
        var auth = window.WhiteBoxFirebase ? window.WhiteBoxFirebase.auth : null;
        if (auth) {
            return auth.signOut().then(function() {
                window.location.href = 'login.html';
            });
        }
        window.location.href = 'login.html';
    };
})();
