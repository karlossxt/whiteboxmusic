/* ============================================
   BACKSTAGE STUDIO — Data Table Template
   Genera una tabla de datos reutilizable.
   
   config: { columns: [{key, label, className}], emptyIcon, emptyTitle, emptyText }
   rows: [{ id, cells: [{value, className, html}] }]
   actions: [{ icon, title, ariaLabel, className, onClick }]
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Templates = window.Backstage.Templates || {};

    window.Backstage.Templates.dataTable = function(config) {
        var wrapper = document.createElement('div');
        wrapper.className = 'admin-table-wrapper';

        var table = document.createElement('table');
        table.className = 'admin-table';

        var thead = document.createElement('thead');
        var headRow = document.createElement('tr');
        config.columns.forEach(function(col) {
            var th = document.createElement('th');
            th.textContent = col.label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        tbody.setAttribute('data-backstage-tbody', '');
        table.appendChild(tbody);

        wrapper.appendChild(table);

        var empty = document.createElement('div');
        empty.className = 'admin-empty';
        empty.setAttribute('data-backstage-empty', '');
        empty.style.display = 'none';

        var emptyIcon = document.createElement('i');
        emptyIcon.className = 'fa-solid ' + (config.emptyIcon || 'fa-inbox');
        empty.appendChild(emptyIcon);

        var emptyH3 = document.createElement('h3');
        emptyH3.textContent = config.emptyTitle || 'Sin datos';
        empty.appendChild(emptyH3);

        var emptyP = document.createElement('p');
        emptyP.textContent = config.emptyText || '';
        empty.appendChild(emptyP);

        return { wrapper: wrapper, empty: empty, tbody: tbody };
    };

    window.Backstage.Templates.dataTableRow = function(cells, actions) {
        var tr = document.createElement('tr');

        cells.forEach(function(cell) {
            var td = document.createElement('td');
            if (cell.className) td.className = cell.className;
            if (cell.html) {
                td.innerHTML = cell.html;
            } else {
                td.textContent = cell.value || '';
            }
            tr.appendChild(td);
        });

        if (actions && actions.length > 0) {
            var tdActions = document.createElement('td');
            var div = document.createElement('div');
            div.className = 'table-actions';

            actions.forEach(function(action) {
                var btn = document.createElement('button');
                btn.className = 'btn-icon' + (action.className ? ' ' + action.className : '');
                btn.title = action.title || '';
                btn.setAttribute('aria-label', action.ariaLabel || action.title || '');
                var icon = document.createElement('i');
                icon.className = 'fa-solid ' + action.icon;
                btn.appendChild(icon);
                btn.addEventListener('click', action.onClick);
                div.appendChild(btn);
            });

            tdActions.appendChild(div);
            tr.appendChild(tdActions);
        }

        return tr;
    };
})();
