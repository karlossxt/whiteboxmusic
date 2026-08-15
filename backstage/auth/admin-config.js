/* ============================================
   BACKSTAGE STUDIO — Configuración administrativa
   UID de Firebase del administrador autorizado.

   NOTA: el UID NO es un secreto (Firebase lo expone
   en tokens públicos); la autenticación real ocurre
   en Firebase Auth + Security Rules. No colocar aquí
   contraseñas ni credenciales.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    /* UIDs autorizados para acceder al panel.
       Agrega aquí los UUID de tus usuarios de Supabase
       (Authentication -> Users). */
    window.Backstage.ADMIN_UIDS = [
        '91f304f5-f666-4a29-ad38-3b99c68829d4',
        'd2dde41e-f1b5-4d7a-80a9-578e04871521'
    ];

    /* Backwards compatibility: primer UID como principal */
    window.Backstage.ADMIN_UID = window.Backstage.ADMIN_UIDS[0];
})();
