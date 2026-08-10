/* ============================================
   WHITEBOX SITE — Schema de contenido editable
   Compartido por el panel (backstage) y el sitio.
   Cada pagina define los campos editables con:
     key       identificador unico del campo
     label     etiqueta para el formulario
     type      text | textarea | url  (tipo de input)
     apply     como aplicar en el sitio:
                 text | html | src | href | placeholder
                 background | mailto | list
     selector  selector CSS del/los elemento(s) del sitio
     default   valor por defecto (el del sitio actual)
   ============================================ */

(function() {
    function field(key, label, type, apply, selector, defaultValue) {
        return { key: key, label: label, type: type, apply: apply, selector: selector, default: defaultValue || '' };
    }

    var pages = {

        home: {
            id: 'home',
            label: 'Portada',
            file: 'index.html',
            fields: [
                field('banner_text', 'Texto del banner superior', 'text', 'text', '.scrolling-banner .scroll-text span', 'Si llegaste hasta aqui es por algo... Sigue'),
                field('hero_tagline', 'Frase del hero', 'text', 'text', '.hero-overlay p', 'Indie Music from Across the globe'),
                field('hero_title', 'Titulo del hero', 'textarea', 'html', '.hero-overlay h1', 'Your favorite music.<br>Artists to discover.<br>And more in WhiteBox'),
                field('hero_cta', 'Texto boton Discover', 'text', 'text', '.hero-overlay a.btn-discover', 'Discover'),
                field('hero_cta_url', 'URL boton Discover', 'url', 'href', '.hero-overlay a.btn-discover', 'descubre.html'),
                field('hero_image', 'Imagen de fondo del hero (URL)', 'url', 'background', '.hero', 'pexels-myatezhny39-2938205.jpg'),
                field('stories_title', 'Titulo seccion Stories', 'text', 'text', '.stories-header h2', 'Stories From The Scene'),
                field('stories_subtitle', 'Subtitulo Stories', 'text', 'text', '.stories-header p', 'Real stories. Real people. Music that left a mark.'),
                field('stories_see_more', 'Texto "Leer mas historias"', 'text', 'html', '.stories-see-all', 'Leer mas historias ->'),
                field('stories_cta', 'Texto boton "Share Your Story"', 'text', 'text', '.stories-cta a', 'Share Your Story'),
                field('soundscapes_title', 'Titulo seccion Soundscapes', 'text', 'text', '.soundscapes-header h2', 'Latest Soundscapes'),
                field('soundscapes_subtitle', 'Subtitulo Soundscapes', 'text', 'text', '.soundscapes-header p', 'New songs to listen and enjoy'),
                field('footer_tags', 'Tags del pie (uno por linea)', 'list', 'list', '.tags-container .tag', 'pop\nr&b\nrock\nindie\nkpop\nindependent'),
                field('photo_1', 'Foto 1', 'url', 'src', '.photo-container:nth-child(1) img.photo-item', 'pexels-rdne-7502181.jpg'),
                field('photo_2', 'Foto 2', 'url', 'src', '.photo-container:nth-child(2) img.photo-item', 'pexels-rdne-8197303.jpg'),
                field('photo_3', 'Foto 3', 'url', 'src', '.photo-container:nth-child(3) img.photo-item', 'pexels-theshuttervision-15447298.jpg'),
                field('photo_4', 'Foto 4', 'url', 'src', '.photo-container:nth-child(4) img.photo-item', 'pexels-vitalina-3807093.jpg')
            ]
        },

        entrevistas: {
            id: 'entrevistas',
            label: 'Entrevistas',
            file: 'entreE.html',
            fields: [
                field('hero_title', 'Titulo hero ENTREVISTAS', 'textarea', 'html', '.main-title', 'ENTRE<br><span>VISTAS</span>'),
                field('search_placeholder', 'Placeholder del buscador', 'text', 'placeholder', '.search-input', 'BUSCAR EN EL ARCHIVO...'),
                field('iv1_num', 'Numero entrevista 1', 'text', 'text', '.interview-item:nth-child(1) .interview-num', 'VOL. 01'),
                field('iv1_category', 'Categoria entrevista 1', 'text', 'text', '.interview-item:nth-child(1) .interview-category', 'PORTADA / INDIE'),
                field('iv1_title', 'Titulo entrevista 1', 'textarea', 'html', '.interview-item:nth-child(1) .interview-title', 'La distorsion <br>como lenguaje'),
                field('iv1_excerpt', 'Extracto entrevista 1', 'textarea', 'text', '.interview-item:nth-child(1) .interview-excerpt', 'Hablamos con las mentes creativas detras del sonido que esta sacudiendo los garajes de la ciudad...'),
                field('iv1_cta', 'Boton leer entrevista 1', 'text', 'text', '.interview-item:nth-child(1) .read-btn', 'LEER ENTREVISTA'),
                field('iv1_cta_url', 'Link entrevista 1', 'url', 'href', '.interview-item:nth-child(1) .read-btn', 'articulo-entrevista.html'),
                field('iv1_image', 'Imagen entrevista 1', 'url', 'src', '.interview-item:nth-child(1) .interview-img', 'https://images.pexels.com/photos/1649691/pexels-photo-1649691.jpeg'),
                field('iv2_num', 'Numero entrevista 2', 'text', 'text', '.interview-item:nth-child(2) .interview-num', 'VOL. 02'),
                field('iv2_category', 'Categoria entrevista 2', 'text', 'text', '.interview-item:nth-child(2) .interview-category', 'SYNTH WAVE'),
                field('iv2_title', 'Titulo entrevista 2', 'textarea', 'html', '.interview-item:nth-child(2) .interview-title', 'Madame Bleu: <br>Hija del Neon'),
                field('iv2_excerpt', 'Extracto entrevista 2', 'textarea', 'text', '.interview-item:nth-child(2) .interview-excerpt', 'Un viaje intimo a traves de los sintetizadores y las letras melancolicas que definen su nuevo album...'),
                field('iv2_cta', 'Boton leer entrevista 2', 'text', 'text', '.interview-item:nth-child(2) .read-btn', 'LEER ENTREVISTA'),
                field('iv2_cta_url', 'Link entrevista 2', 'url', 'href', '.interview-item:nth-child(2) .read-btn', '#'),
                field('iv2_image', 'Imagen entrevista 2', 'url', 'src', '.interview-item:nth-child(2) .interview-img', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg'),
                field('iv3_num', 'Numero entrevista 3', 'text', 'text', '.interview-item:nth-child(3) .interview-num', 'VOL. 03'),
                field('iv3_category', 'Categoria entrevista 3', 'text', 'text', '.interview-item:nth-child(3) .interview-category', 'CULTURA URBANA'),
                field('iv3_title', 'Titulo entrevista 3', 'textarea', 'html', '.interview-item:nth-child(3) .interview-title', 'Ritmo, rima <br>y realidad'),
                field('iv3_excerpt', 'Extracto entrevista 3', 'textarea', 'text', '.interview-item:nth-child(3) .interview-excerpt', 'Dani Hache nos abre las puertas de su estudio...'),
                field('iv3_cta', 'Boton leer entrevista 3', 'text', 'text', '.interview-item:nth-child(3) .read-btn', 'LEER ENTREVISTA'),
                field('iv3_cta_url', 'Link entrevista 3', 'url', 'href', '.interview-item:nth-child(3) .read-btn', '#'),
                field('iv3_image', 'Imagen entrevista 3', 'url', 'src', '.interview-item:nth-child(3) .interview-img', 'https://images.pexels.com/photos/257904/pexels-photo-257904.jpeg')
            ]
        },

        comunidad: {
            id: 'comunidad',
            label: 'Comunidad',
            file: 'comunidad.html',
            fields: [
                field('hero_title', 'Titulo principal', 'textarea', 'text', '.com-container h1', 'Hay canciones que nos cambiaron, artistas que nos inspiraron y momentos que nunca olvidaremos.'),
                field('hero_subtitle', 'Subtitulo', 'textarea', 'text', '.com-subtitle', 'Queremos conocer tu historia. Cuentanos ese momento musical que nunca olvidaras.'),
                field('instructions_title', 'Titulo Instrucciones', 'text', 'text', '.com-instructions h2', 'Instrucciones'),
                field('instructions_items', 'Lista de instrucciones (una por linea)', 'list', 'list', '.com-instructions ul li', 'Comparte una historia real y personal.\nPuedes hablar de un artista, un concierto o una cancion.\nSi tu historia es seleccionada la publicamos con tu nombre.\nAl enviarla, autorizas a WhiteBox Music a compartirla.'),
                field('section_title', 'Titulo seccion formulario', 'text', 'text', '.com-section h2', 'Comparte tu historia'),
                field('form_action_url', 'Endpoint del formulario (Formspree)', 'url', 'action', '#comunidadForm', 'https://formspree.io/f/xnjevjle'),
                field('form_btn', 'Texto boton enviar', 'text', 'text', 'button.btn-submit', 'Enviar mi historia'),
                field('form_success', 'Mensaje de exito', 'textarea', 'text', '#formSuccess', 'Gracias por compartir tu historia! La hemos recibido y la revisaremos pronto.'),
                field('f_name_label', 'Label nombre', 'text', 'text', 'label[for="nombre"]', 'Nombre o seudonimo *'),
                field('f_name_placeholder', 'Placeholder nombre', 'text', 'placeholder', '#nombre', 'Tu nombre o seudonimo'),
                field('f_email_label', 'Label email', 'text', 'text', 'label[for="email"]', 'Correo electronico *'),
                field('f_email_placeholder', 'Placeholder email', 'text', 'placeholder', '#email', 'tu@email.com'),
                field('f_country_label', 'Label pais', 'text', 'text', 'label[for="pais"]', 'Pais *'),
                field('f_country_placeholder', 'Placeholder pais', 'text', 'placeholder', '#pais', 'Tu pais'),
                field('f_title_label', 'Label titulo historia', 'text', 'text', 'label[for="titulo"]', 'Ponle titulo a tu historia *'),
                field('f_title_placeholder', 'Placeholder titulo historia', 'text', 'placeholder', '#titulo', 'Escribe un titulo para tu historia'),
                field('f_story_label', 'Label detalle historia', 'text', 'text', 'label[for="historia"]', 'Ahora si... Los Detalles *'),
                field('f_story_placeholder', 'Placeholder detalle historia', 'text', 'placeholder', '#historia', 'Cuentanos tu historia...'),
                field('f_terms_text', 'Texto de aceptacion', 'textarea', 'text', '.checkbox-label', 'He leido y acepto los terminos y condiciones')
            ]
        },

        quienes: {
            id: 'quienes',
            label: 'Quienes Somos',
            file: 'quienes.html',
            fields: [
                field('page_title', 'Titulo de la pagina', 'text', 'text', 'main h1', 'QUIENES SOMOS'),
                field('esp_heading', 'Encabezado ESP', 'text', 'text', '.text-block:nth-of-type(1) h3', '(ESP)'),
                field('esp_p1', 'Parrafo ESP 1', 'textarea', 'text', '.text-block:nth-of-type(1) p:nth-of-type(1)', 'Asi como tu, nos encanta la musica, conocer y explorar un lado de la industria musical que ha ido evolucionando con el tiempo.'),
                field('esp_p2', 'Parrafo ESP 2', 'textarea', 'text', '.text-block:nth-of-type(1) p:nth-of-type(2)', 'Quizas hayas llegado hasta esta pagina por diferentes motivos: curiosidad, casualidad, algun articulo de interes... Lo que si sabemos es que queremos darte la bienvenida e introducirte a WhiteBox Music.'),
                field('esp_p3', 'Parrafo ESP 3', 'textarea', 'text', '.text-block:nth-of-type(1) p:nth-of-type(3)', 'WhiteBox Music reune a una amplia gama de artistas en una plataforma independiente que busca crear experiencias emocionales para todos aquellos amantes de la musica.'),
                field('eng_heading', 'Encabezado ENG', 'text', 'text', '.text-block:nth-of-type(2) h3', '(ENG)'),
                field('eng_p1', 'Parrafo ENG 1', 'textarea', 'text', '.text-block:nth-of-type(2) p:nth-of-type(1)', 'Perhaps you have stumbled upon this page by different reasons: curiosity, an article, finding new music... What we do know is we want to welcome you and introduce you to WhiteBox Music.'),
                field('eng_p2', 'Parrafo ENG 2', 'textarea', 'text', '.text-block:nth-of-type(2) p:nth-of-type(2)', 'WhiteBox Music reunites a wide range of musicians on an independent platform that searchs emotional experiences for all those music lovers.')
            ]
        },

        contacto: {
            id: 'contacto',
            label: 'Contacto',
            file: 'contacto.html',
            fields: [
                field('page_title', 'Titulo de la pagina', 'text', 'text', '.contact-container h1', 'Contacto'),
                field('box1_text', 'Texto caja 1', 'textarea', 'html', '.contact-box:nth-child(1) p', 'Tienes alguna duda, comentario? o simplemente quieres saludar, nos pondremos en contacto lo mas pronto posible.'),
                field('box1_email', 'Email caja 1', 'text', 'mailto', '.contact-box:nth-child(1) h3 a', 'hola@whiteboxm.com'),
                field('box2_text', 'Texto caja 2', 'textarea', 'html', '.contact-box:nth-child(2) p', 'Trabajamos juntos?<br>Si estas buscando una colaboracion creativa, queremos escuchar tus ideas'),
                field('box2_email', 'Email caja 2', 'text', 'mailto', '.contact-box:nth-child(2) h3 a', 'mirimn@whiteboxm.com'),
                field('middle_text', 'Frase central', 'textarea', 'text', '.middle-text', 'Estamos contentos de poder conocer tanto talento alrededor del mundo, que queremos escuchar y compartir TU musica!.'),
                field('info_intro', 'Texto intro informacion', 'textarea', 'text', '.info-section > p', 'Compartenos la siguiente informacion a hola@whiteboxm.com'),
                field('info_list', 'Lista de requisitos (uno por linea)', 'list', 'list', '.info-list li', 'Presskit (Descripcion de banda, fotos y redes)\nAlbum o cancion con link de streaming\nMenciones especiales y colaboraciones\nEntrevista escrita o Instagram Live (Programado)'),
                field('platform_1_image', 'Imagen SubmitHub', 'url', 'src', '.platform-card:nth-child(1) img', 'https://placehold.co/600x400/f9f9f9/333?text=SubmitHub'),
                field('platform_2_image', 'Imagen Groover', 'url', 'src', '.platform-card:nth-child(2) img', 'https://placehold.co/600x400/f9f9f9/333?text=Groover')
            ]
        },

        envia_musica: {
            id: 'envia_musica',
            label: 'Envia Musica',
            file: 'envia-musica.html',
            fields: [
                field('page_title', 'Titulo de la pagina', 'text', 'text', '.envia-container h1', 'Envia Musica'),
                field('page_subtitle', 'Subtitulo', 'textarea', 'text', '.envia-subtitle', 'Queremos escuchar tu musica. Si eres artista independiente y tienes un sonido que quieres que llegue a mas oidos, este es tu espacio.'),
                field('how_title', 'Titulo "Como funciona"', 'text', 'text', '.envia-section:nth-of-type(1) h2', 'Como funciona'),
                field('step1_title', 'Paso 1 titulo', 'text', 'text', '.step:nth-child(1) h3', 'Envia'),
                field('step1_text', 'Paso 1 texto', 'textarea', 'text', '.step:nth-child(1) p', 'Usa cualquiera de nuestras plataformas para enviarnos tu musica con presskit incluido.'),
                field('step2_title', 'Paso 2 titulo', 'text', 'text', '.step:nth-child(2) h3', 'Revisamos'),
                field('step2_text', 'Paso 2 texto', 'textarea', 'text', '.step:nth-child(2) p', 'Nuestro equipo escucha cada envio y evalua si encaja con el sonido de WhiteBox.'),
                field('step3_title', 'Paso 3 titulo', 'text', 'text', '.step:nth-child(3) h3', 'Compartimos'),
                field('step3_text', 'Paso 3 texto', 'textarea', 'text', '.step:nth-child(3) p', 'Publicamos tu musica en nuestra plataforma y la compartimos con nuestra comunidad.'),
                field('platforms_title', 'Titulo plataformas', 'text', 'text', '.envia-section:nth-of-type(2) h2', 'Plataformas de envio'),
                field('platforms_intro', 'Intro plataformas', 'text', 'text', '.envia-section:nth-of-type(2) > p', 'Envia tu musica a traves de estas plataformas. Todas son gratuitas para los artistas.'),
                field('plat1_name', 'Plataforma 1 nombre', 'text', 'text', '.platform-card:nth-of-type(1) h3', 'SubmitHub'),
                field('plat1_desc', 'Plataforma 1 descripcion', 'textarea', 'text', '.platform-card:nth-of-type(1) p', 'Envia tu track directamente. Respuesta garantizada en 48h.'),
                field('plat1_url', 'Plataforma 1 URL', 'url', 'href', '.platform-card:nth-of-type(1)', 'https://www.submithub.com'),
                field('plat2_name', 'Plataforma 2 nombre', 'text', 'text', '.platform-card:nth-of-type(2) h3', 'Groover'),
                field('plat2_desc', 'Plataforma 2 descripcion', 'textarea', 'text', '.platform-card:nth-of-type(2) p', 'Conecta con blogs, radios y playlists independientes.'),
                field('plat2_url', 'Plataforma 2 URL', 'url', 'href', '.platform-card:nth-of-type(2)', 'https://www.groover.co'),
                field('plat3_name', 'Plataforma 3 nombre', 'text', 'text', '.platform-card:nth-of-type(3) h3', 'Email Directo'),
                field('plat3_desc', 'Plataforma 3 descripcion', 'textarea', 'text', '.platform-card:nth-of-type(3) p', 'Envia tu presskit y musica a hola@whiteboxm.com'),
                field('plat3_url', 'Plataforma 3 URL', 'url', 'href', '.platform-card:nth-of-type(3)', 'mailto:hola@whiteboxm.com'),
                field('include_title', 'Titulo "Que incluir"', 'text', 'text', '.envia-section:nth-of-type(3) h2', 'Que incluir'),
                field('include_items', 'Lista de requisitos (uno por linea)', 'list', 'list', '.info-list li', 'Presskit completo con fotos y bio\nLink de tu musica (Spotify, SoundCloud o similar)\nDescripcion del proyecto\nRedes sociales del artista'),
                field('cta_title', 'Titulo CTA', 'text', 'text', '.cta-box h3', 'Listo para compartir tu musica?'),
                field('cta_text', 'Texto CTA', 'textarea', 'text', '.cta-box p', 'No importa el genero. Si tiene alma, queremos escucharlo.'),
                field('cta_btn', 'Texto boton CTA', 'text', 'text', '.cta-box .btn-pink', 'Enviar ahora'),
                field('cta_btn_url', 'URL boton CTA', 'url', 'href', '.cta-box .btn-pink', 'mailto:hola@whiteboxm.com')
            ]
        },

        terminos: {
            id: 'terminos',
            label: 'Terminos y Condiciones',
            file: 'terminos.html',
            fields: [
                field('page_title', 'Titulo de la pagina', 'text', 'text', 'main h1', 'Terminos y Condiciones'),
                field('last_update', 'Fecha de actualizacion', 'text', 'text', '.terms-date', 'ULTIMA ACTUALIZACION: JULIO 2024'),
                field('terms_html', 'Cuerpo completo (HTML)', 'textarea', 'html', '.terms-container', '')
            ]
        }
    };

    var byFile = {};
    Object.keys(pages).forEach(function(id) {
        byFile[pages[id].file] = id;
    });

    window.WhiteBoxSiteSchema = {
        pages: pages,
        getByFile: function(file) {
            var id = byFile[file];
            return id ? pages[id] : null;
        },
        getById: function(id) {
            return pages[id] || null;
        },
        all: function() {
            return Object.keys(pages).map(function(id) { return pages[id]; });
        }
    };
})();
