/**
 * APLICACIÓN PRINCIPAL THC GROWSHOP
 * Sistema unificado y profesional
 * @version 3.0.0
 */

// Importar servicios principales
import { loadProducts, loadSeeds } from './services/api.service.js';
import { notificationService } from './services/notification.service.js';

/**
 * Configuración global de la aplicación
 */
const APP_CONFIG = {
  selectors: {
    productGrid: '#product-grid-container',
    seedsGrid: '#seeds-grid',
    cartCount: '.cart-count, .header__cart-count',
    backToTop: '#back-to-top, .back-to-top'
  },
  classes: {
    visible: 'is-visible',
    loading: 'is-loading',
    error: 'has-error'
  }
};

/**
 * Clase principal de la aplicación
 */
class GrowShopApp {
  constructor() {
    this.isInitialized = false;
    this.currentPage = this.detectCurrentPage();
  }

  /**
   * Detecta la página actual basándose en las clases del body
   */
  detectCurrentPage() {
    if (document.body.classList.contains('page--productos')) return 'productos';
    if (document.body.classList.contains('page--semillas')) return 'semillas';
    return 'home';
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Inicializar servicios globales
      this.initializeServices();
      
      // Inicializar componentes base
      this.initializeBaseComponents();
      
      // Inicializar página específica
      await this.initializePage();
      
      this.isInitialized = true;
      console.log('✅ GrowShop App inicializada correctamente');
      
    } catch (error) {
      console.error('❌ Error al inicializar la aplicación:', error);
      notificationService.error('Error al cargar la aplicación');
    }
  }

  /**
   * Inicializa los servicios globales
   */
  initializeServices() {
    // Hacer servicios disponibles globalmente
    if (window.CartService) {
      window.cartService = window.CartService;
    }
    if (window.NotificationService) {
      window.notificationService = window.NotificationService;
    }
    
    // Inicializar contador del carrito
    this.updateCartCounter();
    
    // Escuchar eventos del carrito
    window.addEventListener('cart:updated', () => this.updateCartCounter());
    document.addEventListener('cart:updated', () => this.updateCartCounter());
  }

  /**
   * Inicializa componentes base presentes en todas las páginas
   */
  initializeBaseComponents() {
    this.initializeBackToTop();
    this.updateCurrentYear();
  }

  /**
   * Inicializa la página específica
   */
  async initializePage() {
    switch (this.currentPage) {
      case 'productos':
        await this.initializeProductsPage();
        break;
      case 'semillas':
        await this.initializeSeedsPage();
        break;
      case 'home':
        this.initializeHomePage();
        break;
    }
  }

  /**
   * Inicializa la página de productos
   */
  async initializeProductsPage() {
    const container = document.querySelector(APP_CONFIG.selectors.productGrid);
    if (!container) return;

    try {
      container.classList.add(APP_CONFIG.classes.loading);
      
      const products = await loadProducts();
      
      if (products && products.length > 0) {
        renderProductList(products, container, 'product');
      } else {
        this.renderEmptyState(container, 'productos');
      }
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.renderErrorState(container, 'productos');
    } finally {
      container.classList.remove(APP_CONFIG.classes.loading);
    }
  }

  /**
   * Inicializa la página de semillas
   */
  async initializeSeedsPage() {
    const container = document.querySelector(APP_CONFIG.selectors.seedsGrid);
    if (!container) return;

    try {
      container.classList.add(APP_CONFIG.classes.loading);
      
      const seeds = await loadSeeds();
      
      if (seeds && seeds.length > 0) {
        renderProductList(seeds, container, 'seed');
      } else {
        this.renderEmptyState(container, 'semillas');
      }
      
    } catch (error) {
      console.error('Error cargando semillas:', error);
      this.renderErrorState(container, 'semillas');
    } finally {
      container.classList.remove(APP_CONFIG.classes.loading);
    }
  }

  /**
   * Inicializa la página de inicio
   */
  initializeHomePage() {
    // Lógica específica para la página de inicio
    console.log('Página de inicio inicializada');
  }

  /**
   * Renderiza estado vacío
   */
  renderEmptyState(container, type) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-seedling empty-state__icon"></i>
        <h3 class="empty-state__title">No hay ${type} disponibles</h3>
        <p class="empty-state__message">No se encontraron ${type} en este momento.</p>
      </div>
    `;
  }

  /**
   * Renderiza estado de error
   */
  renderErrorState(container, type) {
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle error-state__icon"></i>
        <h3 class="error-state__title">Error al cargar ${type}</h3>
        <p class="error-state__message">No se pudieron cargar los ${type}. Por favor, intenta nuevamente.</p>
        <button class="btn btn--primary" onclick="window.location.reload()">Reintentar</button>
      </div>
    `;
  }

  /**
   * Actualiza el contador del carrito
   */
  updateCartCounter() {
    if (!window.cartService && !window.CartService) return;
    
    const cartService = window.cartService || window.CartService;
    const cartData = cartService.getCart();
    const count = cartData.totalItems || 0;
    const counters = document.querySelectorAll(APP_CONFIG.selectors.cartCount);
    
    counters.forEach(counter => {
      counter.textContent = count;
      counter.classList.toggle(APP_CONFIG.classes.visible, count > 0);
    });
  }

  /**
   * Inicializa el botón de volver arriba
   */
  initializeBackToTop() {
    const backToTopBtn = document.querySelector(APP_CONFIG.selectors.backToTop);
    if (!backToTopBtn) return;

    // Mostrar/ocultar según scroll
    window.addEventListener('scroll', () => {
      const shouldShow = window.pageYOffset > 300;
      backToTopBtn.classList.toggle(APP_CONFIG.classes.visible, shouldShow);
    });

    // Scroll suave al hacer clic
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Actualiza el año actual en el footer
   */
  /**
   * Inicializa eventos para los botones de acción
   */
  initializeActionButtons() {
    document.body.addEventListener('click', (event) => {
      const addToCartBtn = event.target.closest('.add-to-cart');
      if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId;
        this.handleProductAddToCart(productId);
      }
      if (addToCartBtn) {
        const productId = addToCartBtn.dataset.productId;
        const product = this.getProductById(productId);
        if (product) {
          cartService.addItem(product);
          notificationService.notify('Producto agregado al carrito', 'success');
        }
      }
    });
  }

  /**
   * Obtiene el objeto del producto por ID
   * @param {string} id - ID del producto
   * @returns {Object|null} Producto o null si no existe
   */
  getProductById(id) {
    const allProducts = [
      ...window.products || [],
      ...window.seeds || []
    ];
    return allProducts.find(p => p.id === id) || null;
  }

  /**
   * Actualiza el año actual en el footer
   */
  updateCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }
}

// Instancia global de la aplicación
const app = new GrowShopApp();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Exportar para acceso global
window.GrowShopApp = app;

// Manejo de errores globales
window.addEventListener('error', (event) => {
  console.error('Error no capturado:', event.error);
  notificationService.error('Ha ocurrido un error inesperado');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no capturada:', event.reason);
  notificationService.error('Error de conexión o carga de datos');
});
