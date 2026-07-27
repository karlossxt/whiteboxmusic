/* ============================================
   BACKSTAGE STUDIO — Soundscape Form Template
   Genera el formulario de creación/edición de soundscapes.
   ============================================ */

(function() {
    window.Backstage = window.Backstage || {};
    window.Backstage.Templates = window.Backstage.Templates || {};

    window.Backstage.Templates.soundscapeForm = function() {
        var fields = [
            { id: 'ssFormTitle', label: 'Titulo', type: 'text', required: true, placeholder: 'Titulo de la cancion', fullWidth: true },
            { id: 'ssFormArtist', label: 'Artista', type: 'text', required: true, placeholder: 'Nombre del artista' },
            { id: 'ssFormPlaylist', label: 'Playlist', type: 'text', placeholder: 'Ej: World Tour, Sound On' },
            { id: 'ssFormCover', label: 'URL de portada', type: 'url', placeholder: 'https://...' },
            { id: 'ssFormSpotifyUrl', label: 'URL de Spotify', type: 'url', placeholder: 'https://open.spotify.com/track/...' },
            { id: 'ssFormDuration', label: 'Duracion (segundos)', type: 'number', min: '1', value: '180' },
            { id: 'ssFormOrder', label: 'Orden', type: 'number', min: '1', value: '1' },
            { id: 'ssFormPublished', label: 'Estado', type: 'select', options: [{ value: 'true', text: 'Publicada' }, { value: 'false', text: 'Borrador' }] }
        ];

        var form = document.createElement('form');
        form.id = 'soundscapeForm';
        form.setAttribute('novalidate', '');

        var hiddenId = document.createElement('input');
        hiddenId.type = 'hidden';
        hiddenId.id = 'ssFormId';
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
            if (f.type === 'select') {
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
        cancelBtn.id = 'ssBtnCancel';
        cancelBtn.textContent = 'Cancelar';
        actions.appendChild(cancelBtn);

        var saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'btn-primary';
        saveBtn.id = 'ssBtnSave';
        var saveIcon = document.createElement('i');
        saveIcon.className = 'fa-solid fa-check';
        saveBtn.appendChild(saveIcon);
        saveBtn.appendChild(document.createTextNode(' Guardar'));
        actions.appendChild(saveBtn);

        form.appendChild(actions);

        return form;
    };
})();
