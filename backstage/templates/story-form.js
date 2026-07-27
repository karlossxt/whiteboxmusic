/* ============================================
   BACKSTAGE STUDIO — Story Form Template
   Genera el formulario de creación/edición de historias.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Templates = window.Backstage.Templates || {};

    window.Backstage.Templates.storyForm = function() {
        var fields = [
            { id: 'formTitle', label: 'Titulo', type: 'text', required: true, placeholder: 'Titulo de la historia', fullWidth: true },
            { id: 'formAuthor', label: 'Autor', type: 'text', required: true, placeholder: 'Nombre o alias' },
            { id: 'formLocation', label: 'Ubicacion', type: 'text', placeholder: 'Ciudad, Pais' },
            { id: 'formImage', label: 'URL de imagen', type: 'url', placeholder: 'https://...' },
            { id: 'formDate', label: 'Fecha', type: 'text', placeholder: 'Ej: Octubre 2023' },
            { id: 'formRelatedSong', label: 'Cancion relacionada', type: 'text', placeholder: 'Artista - Cancion' },
            { id: 'formInitialLikes', label: 'Likes iniciales', type: 'number', min: '0', value: '0' },
            { id: 'formOrder', label: 'Orden', type: 'number', min: '1', value: '1' },
            { id: 'formExcerpt', label: 'Extracto', type: 'textarea', required: true, rows: 2, placeholder: 'Resumen corto (maximo 3 lineas)', fullWidth: true },
            { id: 'formContent', label: 'Historia completa', type: 'textarea', required: true, rows: 8, placeholder: 'Contenido completo de la historia. Separa parrafos con doble salto de linea.', fullWidth: true },
            { id: 'formStatus', label: 'Estado', type: 'select', options: [{ value: 'published', text: 'Publicada' }, { value: 'draft', text: 'Borrador' }] },
            { id: 'formFeatured', label: 'Destacada', type: 'select', options: [{ value: 'false', text: 'No' }, { value: 'true', text: 'Si' }] }
        ];

        var form = document.createElement('form');
        form.id = 'storyForm';
        form.setAttribute('novalidate', '');

        var hiddenId = document.createElement('input');
        hiddenId.type = 'hidden';
        hiddenId.id = 'formId';
        form.appendChild(hiddenId);

        var grid = document.createElement('div');
        grid.className = 'form-grid';

        fields.forEach(function(f) {
            var group = document.createElement('div');
            group.className = 'form-group' + (f.fullWidth ? ' full-width' : '');

            var label = document.createElement('label');
            label.setAttribute('for', f.id);
            label.textContent = f.label;
            if (f.required) {
                var req = document.createElement('span');
                req.className = 'required';
                req.textContent = ' *';
                label.appendChild(req);
            }
            group.appendChild(label);

            var input;
            if (f.type === 'textarea') {
                input = document.createElement('textarea');
                input.id = f.id;
                input.rows = f.rows || 3;
                if (f.placeholder) input.placeholder = f.placeholder;
                if (f.required) input.required = '';
            } else if (f.type === 'select') {
                input = document.createElement('select');
                input.id = f.id;
                f.options.forEach(function(opt) {
                    var option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = f.type || 'text';
                input.id = f.id;
                if (f.placeholder) input.placeholder = f.placeholder;
                if (f.min) input.min = f.min;
                if (f.value) input.value = f.value;
                if (f.required) input.required = '';
            }

            group.appendChild(input);
            grid.appendChild(group);
        });

        form.appendChild(grid);

        var actions = document.createElement('div');
        actions.className = 'form-actions';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary';
        cancelBtn.id = 'btnCancel';
        cancelBtn.textContent = 'Cancelar';
        actions.appendChild(cancelBtn);

        var saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'btn-primary';
        saveBtn.id = 'btnSave';
        var saveIcon = document.createElement('i');
        saveIcon.className = 'fa-solid fa-check';
        saveBtn.appendChild(saveIcon);
        saveBtn.appendChild(document.createTextNode(' Guardar'));
        actions.appendChild(saveBtn);

        form.appendChild(actions);

        return form;
    };
})();
