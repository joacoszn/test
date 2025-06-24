/**
 * Servicio para manejar el carrito de compras
 * @module services/cart.service
 */

import { notificationService } from './notification.service.js';

// Clave para el almacenamiento local
const STORAGE_KEY = 'growshop-cart';

/**
 * Clase para manejar el carrito de compras
 * Implementa el patrón Singleton para tener una única instancia
 */
class CartService {
  constructor() {
    if (CartService.instance) {
      return CartService.instance;
    }
    
    // Inicializar el carrito
    this.cart = this._loadCart();
    this._updateCartCount();
    this._setupEventListeners();
    
    // Guardar referencia a la instancia
    CartService.instance = this;
  }

  /**
   * Carga el carrito desde localStorage
   * @returns {Array} Carrito cargado o array vacío
   * @private
   */
  _loadCart() {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error al cargar el carrito:', error);
      notificationService.error('Error al cargar el carrito');
      return [];
    }
  }

  /**
   * Guarda el carrito en localStorage
   * @private
   */
  _saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cart));
      this._updateCartCount();
      this._dispatchCartUpdated();
      return true;
    } catch (error) {
      console.error('Error al guardar el carrito:', error);
      notificationService.error('Error al guardar el carrito');
      return false;
    }
  }

  /**
   * Actualiza el contador del carrito en la UI
   * @private
   */
  _updateCartCount() {
    const count = this.getTotalItems();
    const cartCountElements = document.querySelectorAll('.cart-count, .header__cart-count');
    
    cartCountElements.forEach(element => {
      element.textContent = count;
      element.classList.toggle('is-visible', count > 0);
    });
  }

  /**
   * Dispara un evento personalizado cuando se actualiza el carrito
   * @private
   */
  _dispatchCartUpdated() {
    const event = new CustomEvent('cartUpdated', { 
      detail: { 
        cart: [...this.cart],
        totalItems: this.getTotalItems(),
        totalPrice: this.getTotalPrice()
      } 
    });
    window.dispatchEvent(event);
  }

  /**
   * Configura los event listeners para el carrito
   * @private
   */
  _setupEventListeners() {
    // Delegación de eventos para los botones de agregar al carrito
    document.addEventListener('click', (event) => {
      const addToCartBtn = event.target.closest('[data-action="add-to-cart"]');
      
      if (addToCartBtn) {
        event.preventDefault();
        const productId = addToCartBtn.dataset.productId;
        const quantity = parseInt(addToCartBtn.dataset.quantity || '1', 10);
        this.addToCart(productId, quantity);
      }
    });
  }

  /**
   * Agrega un producto al carrito
   * @param {string} productId - ID del producto a agregar
   * @param {number} [quantity=1] - Cantidad a agregar
   * @param {Object} [productData] - Datos adicionales del producto
   * @returns {boolean} - True si se agregó correctamente
   */
  addToCart(productId, quantity = 1, productData = null) {
    if (!productId) {
      console.error('Se requiere un ID de producto');
      return false;
    }
    
    // Validar cantidad
    quantity = parseInt(quantity, 10) || 1;
    if (quantity < 1) {
      console.error('La cantidad debe ser mayor a 0');
      return false;
    }
    
    // Buscar si el producto ya está en el carrito
    const existingItemIndex = this.cart.findIndex(item => item.id === productId);
    
    if (existingItemIndex >= 0) {
      // Actualizar cantidad si el producto ya existe
      this.cart[existingItemIndex].quantity += quantity;
      
      // Actualizar datos del producto si se proporcionan
      if (productData) {
        this.cart[existingItemIndex] = {
          ...this.cart[existingItemIndex],
          ...productData,
          id: productId // Asegurar que el ID no se sobrescriba
        };
      }
    } else {
      // Agregar nuevo ítem al carrito
      this.cart.push({
        id: productId,
        quantity,
        ...(productData || {})
      });
    }
    
    // Guardar cambios y notificar
    const success = this._saveCart();
    if (success) {
      const productName = productData?.name || 'Producto';
      notificationService.success(`${productName} agregado al carrito`);
      return true;
    }
    
    return false;
  }

  /**
   * Elimina un producto del carrito
   * @param {string} productId - ID del producto a eliminar
   * @returns {boolean} - True si se eliminó correctamente
   */
  removeFromCart(productId) {
    const initialLength = this.cart.length;
    this.cart = this.cart.filter(item => item.id !== productId);
    
    if (this.cart.length < initialLength) {
      const success = this._saveCart();
      if (success) {
        notificationService.info('Producto eliminado del carrito');
        return true;
      }
    }
    
    return false;
  }

  /**
   * Actualiza la cantidad de un producto en el carrito
   * @param {string} productId - ID del producto a actualizar
   * @param {number} quantity - Nueva cantidad
   * @returns {boolean} - True si se actualizó correctamente
   */
  updateQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    
    if (item) {
      const newQuantity = Math.max(1, parseInt(quantity, 10) || 1);
      if (item.quantity !== newQuantity) {
        item.quantity = newQuantity;
        const success = this._saveCart();
        if (success) {
          notificationService.info('Cantidad actualizada');
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Vacía el carrito
   * @returns {boolean} - True si se vació correctamente
   */
  clearCart() {
    if (this.cart.length > 0) {
      this.cart = [];
      const success = this._saveCart();
      if (success) {
        notificationService.info('Carrito vaciado');
        return true;
      }
      return false;
    }
    return true; // Ya está vacío
  }

  /**
   * Obtiene el contenido actual del carrito
   * @returns {Array} Copia del contenido del carrito
   */
  getCart() {
    return [...this.cart];
  }

  /**
   * Obtiene el número total de ítems en el carrito
   * @returns {number} Número total de ítems
   */
  getTotalItems() {
    return this.cart.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  /**
   * Obtiene el precio total del carrito
   * @returns {number} Precio total
   */
  getTotalPrice() {
    return this.cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
  }

  /**
   * Verifica si el carrito está vacío
   * @returns {boolean} True si el carrito está vacío
   */
  isEmpty() {
    return this.cart.length === 0;
  }

  /**
   * Obtiene la cantidad de un producto específico en el carrito
   * @param {string} productId - ID del producto
   * @returns {number} Cantidad del producto en el carrito
   */
  getItemQuantity(productId) {
    const item = this.cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
  }

  /**
   * Verifica si un producto está en el carrito
   * @param {string} productId - ID del producto
   * @returns {boolean} True si el producto está en el carrito
   */
  hasItem(productId) {
    return this.cart.some(item => item.id === productId);
  }

  /**
   * Obtiene los IDs de los productos en el carrito
   * @returns {string[]} Array de IDs de productos
   */
  getProductIds() {
    return this.cart.map(item => item.id);
  }

  /**
   * Obtiene el total de productos únicos en el carrito
   * @returns {number} Número de productos únicos
   */
  getUniqueItemsCount() {
    return this.cart.length;
  }
}

// Exportar una instancia única del servicio
export const cartService = new CartService();
