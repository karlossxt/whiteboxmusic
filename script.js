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
}