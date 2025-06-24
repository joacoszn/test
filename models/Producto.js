/**
 * Clase que representa un producto en la tienda
 * @class
 */
class Producto {
  /**
   * Crea una instancia de Producto
   * @param {Object} config - Configuración del producto
   * @param {string} config.id - Identificador único del producto
   * @param {string} config.nombre - Nombre del producto
   * @param {string} config.categoria - Categoría técnica del producto
   * @param {string} config.categoriaDisplay - Nombre para mostrar de la categoría
   * @param {string} config.descripcion - Descripción detallada
   * @param {number} config.precio - Precio en ARS
   * @param {string} config.imagen - Ruta a la imagen del producto
   * @param {string} [config.alt] - Texto alternativo para la imagen
   */
  constructor({
    id,
    nombre,
    categoria,
    categoriaDisplay,
    descripcion,
    precio,
    imagen,
    alt = nombre,
  }) {
    if (!id || !nombre || !categoria || !categoriaDisplay || !descripcion || precio === undefined || !imagen) {
      throw new Error('Faltan propiedades requeridas para crear un Producto');
    }

    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.categoriaDisplay = categoriaDisplay;
    this.descripcion = descripcion;
    this.precio = Number(precio);
    this.imagen = imagen;
    this.alt = alt;
  }

  /**
   * Formatea el precio según la configuración regional
   * @returns {string} Precio formateado
   * @private
   */
  _formatearPrecio() {
    return this.precio.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    });
  }

  /**
   * Genera el HTML para la tarjeta del producto
   * @returns {string} HTML de la tarjeta
   */
  crearTarjeta() {
    const precioFormateado = this._formatearPrecio();

    return `
      <article class="card product-card" data-id="${this.id}" data-categoria="${this.categoria}">
        <a href="#" class="card__link" aria-label="Ver detalles de ${this.nombre}">
          <div class="card__image-container">
            <img 
              src="${this.imagen}" 
              alt="${this.alt}" 
              class="card__image" 
              loading="lazy"
              width="300"
              height="200"
            >
          </div>
          <div class="card__content">
            <span class="card__category">${this.categoriaDisplay}</span>
            <h3 class="card__title">${this.nombre}</h3>
            <p class="card__description">${this.descripcion}</p>
            <div class="card__footer">
              <p class="card__price">${precioFormateado}</p>
              <button 
                class="btn btn--primary btn--sm add-to-cart" 
                data-product-id="${this.id}"
                aria-label="Agregar ${this.nombre} al carrito"
              >
                Agregar
              </button>
            </div>
          </div>
        </a>
      </article>
    `;
  }

  /**
   * Verifica si el producto coincide con los filtros aplicados
   * @param {Object} filtros - Objeto con los filtros a aplicar
   * @returns {boolean} true si el producto coincide con los filtros
   */
  coincideConFiltros(filtros) {
    const { searchTerm = '', categoria = 'todos' } = filtros;
    const searchLower = searchTerm.toLowerCase();

    // Buscar por término de búsqueda
    if (searchTerm && !this._coincideConBusqueda(searchLower)) {
      return false;
    }

    // Filtrar por categoría
    if (categoria !== 'todos' && this.categoria !== categoria) {
      return false;
    }

    return true;
  }

  /**
   * Verifica si el producto coincide con el término de búsqueda
   * @param {string} searchTerm - Término de búsqueda en minúsculas
   * @returns {boolean}
   * @private
   */
  _coincideConBusqueda(searchTerm) {
    return (
      this.nombre.toLowerCase().includes(searchTerm) ||
      this.descripcion.toLowerCase().includes(searchTerm) ||
      this.categoriaDisplay.toLowerCase().includes(searchTerm)
    );
  }
}

export default Producto;
