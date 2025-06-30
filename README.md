# THC Growshop 🌱

Aplicación web de e-commerce para equipamiento de cultivo y semillas de cannabis.

## 🚀 Características

- **Catálogo de productos**: Equipamiento de cultivo indoor y outdoor
- **Catálogo de semillas**: Genéticas premium de bancos reconocidos
- **Sistema de carrito**: Funcional con localStorage
- **Diseño responsivo**: Optimizado para móvil y desktop
- **Notificaciones**: Sistema de notificaciones en tiempo real
- **Filtros avanzados**: Búsqueda y filtrado por categorías, precios, etc.

## 📦 Instalación

### Requisitos
- Python 3.6 o superior
- Navegador web moderno

### Pasos de instalación

1. **Clonar o descargar el proyecto**
   ```bash
   # Si usas git
   git clone [URL_DEL_REPOSITORIO]
   cd thc-growshop
   ```

2. **Ejecutar el servidor de desarrollo**
   
   **Opción 1: Script automático (recomendado)**
   ```bash
   ./start.sh
   ```
   
   **Opción 2: Comando directo**
   ```bash
   python3 live-server.py
   ```
   
   **Opción 3: Usando npm (si tienes Node.js)**
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador**
   
   El servidor se abrirá automáticamente en `http://localhost:8080`

## 🛠️ Estructura del proyecto

```
thc-growshop/
├── index.html              # Página principal
├── productos.html          # Página de productos
├── semillas.html          # Página de semillas
├── carrito.html           # Página del carrito
├── styles.css             # Estilos principales
├── live-server.py         # Servidor de desarrollo
├── start.sh              # Script de inicio
├── package.json          # Configuración del proyecto
├── data/                 # Datos de productos y semillas
│   ├── products.json
│   └── seeds.json
├── js/                   # Scripts JavaScript
│   ├── services/         # Servicios (carrito, API, notificaciones)
│   ├── components/       # Componentes reutilizables
│   ├── controllers/      # Controladores de páginas
│   └── main.js          # Script principal
├── imagenes/            # Imágenes del proyecto
└── fonts/               # Fuentes personalizadas
```

## 🔧 Uso

### Navegación
- **Inicio**: Página principal con destacados
- **Equipamiento**: Catálogo de productos para cultivo
- **Semillas**: Catálogo de semillas de cannabis
- **Carrito**: Gestión de productos seleccionados

### Funcionalidades del carrito
- Agregar productos con cantidades
- Actualizar cantidades
- Eliminar productos
- Cálculo automático de totales
- Persistencia en localStorage
- Notificaciones de acciones

### Filtros disponibles
- Búsqueda por texto
- Filtrado por categoría
- Filtrado por rango de precios
- Ordenamiento múltiple

## 🎨 Personalización

### Colores principales
- Verde principal: `#27ae60`
- Fondo oscuro: `#1a1a1a`
- Texto claro: `#ffffff`

### Fuentes
- Principal: Poppins (Google Fonts)
- Títulos: Montserrat (Google Fonts)
- Personalizada: Bronova (local)

## 🐛 Solución de problemas

### El carrito no funciona
- Verifica que JavaScript esté habilitado
- Revisa la consola del navegador para errores
- Asegúrate de que los servicios se carguen correctamente

### Los productos no se cargan
- Verifica que el servidor esté ejecutándose
- Revisa que los archivos JSON estén en la carpeta `data/`
- Comprueba la consola para errores de red

### Problemas de rendimiento
- Usa navegadores modernos
- Verifica la conexión a internet para fuentes externas
- Revisa si hay errores 404 en la consola

## 📱 Compatibilidad

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Móviles iOS/Android

## 🔄 Comandos disponibles

```bash
# Iniciar servidor de desarrollo
npm run dev
# o
python3 live-server.py
# o
./start.sh

# Linting (pendiente configurar)
npm run lint

# Tests (pendiente configurar)
npm run test
```

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 👥 Contribución

1. Fork el proyecto
2. Crea tu rama de features (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, por favor:
- Abre un issue en el repositorio
- Contacta al equipo de desarrollo

---

**THC Growshop** - *Tu tienda de confianza para productos de cultivo* 🌱
