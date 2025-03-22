document.addEventListener('DOMContentLoaded', () => {
  loadBackground(); // Se ejecuta después de que la página esté lista
  loadLinks();
});

function openBackgroundModal() {
    const modal = new bootstrap.Modal(document.getElementById('backgroundModal'));
    modal.show();
}

// Función para mostrar/ocultar los botones de acción
function toggleActionButtons() {
    const actionButtons = document.querySelector('.action-buttons');
    actionButtons.classList.toggle('show');
}

// Función para aplicar el fondo:
async function applyBackground() {
    const type = document.getElementById('backgroundType').value;
    let file = null;
    let value = document.getElementById('backgroundColor').value;

    if (type === 'image') {
        file = document.getElementById('backgroundImage').files[0];
    } else if (type === 'video') {
        file = document.getElementById('backgroundVideo').files[0];
    }

    const formData = new FormData();
    formData.append('type', type);
    if (type === 'color') {
        formData.append('value', value);
    } else if (file) {
        formData.append('file', file);
    }

    if (type === 'color' || file) {
        const response = await fetch('/api/background', {
            method: 'POST',
            body: formData, // Enviar FormData sin Content-Type explícito
        });

        if (response.ok) {
            loadBackground();
            const modal = bootstrap.Modal.getInstance(document.getElementById('backgroundModal'));
            modal.hide();
        }
    }
}

function toggleBackgroundOptions() {
    const type = document.getElementById('backgroundType').value;
    const colorOption = document.getElementById('colorOption');
    const imageOption = document.getElementById('imageOption');
    const videoOption = document.getElementById('videoOption');

    colorOption.classList.add('d-none');
    imageOption.classList.add('d-none');
    videoOption.classList.add('d-none');

    if (type === 'color') {
        colorOption.classList.remove('d-none');
    } else if (type === 'image') {
        imageOption.classList.remove('d-none');
    } else if (type === 'video') {
        videoOption.classList.remove('d-none');
    }
}

// Función para leer un archivo como Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// Función para cargar el fondo guardado
async function loadBackground() {
    console.log("Cargando fondo...");  // Depuración
    const response = await fetch('/api/background');
    const background = await response.json();
    console.log("Fondo cargado:", background);  // Depuración

    if (background.type === 'color') {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = background.value;
    } else if (background.type === 'image') {
        document.body.style.backgroundImage = `url(${background.value})`;
        document.body.style.backgroundSize = 'cover';
    } else if (background.type === 'video') {
        const videoElement = document.getElementById('videoBackground');
        videoElement.src = background.value;
    }
}

async function loadLinks() {
    const response = await fetch('/api/links');
    const links = await response.json();
    const container = document.getElementById('button-container');
    container.innerHTML = '';

    links.forEach(link => {
        const newLink = document.createElement('div');
        newLink.className = 'col-auto';
        newLink.setAttribute('data-id', link[0]); // Guardamos el ID
        let linkContent = '';
        if (link[4]) { // Si hay un icono
            linkContent = `<img src="${link[4]}" alt="${link[1]}" style="max-width: 50px; max-height: 50px;">`; // Añadir estilo para limitar el tamaño
            if (link[1]) {
              linkContent += `<br>${link[1]}`; // Mostrar el texto debajo del icono si existe
            }
        } else {
            linkContent = link[1]; // Mostrar el texto
        }
        newLink.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <a href="${link[2]}" class="btn btn-custom mb-2" target="_blank" style="background-color: ${link[3]}">${linkContent}</a>
                <button class="btn btn-sm btn-light d-none" onclick="openEditModal(${link[0]}, '${link[1]}', '${link[2]}', '${link[3]}', '${link[4]}')">Editar</button>
            </div>
        `;
        container.appendChild(newLink);
    });

    // Hacer los botones arrastrables
    new Sortable(container, {
        animation: 150,
        onEnd: async function () {
            let newOrder = [];
            document.querySelectorAll('#button-container .col-auto').forEach(el => {
                newOrder.push(parseInt(el.getAttribute('data-id')));
            });

            await fetch('/api/links/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });
        }
    });
}

// Función para abrir el modal
function openModal() {
    const modal = new bootstrap.Modal(document.getElementById('addLinkModal'));
    modal.show();
}

// Función para agregar un nuevo enlace
async function addLink() {
    try {
        const name = document.getElementById('linkName').value;
        const url = document.getElementById('linkUrl').value;
        const color = document.getElementById('linkColor').value;
        const iconFile = document.getElementById('linkIcon').files[0]; // Obtener el archivo
        const iconUrl = document.getElementById('iconUrl').value; // Obtener la URL del icono

        let iconValue = iconUrl;

        if (iconFile) {
            // Si se cargó un archivo, leerlo como Data URL
            iconValue = await readFileAsDataURL(iconFile);
        }

        if (name && url && color) {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('url', url);
            formData.append('color', color);
            formData.append('icon', iconValue);  // Enviar la URL o los datos del archivo

            const response = await fetch('/api/links', {
                method: 'POST',
                body: formData, // Usar FormData para soportar archivos
            });

            if (response.ok) {
                loadLinks();
                const modal = bootstrap.Modal.getInstance(document.getElementById('addLinkModal'));
                modal.hide();
                document.getElementById('addLinkForm').reset();
            } else {
                console.error('Error al agregar el enlace');
            }
        } else {
            alert('Por favor, completa todos los campos.');
        }
    } catch (error) {
        console.error('Error en la solicitud fetch:', error);
    }
}

// Abrir el modal y rellenar los datos del enlace a editar
function openEditModal(id, name, url, color, icon) {
    document.getElementById('editLinkId').value = id;
    document.getElementById('editLinkName').value = name;
    document.getElementById('editLinkUrl').value = url;
    document.getElementById('editLinkColor').value = color;
    document.getElementById('editIconUrl').value = icon; // Establece la URL del icono

    const modal = new bootstrap.Modal(document.getElementById('editLinkModal'));
    modal.show();
}

// Guardar los cambios de edición
async function updateLink() {
    const id = document.getElementById('editLinkId').value;
    const name = document.getElementById('editLinkName').value;
    const url = document.getElementById('editLinkUrl').value;
    const color = document.getElementById('editLinkColor').value;
    const iconFile = document.getElementById('editLinkIcon').files[0]; // Obtener el archivo
    const iconUrl = document.getElementById('editIconUrl').value; // Obtener la URL del icono

    let iconValue = iconUrl;

    if (iconFile) {
        // Si se cargó un archivo, leerlo como Data URL
        iconValue = await readFileAsDataURL(iconFile);
    }

    if (name && url && color) {
         const formData = new FormData();
            formData.append('name', name);
            formData.append('url', url);
            formData.append('color', color);
            formData.append('icon', iconValue);  // Enviar la URL o los datos del archivo

        const response = await fetch(`/api/links/${id}`, {
            method: 'PUT',
             body: formData, // Usar FormData para soportar archivos
        });

        if (response.ok) {
            loadLinks();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editLinkModal'));
            modal.hide();
        } else {
            alert('Error al actualizar el enlace');
        }
    } else {
        alert('Por favor, completa todos los campos.');
    }
}

// Eliminar un enlace
async function deleteLink() {
    const id = document.getElementById('editLinkId').value;

    if (confirm('¿Estás seguro de que deseas eliminar este enlace?')) {
        const response = await fetch(`/api/links/${id}`, { method: 'DELETE' });

        if (response.ok) {
            loadLinks();
            const modal = bootstrap.Modal.getInstance(document.getElementById('editLinkModal'));
            modal.hide();
        } else {
            alert('Error al eliminar el enlace');
        }
    }
}

// Función se encargará de mostrar u ocultar los botones "Editar"
function toggleEditMode() {
    const editButtons = document.querySelectorAll('#button-container .btn-light');
    const editButton = document.querySelector('button[onclick="toggleEditMode()"]'); // Seleccionar el botón general "Editar"

    editButtons.forEach(button => {
        button.classList.toggle('d-none');
    });

    // Cambiar el icono del botón
    if (editButton.innerHTML.includes("fa-edit")) { 
        editButton.innerHTML = '<i class="fas fa-check"></i> Listo';
    } else {
        editButton.innerHTML = '<i class="fas fa-edit"></i> Editar'; 
    }
}

// abrirá una nueva ventana o pestaña con la búsqueda de imágenes en Google.
function searchIcon() {
    let linkName;
    if (document.getElementById('addLinkModal').classList.contains('show')) {
        linkName = document.getElementById('linkName').value;
    } else if (document.getElementById('editLinkModal').classList.contains('show')) {
        linkName = document.getElementById('editLinkName').value;
    }

    if (linkName) {
        const searchUrl = `https://www.google.com/search?q=${linkName} logo&tbm=isch`;
        window.open(searchUrl, '_blank');
    } else {
        alert('Por favor, introduce un nombre de enlace primero.');
    }
}

// abrirá una nueva ventana o pestaña con la búsqueda de imágenes en Google NEW
function searchLogo(modalType) {
    let nameInput;
    if (modalType === 'add') {
        nameInput = document.getElementById('linkName');
    } else if (modalType === 'edit') {
        nameInput = document.getElementById('editLinkName');
    }

    const searchTerm = nameInput.value.trim();
    if (searchTerm !== "") {
        const logoSearchPopup = document.getElementById("logo-search-results");
        logoSearchPopup.classList.add("is-open");
        const imageSearchUrl = `/endpoints/logos/search?search=${searchTerm}`; // Asegúrate de que la ruta es correcta

        fetch(imageSearchUrl)
            .then(response => response.json())
            .then(data => {
                if (data.imageUrls) {
                    displayImageResults(data.imageUrls, modalType);
                } else if (data.error) {
                    console.error(data.error);
                }
            })
            .catch(error => {
                console.error('Error al obtener los resultados de la imagen', error);
            });
    } else {
        nameInput.focus();
    }
}

// Esta función recibe las URLs de las imágenes 
function displayImageResults(imageUrls, modalType) {
    const imageContainer = document.getElementById('logo-search-images');
    imageContainer.innerHTML = ''; // Limpiar resultados anteriores

    imageUrls.forEach(url => {
        const img = document.createElement('img');
        img.src = url;
        img.onclick = () => {
            selectLogo(url, modalType); // Pasar modalType
        };
        imageContainer.appendChild(img);
    });
}

// Esta función recibe las URLs de las imágenes 
function selectLogo(imageUrl, modalType) {
    if (modalType === 'add') {
        document.getElementById('iconUrl').value = imageUrl;
    } else if (modalType === 'edit') {
        document.getElementById('editIconUrl').value = imageUrl;
    }
    document.getElementById('logo-search-results').classList.remove('is-open'); // Cerrar la ventana
    // Aquí podrías también mostrar la imagen seleccionada como previsualización si lo deseas
}

// Esta función recibe la URL de la imagen seleccionada y el modalType.
function closeLogoSearch() {
    document.getElementById('logo-search-results').classList.remove('is-open');
}

// permitir la previsualización de la imagen seleccionada
document.getElementById('linkIcon').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Crear o actualizar un elemento de imagen para la previsualización
            let previewImage = document.getElementById('iconPreview');
            if (!previewImage) {
                previewImage = document.createElement('img');
                previewImage.id = 'iconPreview';
                // Puedes añadir estilos a la imagen aquí, por ejemplo:
                previewImage.style.maxWidth = '100px';
                previewImage.style.maxHeight = '100px';
                // Insertar la imagen de previsualización en el DOM,
                // por ejemplo, antes del botón "Buscar Icono":
                document.querySelector('#linkIcon').parentNode.insertBefore(previewImage, document.querySelector('button[onclick="searchIcon()"]'));
            }
            previewImage.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

document.getElementById('editLinkIcon').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Crear o actualizar un elemento de imagen para la previsualización
            let previewImage = document.getElementById('editIconPreview');
            if (!previewImage) {
                previewImage = document.createElement('img');
                previewImage.id = 'editIconPreview';
                // Puedes añadir estilos a la imagen aquí, por ejemplo:
                previewImage.style.maxWidth = '100px';
                previewImage.style.maxHeight = '100px';
                // Insertar la imagen de previsualización en el DOM,
                // por ejemplo, antes del botón "Buscar Icono":
                document.querySelector('#editLinkIcon').parentNode.insertBefore(previewImage, document.querySelector('button[onclick="searchIcon()"]'));
            }
            previewImage.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

document.querySelectorAll('img[src^="https://encrypted-tbn0.gstatic.com"]').forEach(img => {
    img.style.maxWidth = "100px";
    img.style.maxHeight = "100px";
});

// Cargar los enlaces al iniciar la página
window.onload = loadLinks;