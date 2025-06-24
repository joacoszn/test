/**
 * Componente de tarjeta de producto
 * @module components/ProductCard
 */

import { cartService } from '../services/cart.service.js';

/**
 * Crea una tarjeta de producto
 * @param {Object} product - Datos del producto
 * @param {string} [type='product'] - Tipo de producto (product/seed)
 * @returns {HTMLElement} - Elemento de tarjeta de producto
 */
export function createProductCard(product, type = 'product') {
  if (!product) return null;

  // Crear elemento de tarjeta
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.id = product.id;
  card.dataset.category = product.categoria || '';
  
  // Determinar si es producto o semilla para la clase CSS
  const isSeed = type.toLowerCase() === 'seed';
  if (isSeed) {
    card.classList.add('product-card--seed');
  }

  // Extraer datos del producto
  const {
    nombre = 'Producto sin nombre',
    descripcion = 'Sin descripción disponible',
    precio = 0,
    imagen = 'https://via.placeholder.com/300x300?text=Imagen+no+disponible',
    stock = 0,
    descuento = 0,
    esNuevo = false,
    esOferta = false
  } = product;

  // Formatear precio
  const priceFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(precio);

  // Calcular precio con descuento si aplica
  let priceWithDiscount = '';
  if (descuento > 0 && descuento < 100) {
    const discountAmount = (precio * descuento) / 100;
    const finalPrice = precio - discountAmount;
    priceWithDiscount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(finalPrice);
  }

  // Crear el HTML de la tarjeta
  card.innerHTML = `
    <div class="product-card__image-container">
      <img 
        src="${imagen}" 
        alt="${nombre}" 
        class="product-card__image" 
        loading="lazy"
        onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Imagen+no+disponible'"
      >
      ${esNuevo ? '<span class="product-card__badge product-card__badge--new">Nuevo</span>' : ''}
      ${esOferta ? '<span class="product-card__badge product-card__badge--sale">Oferta</span>' : ''}
      ${descuento > 0 ? `<span class="product-card__discount">-${descuento}%</span>` : ''}
      
      <div class="product-card__overlay">
        <button class="product-card__quick-view" data-action="quick-view" data-product-id="${product.id}">
          <i class="fas fa-eye"></i> Vista rápida
        </button>
      </div>
    </div>
    
    <div class="product-card__content">
      ${product.categoria ? `
        <span class="product-card__category">${product.categoria}</span>
      ` : ''}
      
      <h3 class="product-card__title">
        <a href="${isSeed ? 'semilla' : 'producto'}.html?id=${product.id}" class="product-card__link">
          ${nombre}
        </a>
      </h3>
      
      <div class="product-card__description">
        ${descripcion.length > 100 ? `${descripcion.substring(0, 100)}...` : descripcion}
      </div>
      
      <div class="product-card__footer">
        <div class="product-card__prices">
          ${priceWithDiscount ? `
            <span class="product-card__price product-card__price--old">${priceFormatted}</span>
            <span class="product-card__price product-card__price--discount">${priceWithDiscount}</span>
          ` : `
            <span class="product-card__price">${priceFormatted}</span>
          `}
        </div>
        
        <button 
          class="product-card__add-to-cart" 
          data-action="add-to-cart" 
          data-product-id="${product.id}"
          ${stock <= 0 ? 'disabled' : ''}
        >
          <i class="fas ${stock > 0 ? 'fa-shopping-cart' : 'fa-times-circle'}"></i>
          ${stock > 0 ? 'Agregar' : 'Sin stock'}
        </button>
      </div>
    </div>
  `;

  // Agregar eventos
  const addToCartBtn = card.querySelector('[data-action="add-to-cart"]');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (stock > 0) {
        cartService.addToCart(product.id, 1, {
          name: nombre,
          price: precio,
          image: imagen,
          category: product.categoria
        });
      }
    });
  }

  // Agregar evento para vista rápida
  const quickViewBtn = card.querySelector('[data-action="quick-view"]');
  if (quickViewBtn) {
    quickViewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Disparar evento personalizado para vista rápida
      const event = new CustomEvent('quickView', { 
        detail: { productId: product.id } 
      });
      document.dispatchEvent(event);
    });
  }

  return card;
}

/**
 * Renderiza una lista de productos en un contenedor
 * @param {Array} products - Lista de productos
 * @param {HTMLElement} container - Contenedor donde se renderizarán las tarjetas
 * @param {string} [type='product'] - Tipo de producto (product/seed)
 */
export function renderProductList(products, container, type = 'product') {
  if (!container || !Array.isArray(products)) return;
  
  // Limpiar contenedor
  container.innerHTML = '';
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search no-results__icon"></i>
        <h3 class="no-results__title">No se encontraron productos</h3>
        <p class="no-results__message">Intenta con otros criterios de búsqueda o filtros.</p>
      </div>
    `;
    return;
  }
  
  // Crear y agregar tarjetas al contenedor
  const fragment = document.createDocumentFragment();
  products.forEach(product => {
    const card = createProductCard(product, type);
    if (card) {
      fragment.appendChild(card);
    }
  });
  
  container.appendChild(fragment);
}

/**
 * Inicializa los componentes de tarjetas de producto
 * @param {string} [containerSelector='.products-grid'] - Selector del contenedor de productos
 * @param {string} [type='product'] - Tipo de producto (product/seed)
 */
export function initProductCards(containerSelector = '.products-grid', type = 'product') {
  const containers = document.querySelectorAll(containerSelector);
  if (!containers.length) return;
  
  containers.forEach(container => {
    // Si el contenedor ya tiene tarjetas, inicializar eventos
    const cards = container.querySelectorAll('.product-card');
    if (cards.length > 0) {
      cards.forEach(card => {
        const productId = card.dataset.id;
        const addToCartBtn = card.querySelector('[data-action="add-to-cart"]');
        
        if (addToCartBtn) {
          addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Aquí podrías obtener más datos del producto si es necesario
            cartService.addToCart(productId, 1);
          });
        }
      });
    }
  });
}
