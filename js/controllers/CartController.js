/**
 * UNIFIED CART CONTROLLER - Sistema unificado del carrito
 * Maneja la funcionalidad del carrito para productos y semillas
 * @author THC Growshop
 * @version 3.0.0
 */

class CartController {
    constructor() {
        this.cartService = window.CartService;
        this.notificationService = window.NotificationService;
        this.isInitialized = false;
        
        if (!this.cartService || !this.notificationService) {
            console.error('Servicios no disponibles');
            return;
        }
        
        this.init();
    }

    /**
     * Inicializa el controlador del carrito
     */
    init() {
        if (this.isInitialized) return;
        
        this.bindEvents();
        this.updateCartDisplay();
        this.isInitialized = true;
        
        console.log('✅ CartController inicializado correctamente');
    }

    /**
     * Vincula eventos globales del carrito
     */
    bindEvents() {
        console.log('🔗 CartController: Vinculando eventos globales');
        
        // Delegación de eventos para botones de agregar al carrito
        document.addEventListener('click', (e) => {
            console.log('👆 CartController: Click detectado en', e.target);
            
            const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
            if (addToCartBtn) {
                console.log('🛒 CartController: Botón de carrito detectado!', addToCartBtn);
                e.preventDefault();
                e.stopPropagation();
                this.handleAddToCart(addToCartBtn);
            }

            // Otros botones de acción
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn && actionBtn.dataset.action !== 'add-to-cart') {
                e.preventDefault();
                this.handleProductAction(actionBtn);
            }
        });

        // Escuchar eventos del carrito
        document.addEventListener('cart:updated', () => {
            this.updateCartDisplay();
            this.updateCartButtons();
        });

        document.addEventListener('cart:item-added', (e) => {
            this.handleItemAdded(e.detail);
        });

        document.addEventListener('cart:item-removed', (e) => {
            this.handleItemRemoved(e.detail);
        });
    }

    /**
     * Maneja la acción de agregar al carrito
     * @param {HTMLElement} button - Botón que fue clickeado
     */
    handleAddToCart(button) {
        if (!this.cartService || !this.notificationService) {
            console.error('Servicios del carrito no disponibles');
            return;
        }

        const productId = button.dataset.productId || button.dataset.seedId;
        if (!productId) {
            console.error('ID del producto no encontrado');
            return;
        }

        // Verificar si ya está en el carrito
        if (this.cartService.hasItem(productId)) {
            this.notificationService.warning('Este producto ya está en tu carrito');
            return;
        }

        // Obtener datos del producto desde el DOM o desde los datos cargados
        const productData = this.extractProductData(button);
        if (!productData) {
            console.error('No se pudieron obtener los datos del producto');
            return;
        }

        // Agregar al carrito
        const result = this.cartService.addItem(productData, 1);
        
        if (result.success) {
            this.updateButtonState(button, true);
            this.notificationService.success(`${productData.name} agregado al carrito`);
            this.updateCartDisplay();
        } else {
            this.notificationService.error(result.error || 'Error al agregar al carrito');
        }
    }

    /**
     * Extrae datos del producto desde el DOM
     * @param {HTMLElement} button - Botón del producto
     * @returns {Object|null} Datos del producto
     */
    extractProductData(button) {
        const productCard = button.closest('.product-card, .seed-card');
        if (!productCard) return null;

        const productId = button.dataset.productId || button.dataset.seedId;
        const title = productCard.querySelector('.product-card__title, .seed-card__title');
        const image = productCard.querySelector('.product-card__image, .seed-card__image');
        const category = productCard.querySelector('.product-card__category, .seed-card__bank');
        const priceElement = productCard.querySelector('.product-card__price, .seed-card__price');

        if (!title || !productId) return null;

        // Extraer precio numérico
        let price = 0;
        if (priceElement) {
            const priceText = priceElement.textContent || priceElement.innerText;
            const numericPrice = priceText.replace(/[^\d]/g, '');
            price = parseInt(numericPrice) || 0;
        }

        return {
            id: productId,
            name: title.textContent || title.innerText || 'Producto sin nombre',
            price: price,
            image: image ? image.src : 'imagenes/Logo.png',
            category: category ? (category.textContent || category.innerText) : 'Sin categoría'
        };
    }

    /**
     * Actualiza el estado visual del botón
     * @param {HTMLElement} button - Botón a actualizar
     * @param {boolean} inCart - Si está en el carrito
     */
    updateButtonState(button, inCart) {
        const icon = button.querySelector('i');
        const text = button.querySelector('span');

        if (inCart) {
            button.classList.add('product-card__add-to-cart--in-cart', 'seed-card__add-to-cart--in-cart');
            button.disabled = true;
            
            if (icon) {
                icon.className = 'fas fa-check';
            }
            
            if (text) {
                text.textContent = 'En Carrito';
            }
            
            button.setAttribute('aria-label', 'Ya en el carrito');
        } else {
            button.classList.remove('product-card__add-to-cart--in-cart', 'seed-card__add-to-cart--in-cart');
            button.disabled = false;
            
            if (icon) {
                icon.className = 'fas fa-shopping-cart';
            }
            
            if (text) {
                text.textContent = 'Agregar';
            }
            
            button.setAttribute('aria-label', 'Agregar al carrito');
        }
    }

    /**
     * Actualiza todos los botones del carrito en la página
     */
    updateCartButtons() {
        const addToCartButtons = document.querySelectorAll('[data-action="add-to-cart"]');
        
        addToCartButtons.forEach(button => {
            const productId = button.dataset.productId || button.dataset.seedId;
            if (productId) {
                const inCart = this.cartService.hasItem(productId);
                this.updateButtonState(button, inCart);
            }
        });
    }

    /**
     * Actualiza la visualización del carrito (contador)
     */
    updateCartDisplay() {
        if (!this.cartService) return;

        const cart = this.cartService.getCart();
        const cartCounts = document.querySelectorAll('.cart-count, .header__cart-count');
        
        cartCounts.forEach(element => {
            element.textContent = cart.totalItems;
            element.style.display = cart.totalItems > 0 ? 'inline' : 'none';
        });
    }

    /**
     * Maneja otras acciones de productos (favoritos, info, etc.)
     * @param {HTMLElement} button - Botón de acción
     */
    handleProductAction(button) {
        const action = button.dataset.action;
        const productId = button.dataset.productId || button.dataset.seedId;

        switch (action) {
            case 'wishlist':
                this.handleAddToWishlist(productId);
                break;
            case 'info':
                this.handleShowInfo(productId);
                break;
            default:
                console.log('Acción no reconocida:', action);
        }
    }

    /**
     * Maneja agregar a favoritos
     * @param {string} productId - ID del producto
     */
    handleAddToWishlist(productId) {
        // TODO: Implementar funcionalidad de favoritos
        this.notificationService.info('Funcionalidad de favoritos próximamente');
    }

    /**
     * Maneja mostrar información del producto
     * @param {string} productId - ID del producto
     */
    handleShowInfo(productId) {
        // TODO: Implementar modal de información
        this.notificationService.info('Vista detallada próximamente');
    }

    /**
     * Maneja cuando se agrega un item al carrito
     * @param {Object} item - Item agregado
     */
    handleItemAdded(item) {
        console.log('Item agregado al carrito:', item);
    }

    /**
     * Maneja cuando se elimina un item del carrito
     * @param {Object} item - Item eliminado
     */
    handleItemRemoved(item) {
        console.log('Item eliminado del carrito:', item);
        this.updateCartButtons();
    }

    /**
     * Limpia el carrito completamente
     */
    clearCart() {
        if (this.cartService) {
            this.cartService.clear();
            this.updateCartDisplay();
            this.updateCartButtons();
            this.notificationService.success('Carrito vaciado');
        }
    }

    /**
     * Obtiene estadísticas del carrito
     * @returns {Object} Estadísticas del carrito
     */
    getCartStats() {
        return this.cartService ? this.cartService.getStats() : {};
    }
}

// Hacer disponible globalmente
window.CartController = CartController;
