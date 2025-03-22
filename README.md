# EaseLab

EaseLab es un dashboard web personalizable que te permite organizar tus enlaces importantes de forma visual y accesible.  Puedes añadir, editar, eliminar y reordenar los enlaces, así como personalizar el fondo con colores, imágenes o videos.

![desktop.png](https://github.com/wepar2/EaseLab/blob/master/img/desktop.png)
![responsive.png](https://github.com/wepar2/EaseLab/blob/master/img/responsive.png)

## Características

* **Gestión de Enlaces:**
    * Añade nuevos enlaces con nombre, URL, color y un icono opcional.
    * Edita y elimina enlaces existentes.
    * Reordena los enlaces mediante drag-and-drop.
* **Personalización del Fondo:**
    * Cambia el color de fondo.
    * Establece una imagen de fondo (subida de archivos).
    * Utiliza un video de fondo (subida de archivos).
* **Interfaz de Usuario Intuitiva:**
    * Diseño limpio y moderno.
    * Modales para añadir, editar y cambiar el fondo.
* **Búsqueda de Iconos:**
    * Integra una función de búsqueda de logotipos para facilitar la personalización de los enlaces.
* **Almacenamiento Local:**
    * Los enlaces y la configuración se guardan en una base de datos SQLite (`database.db`).

## Tecnologías Utilizadas

* **Backend:**
    * Python
    * Flask
    * SQLite
    * `requests` y `BeautifulSoup4` para la búsqueda de logos
* **Frontend:**
    * HTML5
    * CSS3
    * JavaScript
    * Bootstrap 5
    * SortableJS para el reordenamiento drag-and-drop

## Instalación

1.  **Clonar el repositorio:**

    ```bash
    git clone <URL_del_repositorio>
    cd <nombre_del_repositorio>
    ```

2.  **Crear un entorno virtual (recomendado):**

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # En Linux/macOS
    venv\Scripts\activate  # En Windows
    ```

3.  **Instalar las dependencias:**

    ```bash
    pip install -r requirements.txt
    ```

    * Si no tienes un archivo `requirements.txt`, puedes crearlo con:

        ```bash
        pip freeze > requirements.txt 
        ```
        * Asegúrate de ejecutar este comando después de instalar las dependencias. Las dependencias de tu proyecto son:
            * Flask
            * `requests`
            * `beautifulsoup4`
            * `Werkzeug`
            * `python-dotenv`
4.  **Inicializar la base de datos:**

    * La base de datos `database.db` se creará automáticamente al ejecutar la aplicación.

5.  **Ejecutar la aplicación:**

    ```bash
    python app.py
    ```

6.  **Acceder a la aplicación:**

    * Abre tu navegador web y visita `http://127.0.0.1:5000` o la dirección que se muestre en la consola.

## Uso

* **Añadir un enlace:** Haz clic en el botón "+ Añadir Enlace" para abrir el modal y completar los campos.
* **Editar/Eliminar un enlace:** Activa el modo de edición haciendo clic en el botón "Editar". Aparecerán botones de "Editar" en cada enlace.
* **Reordenar enlaces:** En el modo de edición, puedes arrastrar y soltar los enlaces para cambiar su orden.
* **Cambiar el fondo:** Haz clic en el botón "Cambiar Fondo" para abrir el modal y seleccionar el tipo de fondo y su valor.

## Estructura del Proyecto

EaseLab/
├── app.py              # Archivo principal de la aplicación Flask
├── templates/
│   └── index.html      # Plantilla HTML principal
├── static/
│   ├── styles.css      # Archivos CSS
│   ├── script.js       # Archivos JavaScript
│   └── img/            # Imágenes estáticas (favicon)
│   └── uploads/        # Carpeta para las imágenes/videos de fondo subidos por el usuario
├── database.db         # Base de datos SQLite
└── README.md           # Este archivo


## Contribución

Las contribuciones son bienvenidas. Si encuentras errores o tienes sugerencias de mejora, por favor, abre un "issue" o envía un "pull request" en GitHub.

## Autor

* Tapetaldev

## Licencia

Este proyecto está licenciado bajo la Apache License 2.0 - ver el archivo [LICENSE.md] para más detalles.