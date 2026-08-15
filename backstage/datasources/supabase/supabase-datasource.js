/* ============================================
   BACKSTAGE STUDIO — Supabase Datasource
   Capa de persistencia que usa Supabase Postgres.
   Se comunica vía cliente Supabase JS.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SupabaseDatasource(supabaseTable) {
        this.type = 'supabase';
        this.table = supabaseTable; // Ej: supabase.from('stories')
        this._cache = {};
    }

    SupabaseDatasource.prototype._collectionRef = function(collectionName) {
        // Retorna un objeto con método .get() que retorna Promise<snapshot>
        var ds = this;
        return {
            get: function() {
                return ds.table.select('*').order('order', { ascending: true }).then(function(response) {
                    var items = response.data || [];
                    // Estandarizar formato: asegurar que cada item tenga 'id'
                    var standardized = items.map(function(item) {
                        return { id: item.id || item._id || item.slug, ...item };
                    });
                    // Retornar como "snapshot" con .forEach
                    return {
                        data: standardized,
                        forEach: function(cb) {
                            standardized.forEach(cb);
                        }
                    };
                }).catch(function(err) {
                    console.error('[Backstage] Error Supabase query:', err);
                    return { data: [], error: err };
                });
            }
        };
    };

    SupabaseDatasource.prototype.get = function(key) {
        // Para compatibilidad con el registry que usa this._cache y this._collectionRef
        return this._collectionRef(key);
    };

    SupabaseDatasource.prototype.set = function(key, value) {
        // Supabase write - opcional, usar con cuidado
        // Este método es básico; las escrituras complejas usan repositorios
        console.warn('[Backstage] Supabase write no implementado en datasource directo');
        return false;
    };

    SupabaseDatasource.prototype.getWithDefault = function(key, defaultData) {
        var ref = this.get(key);
        return ref.then(function(data) {
            if (data && data.length) return data;
            if (defaultData) return defaultData.slice();
            return [];
        });
    };

    window.Backstage.SupabaseDatasource = SupabaseDatasource;
})();