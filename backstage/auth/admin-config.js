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
    window.Backstage.ADMIN_UID = '9ff304f5-f666-4a29-ad38-3b99c68829d4';
})();
