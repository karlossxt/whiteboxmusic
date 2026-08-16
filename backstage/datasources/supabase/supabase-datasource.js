/* ============================================
   BACKSTAGE STUDIO — Supabase Datasource
   Capa de persistencia que usa Supabase Postgres.
   Se comunica vía cliente Supabase JS.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};

    function SupabaseDatasource(supabaseClient) {
        this.type = 'supabase';
        this.client = supabaseClient;
        this._cache = {};
    }

    SupabaseDatasource.prototype._collectionRef = function(collectionName) {
        var ds = this;
        return {
            get: function() {
                return ds.client.from(collectionName).select('*').order('order', { ascending: true }).then(function(response) {
                    var items = response.data || [];
                    var standardized = items.map(function(item) {
                        return { id: item.id || item._id || item.slug, ...item };
                    });

                    ds._cache[collectionName] = standardized.slice();

                    return {
                        data: standardized,
                        forEach: function(callback) {
                            standardized.forEach(callback);
                        }
                    };
                }).catch(function(err) {
                    console.error('[Backstage] Error Supabase query:', err);
                    return {
                        data: [],
                        forEach: function() {},
                        error: err
                    };
                });
            }
        };
    };

    /* ----------------------------------------
       Lecturas síncronas desde cache
       usadas por los repositories
       ---------------------------------------- */

    SupabaseDatasource.prototype.get = function(key) {
        if (!this._cache[key]) {
            return null;
        }
        return Array.isArray(this._cache[key])
            ? this._cache[key].slice()
            : this._cache[key];
    };

    SupabaseDatasource.prototype.getWithDefault = function(key, defaultData) {
        var data = this.get(key);
        if (Array.isArray(data)) {
            return data;
        }
        return Array.isArray(defaultData)
            ? defaultData.slice()
            : defaultData;
    };

    /*
     * Escrituras se implementarán posteriormente
     * con INSERT / UPDATE / DELETE reales.
     */

    SupabaseDatasource.prototype.set = function(key, value) {
        console.warn(
            '[Backstage] set() Supabase pendiente:',
            key
        );
        this._cache[key] =
            Array.isArray(value)
                ? value.slice()
                : value;
        return true;
    };

    SupabaseDatasource.prototype.remove = function(key) {
        delete this._cache[key];
        return true;
    };

    window.Backstage.SupabaseDatasource =
        SupabaseDatasource;

})();