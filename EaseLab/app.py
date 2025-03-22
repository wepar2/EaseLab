from flask import Flask, render_template, request, jsonify
import sqlite3
import os  # Importa el módulo os
from werkzeug.utils import secure_filename  # Importa secure_filename
import requests  # Para hacer solicitudes HTTP
from bs4 import BeautifulSoup  # Para parsear HTML

app = Flask(__name__)

# Configuración para la subida de archivos
UPLOAD_FOLDER = os.path.join('static', 'uploads')  # Carpeta donde se guardarán las imágenes
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4'}  # Extensiones permitidas
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Límite de tamaño de 16MB

# Función para verificar la extensión del archivo
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# Función para crear la tabla si no existe
def create_table():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            color TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            icon TEXT 
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS background_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,  -- Tipo de fondo: 'color', 'image', 'video'
            value TEXT NOT NULL  -- Valor del fondo: color en hex, URL de imagen, URL de video
        )
    ''')
    conn.commit()
    conn.close()

# Ruta principal para renderizar el HTML
@app.route('/')
def index():
    return render_template('index.html')

# Ruta para obtener todos los enlaces
@app.route('/api/links', methods=['GET'])
def get_links():
    try:
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, url, color, icon FROM links ORDER BY position ASC') # Incluir 'icon'
        links = cursor.fetchall()
        conn.close()

        if links:
            return jsonify(links)
        else:
            return jsonify(), 200
    except Exception as e:
        print(f"Error en get_links: {e}")
        return jsonify({'error': 'Error al obtener los enlaces'}), 500

############# LINKS        

# Ruta para agregar un nuevo enlace
@app.route('/api/links', methods=['POST'])
def add_link():
    data = request.form  # Cambiar a form para soportar archivos
    name = data.get('name')
    url = data.get('url')
    color = data.get('color')
    icon = data.get('icon')  # Obtener la URL del icono

    if not name or not url or not color:
        return jsonify({'error': 'Faltan datos'}), 400

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO links (name, url, color, icon) VALUES (?, ?, ?, ?)', (name, url, color, icon)) # Guardar el icono
    conn.commit()
    conn.close()
    return jsonify({'message': 'Enlace agregado correctamente'})

#ruta para actualizar el orden    
@app.route('/api/links/reorder', methods=['POST'])
def reorder_links():
    data = request.json  # Lista de IDs en el nuevo orden

    if not isinstance(data, list):
        return jsonify({'error': 'Formato incorrecto'}), 400

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    for position, link_id in enumerate(data):
        cursor.execute('UPDATE links SET position = ? WHERE id = ?', (position, link_id))

    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Orden actualizado correctamente'})

# Ruta para actualizar un enlace
@app.route('/api/links/<int:link_id>', methods=['PUT'])
def update_link(link_id):
    data = request.form  # Cambiar a form para soportar archivos
    name = data.get('name')
    url = data.get('url')
    color = data.get('color')
    icon = data.get('icon')  # Obtener la URL del icono

    if not name or not url or not color:
        return jsonify({'error': 'Faltan datos'}), 400

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE links SET name = ?, url = ?, color = ?, icon = ? WHERE id = ?', (name, url, color, icon, link_id)) # Actualizar el icono
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Enlace actualizado correctamente'})

#ruta que sube el nuevo orden
def update_table():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(links)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "position" not in columns:
        cursor.execute("ALTER TABLE links ADD COLUMN position INTEGER DEFAULT 0")
        conn.commit()
    
    conn.close()

# Ruta para eliminar un enlace
@app.route('/api/links/<int:link_id>', methods=['DELETE'])
def delete_link(link_id):
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM links WHERE id = ?', (link_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Enlace eliminado correctamente'})

############# 

############# Backgraund tools

# Ruta para obtener la configuración del fondo
@app.route('/api/background', methods=['GET'])
def get_background():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT type, value FROM background_settings ORDER BY id DESC LIMIT 1')
    background = cursor.fetchone()
    conn.close()

    if background:
        return jsonify({'type': background[0], 'value': background[1]})
    else:
        return jsonify({'type': 'color', 'value': '#001f3f'})  # Valor por defecto

# Ruta para guardar la configuración del fondo:
@app.route('/api/background', methods=['POST'])
def set_background():
    data = request.form  # Cambia a request.form para manejar datos de formulario
    print("Datos recibidos:", data)  # Depuración
    background_type = data.get('type')

    if not background_type:
        return jsonify({'error': 'Faltan datos'}), 400

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    if background_type == 'color':
        background_value = data.get('value')
        if not background_value:
            return jsonify({'error': 'Falta el valor del color'}), 400
        cursor.execute('INSERT INTO background_settings (type, value) VALUES (?, ?)', (background_type, background_value))
    elif background_type in ('image', 'video'):
        file = request.files.get('file')  # Obtiene el archivo desde request.files
        if not file or file.filename == '':
            return jsonify({'error': 'No se ha seleccionado ningún archivo'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)  # Limpia el nombre del archivo
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Crea la carpeta si no existe
            file.save(file_path)  # Guarda el archivo en el servidor
            #  Cambio importante: Construir la URL de la imagen
            # La ruta ahora es correcta asumiendo que 'uploads' está dentro de 'static'
            background_value = f'/static/uploads/{filename}'
            cursor.execute('INSERT INTO background_settings (type, value) VALUES (?, ?)', (background_type, background_value))
        else:
            return jsonify({'error': 'Tipo de archivo no permitido'}), 400
    else:
        return jsonify({'error': 'Tipo de fondo no válido'}), 400

    conn.commit()
    conn.close()

    return jsonify({'message': 'Fondo actualizado correctamente'})

############# 

############# Ruta para manejar la búsqueda de logotipos

def extract_image_urls_from_page(html):
    """Extrae las URLs de las imágenes de una página HTML."""
    image_urls = []  # Inicializar con una lista vacía
    soup = BeautifulSoup(html, 'html.parser')
    img_tags = soup.find_all('img')
    for img_tag in img_tags:
        src = img_tag.get('src')
        if src and "favicon" not in img_tag.get('class',) and "logo" not in img_tag.get('class',):
            if src.startswith(('http://', 'https://')):
                image_urls.append(src)
    return image_urls

@app.route('/endpoints/logos/search', methods=['GET'])
def search_logo():
    """Busca logotipos en Google Images."""
    search_term = request.args.get('search')
    if search_term:
        search_terms = [
            f"{search_term} logo",
            f"{search_term} logotipo"
        ]
        image_urls = []
        for term in search_terms:
            google_url = f"https://www.google.com/search?q={term}&tbm=isch&tbs=iar:xw,ift:png"
            brave_url = f"https://search.brave.com/search?q={term}"

            try:
                response = requests.get(google_url)
                response.raise_for_status()
                image_urls.extend(extract_image_urls_from_page(response.text))
            except requests.exceptions.RequestException as e:
                print(f"Error al obtener imágenes de Google: {e}")
                try:
                    response = requests.get(brave_url)
                    response.raise_for_status()
                    image_urls.extend(extract_image_urls_from_page(response.text))
                except requests.exceptions.RequestException as e:
                    print(f"Error al obtener imágenes de Brave: {e}")
                    print(f"Error al obtener imágenes de Brave: {e}")
                    return jsonify({'error': 'Failed to fetch images from both Google and Brave.'}), 500
        # Remove duplicate URLs
        image_urls = list(set(image_urls))
        return jsonify({'imageUrls': image_urls})
    else:
        return jsonify({'error': 'Invalid request.'}), 400
        
if __name__ == '__main__':
    create_table()
    update_table()
    app.run(host='0.0.0.0', port=80) 
    app.run(debug=True)