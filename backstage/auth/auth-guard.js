/* ============================================
   BACKSTAGE STUDIO — Auth Guard (Supabase)
   Verifica sesión de Supabase Auth. Si no hay
   sesión válida, redirige a login.html.
   Solo el UID autorizado puede acceder.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Auth = window.Backstage.Auth || {};

    // ✅ UID del admin de Supabase (cambiado en admin-config.js)
    var AUTHORIZED_UID = (window.Backstage && window.Backstage.ADMIN_UID) || '9ff304f5-f666-4a29-ad38-3b99c68829d4';

    window.Backstage.Auth.guard = function() {
        return new Promise(function(resolve, reject) {
            var supa = window.getSupabaseClient();

            if (!supa) {
                reject(new Error('Supabase client no disponible'));
                return;
            }

            var resolved = false;

            // ✅ Supabase JS v2: onAuthStateChange recibe (event, session)
            supa.auth.onAuthStateChange(function(event, session) {
                if (resolved) return;
                resolved = true;

                if (!session) {
                    window.location.href = 'login.html';
                    return;
                }

                if (session.user.id !== AUTHORIZED_UID) {
                    supa.auth.signOut().then(function() {
                        alert('Acceso no autorizado.');
                        window.location.href = 'login.html';
                    });
                    return;
                }

                resolve(session.user);
            });

            // Timeout de 8 segundos si no hay cambio de estado
            setTimeout(function() {
                if (!resolved) {
                    resolved = true;
                    window.location.href = 'login.html';
                }
            }, 8000);
        });
    };

    // ✅ getUser() en Supabase v2 retorna el usuario actual síncronamente
    // o null si no hay sesión activa
    window.Backstage.Auth.getUser = function() {
        var supa = window.getSupabaseClient();
        return supa ? supa.auth.getUser() : null;
    };

    window.Backstage.Auth.getUserEmail = function() {
        var user = window.Backstage.Auth.getUser();
        return user ? user.email : '';
    };

    window.Backstage.Auth.logout = function() {
        var supa = window.getSupabaseClient();
        if (supa) {
            return supa.auth.signOut().then(function() {
                window.location.href = 'login.html';
            });
        }
        window.location.href = 'login.html';
    };
})();