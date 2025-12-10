/* --- script.js --- */
function openModal(type, url) {
    const modal = document.getElementById('myModal');
    const container = document.getElementById('modal-content-container');
    
    modal.style.display = "flex";
    container.innerHTML = ""; 

    if (type === 'img') {
        container.innerHTML = `
            <img src="${url}" style="max-height: 80vh; max-width: 100%; border: 10px solid white;">
        `;
    } else if (type === 'video') {
        container.innerHTML = `
            <iframe width="800" height="450" src="${url}" frameborder="0" allowfullscreen style="max-width:100%;"></iframe>
        `;
    }
}

function closeModal() {
    document.getElementById('myModal').style.display = "none";
    document.getElementById('modal-content-container').innerHTML = "";
}

window.onclick = function(event) {
    const modal = document.getElementById('myModal');
    if (event.target == modal) { closeModal(); }
    /* --- Agrega esto a script.js --- */

// Seleccionamos los elementos
const menuBtn = document.getElementById('menu-btn');
const body = document.getElementById('body-content');

// Escuchamos el clic en el botón
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        // Si la pantalla es grande (Desktop)
        if (window.innerWidth > 768) {
            body.classList.toggle('menu-closed');
        } 
        // Si la pantalla es pequeña (Móvil)
        else {
            body.classList.toggle('menu-open');
        }
    });
}
