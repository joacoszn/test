import Producto from './Producto.js';

/**
 * Clase que representa una semilla en la tienda, hereda de Producto
 * @class
 * @extends Producto
 */
class Semilla extends Producto {
  /**
   * Crea una instancia de Semilla
   * @param {Object} config - Configuración de la semilla
   * @param {string} config.banco - Banco de semillas
   * @param {string} config.tipoGenetico - Tipo genético (Sativa, Índica, Híbrida)
   * @param {string} config.tipoFloracion - Tipo de floración
   * @param {string} config.thc - Nivel de THC
   * @param {string} config.cbd - Nivel de CBD
   * @param {string[]} config.efectos - Lista de efectos
   * @param {string[]} config.sabores - Lista de sabores
   */
  constructor({
    banco,
    tipoGenetico,
    tipoFloracion,
    thc,
    cbd,
    efectos = [],
    sabores = [],
    ...productoProps
  }) {
    super(productoProps);
    
    this.banco = banco;
    this.tipoGenetico = tipoGenetico;
    this.tipoFloracion = tipoFloracion;
    this.thc = thc;
    this.cbd = cbd;
    this.efectos = [...efectos];
    this.sabores = [...sabores];
  }

  /**
   * Genera el HTML para la tarjeta de la semilla
   * @override
   * @returns {string} HTML de la tarjeta
   */
  crearTarjeta() {
    const precioFormateado = this._formatearPrecio();
    const efectosStr = this.efectos.join(', ');
    const saboresStr = this.sabores.join(', ');

    return `
      <article class="card seed-card" data-id="${this.id}" data-categoria="semillas">
        <div class="card__image-container">
          <img 
            src="${this.imagen}" 
            alt="${this.alt}" 
            class="card__image" 
            loading="lazy"
            width="300"
            height="300"
          >
          <div class="card__badges">
            <span class="badge badge--thc">THC: ${this.thc}%</span>
            <span class="badge badge--cbd">CBD: ${this.cbd}%</span>
          </div>
        </div>
        <div class="card__content">
          <span class="card__category">${this.banco}</span>
          <h3 class="card__title">${this.nombre}</h3>
          
          <div class="card__specs">
            <p><strong>Genética:</strong> ${this.tipoGenetico}</p>
            <p><strong>Floración:</strong> ${this.tipoFloracion}</p>
            <p><strong>Efectos:</strong> ${efectosStr}</p>
            <p><strong>Sabores:</strong> ${saboresStr}</p>
          </div>
          
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
      </article>
    `;
  }

  /**
   * Sobrescribe el método para incluir búsqueda por banco, efectos y sabores
   * @override
   * @param {string} searchTerm - Término de búsqueda en minúsculas
   * @returns {boolean}
   * @private
   */
  _coincideConBusqueda(searchTerm) {
    return (
      super._coincideConBusqueda(searchTerm) ||
      this.banco.toLowerCase().includes(searchTerm) ||
      this.tipoGenetico.toLowerCase().includes(searchTerm) ||
      this.tipoFloracion.toLowerCase().includes(searchTerm) ||
      this.efectos.some(efecto => efecto.toLowerCase().includes(searchTerm)) ||
      this.sabores.some(sabor => sabor.toLowerCase().includes(searchTerm))
    );
  }
}

export default Semilla;
