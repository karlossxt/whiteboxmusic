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

    var ORDERED_TABLES = { stories: 1, soundscapes: 1, interviews: 1, gallery: 1 };

    SupabaseDatasource.prototype._collectionRef = function(collectionName) {
        var ds = this;
        return {
            get: function() {
                var query = ds.client.from(collectionName).select('*');
                if (ORDERED_TABLES[collectionName]) {
                    query = query.order('order', { ascending: true });
                }
                return query.then(function(response) {
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

    SupabaseDatasource.prototype._tableFor = function(key) {
        var TABLE_MAP = {
            'stories_data': 'stories',
            'soundscapes_data': 'soundscapes',
            'interviews_data': 'interviews',
            'gallery_events_data': 'gallery',
            'site_content': 'site_content',
            'site_config': 'site_config'
        };
        return TABLE_MAP[key] || key;
    };

    /*
     * Escrituras reales en Supabase.
     * - Array: hace upsert de cada item (por id) y borra
     *   los que ya no existen respecto al cache anterior.
     * - Objeto único (site_config): hace upsert de la fila.
     * El cache se actualiza optimistamente; ante un error la
     * Promise se rechaza para que el panel muestre el fallo.
     */
    SupabaseDatasource.prototype.set = function(key, value) {
        var ds = this;
        var table = this._tableFor(key);
        var previous = Array.isArray(this._cache[key]) ? this._cache[key].slice() : [];

        this._cache[key] =
            Array.isArray(value)
                ? value.slice()
                : value;

        if (Array.isArray(value)) {
            var oldIds = previous.map(function(item) { return item.id; });
            var newIds = value.map(function(item) { return item.id; });
            var removed = oldIds.filter(function(id) { return newIds.indexOf(id) === -1; });

            var ops = [];
            removed.forEach(function(id) {
                ops.push(ds.client.from(table).delete().eq('id', id));
            });
            value.forEach(function(item) {
                ops.push(ds.client.from(table).upsert(item, { onConflict: 'id' }));
            });

            return Promise.all(ops).then(function(results) {
                var failed = results.filter(function(resp) { return resp && resp.error; });
                if (failed.length) {
                    console.error('[Backstage] Error escribiendo en Supabase (' + table + ')', failed);
                    throw new Error('No se pudo guardar en Supabase');
                }
                return true;
            });
        }

        return ds.client.from(table).upsert(value, { onConflict: 'id' }).then(function(resp) {
            if (resp && resp.error) {
                console.error('[Backstage] Error escribiendo en Supabase (' + table + ')', resp.error);
                throw new Error('No se pudo guardar en Supabase');
            }
            return true;
        });
    };

    SupabaseDatasource.prototype.remove = function(key) {
        delete this._cache[key];
        return true;
    };

    window.Backstage.SupabaseDatasource =
        SupabaseDatasource;

})();