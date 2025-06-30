/**
 * UNIFIED CART CONTROLLER - Sistema Unificado del Carrito
 * Soluciona todos los problemas de persistencia y eventos del carrito
 * @author THC Growshop  
 * @version 3.1.0
 */

class UnifiedCartController {
    constructor() {
        this.cartService = null;
        this.notificationService = null;
        this.isInitialized = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 50;
        
        console.log('🔄 UnifiedCartController: Iniciando...');
        this.init();
    }

    /**
     * Inicialización del controlador
     */
    init() {
        this.initAttempts++;
        
        // Intentar obtener los servicios
        this.cartService = window.CartService || window.cartService;
        this.notificationService = window.NotificationService || window.notificationService;
        
        console.log(`Intento ${this.initAttempts}: CartService=${!!this.cartService}, NotificationService=${!!this.notificationService}`);
        
        if (this.cartService && this.notificationService) {
            this.setupController();
        } else if (this.initAttempts < this.maxInitAttempts) {
            // Reintentar después de 100ms
            setTimeout(() => this.init(), 100);
        } else {
            console.error('❌ UnifiedCartController: No se pudieron cargar los servicios después de', this.maxInitAttempts, 'intentos');
        }
    }

    /**
     * Configuración principal del controlador
     */
    setupController() {
        if (this.isInitialized) {
            console.log('⚠️ UnifiedCartController ya está inicializado');
            return;
        }

        console.log('✅ UnifiedCartController: Servicios disponibles, configurando...');
        
        this.bindGlobalEvents();
        this.updateCartDisplay();
        this.updateCartButtons();
        this.isInitialized = true;
        
        console.log('🎉 UnifiedCartController: Inicializado correctamente');
        
        // Hacer disponible globalmente
        window.unifiedCartController = this;
    }

    /**
     * Vincula eventos globales
     */
    bindGlobalEvents() {
        console.log('🔗 UnifiedCartController: Vinculando eventos globales');
        
        // Delegación de eventos para TODOS los botones de carrito
        document.addEventListener('click', (e) => {
            console.log('👆 UnifiedCartController: Click detectado en:', e.target.tagName, e.target.className);
            
            // Buscar el botón de agregar al carrito más cercano
            const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
            if (addToCartBtn) {
                console.log('🛒 UnifiedCartController: Botón de carrito detectado!', {
                    button: addToCartBtn,
                    productId: addToCartBtn.dataset.productId,
                    disabled: addToCartBtn.disabled,
                    style: addToCartBtn.style.cssText
                });
                e.preventDefault();
                e.stopPropagation();
                this.handleAddToCart(addToCartBtn);
                return;
            }

            // Manejar botones de cantidad
            const quantityBtn = e.target.closest('[data-action="quantity-increase"], [data-action="quantity-decrease"]');
            if (quantityBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleQuantityChange(quantityBtn);
                return;
            }

            // Otros botones de acción
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn && !['add-to-cart', 'quantity-increase', 'quantity-decrease'].includes(actionBtn.dataset.action)) {
                e.preventDefault();
                this.handleOtherActions(actionBtn);
            }
        }, true); // Usar captura para interceptar antes que otros handlers

        // Manejar cambios en inputs de cantidad
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                this.handleQuantityInputChange(e.target);
            }
        });

        // Escuchar eventos del carrito
        document.addEventListener('cart:updated', () => {
            console.log('📢 Evento cart:updated recibido');
            this.updateCartDisplay();
            this.updateCartButtons();
        });

        document.addEventListener('cart:item-added', (e) => {
            console.log('📢 Evento cart:item-added recibido:', e.detail);
            this.handleItemAdded(e.detail);
        });

        document.addEventListener('cart:item-removed', (e) => {
            console.log('📢 Evento cart:item-removed recibido:', e.detail);
            this.handleItemRemoved(e.detail);
        });

        console.log('✅ Eventos globales vinculados correctamente');
    }

    /**
     * Maneja la acción de agregar al carrito
     * @param {HTMLElement} button - Botón que fue clickeado
     */
    handleAddToCart(button) {
        console.log('🛒 handleAddToCart iniciado');
        
        if (!this.cartService || !this.notificationService) {
            console.error('❌ Servicios no disponibles');
            return;
        }

        const productId = button.dataset.productId || button.dataset.seedId;
        if (!productId) {
            console.error('❌ ID del producto no encontrado');
            this.notificationService.error('Error: ID del producto no encontrado');
            return;
        }

        console.log('🔍 Procesando producto ID:', productId);

        // Verificar si ya está en el carrito
        if (this.cartService.hasItem(productId)) {
            console.log('⚠️ Producto ya está en el carrito');
            this.notificationService.warning('Este producto ya está en tu carrito');
            return;
        }

        // Obtener datos del producto
        const productData = this.extractProductData(button);
        if (!productData) {
            console.error('❌ No se pudieron obtener los datos del producto');
            this.notificationService.error('Error al obtener los datos del producto');
            return;
        }

        // Obtener cantidad desde el input
        const quantity = this.getQuantityForProduct(productId);
        console.log('📦 Datos del producto extraídos:', productData, 'Cantidad:', quantity);

        // Agregar al carrito
        const result = this.cartService.addItem(productData, quantity);
        console.log('📊 Resultado del carrito:', result);

        if (result.success) {
            this.updateButtonState(button, true);
            this.notificationService.success(`${productData.name} (${quantity}) agregado al carrito`);
            this.updateCartDisplay();
            this.resetQuantityInput(productId);
            console.log('✅ Producto agregado exitosamente');
        } else {
            this.notificationService.error(result.error || 'Error al agregar al carrito');
            console.error('❌ Error al agregar producto:', result.error);
        }
    }

    /**
     * Maneja cambios en la cantidad usando botones +/-
     * @param {HTMLElement} button - Botón de cantidad
     */
    handleQuantityChange(button) {
        const action = button.dataset.action;
        const productId = button.dataset.productId || button.dataset.seedId;
        const quantityInput = this.getQuantityInput(productId);
        
        if (!quantityInput) {
            console.error('❌ Input de cantidad no encontrado para:', productId);
            return;
        }

        const currentValue = parseInt(quantityInput.value) || 1;
        const min = parseInt(quantityInput.min) || 1;
        const max = parseInt(quantityInput.max) || 99;
        
        let newValue = currentValue;
        
        if (action === 'quantity-increase') {
            newValue = Math.min(currentValue + 1, max);
        } else if (action === 'quantity-decrease') {
            newValue = Math.max(currentValue - 1, min);
        }
        
        quantityInput.value = newValue;
        
        // Actualizar estado de botones
        this.updateQuantityButtons(productId, newValue, min, max);
        
        // Dispatch evento personalizado
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Maneja cambios directos en el input de cantidad
     * @param {HTMLElement} input - Input de cantidad
     */
    handleQuantityInputChange(input) {
        const productId = input.dataset.productId || input.dataset.seedId;
        const value = parseInt(input.value) || 1;
        const min = parseInt(input.min) || 1;
        const max = parseInt(input.max) || 99;
        
        // Validar y corregir valor
        const validValue = Math.max(min, Math.min(max, value));
        
        if (validValue !== value) {
            input.value = validValue;
        }
        
        // Actualizar estado de botones
        this.updateQuantityButtons(productId, validValue, min, max);
    }

    /**
     * Obtiene la cantidad actual para un producto
     * @param {string} productId - ID del producto
     * @returns {number} Cantidad seleccionada
     */
    getQuantityForProduct(productId) {
        const quantityInput = this.getQuantityInput(productId);
        return quantityInput ? (parseInt(quantityInput.value) || 1) : 1;
    }

    /**
     * Obtiene el input de cantidad para un producto
     * @param {string} productId - ID del producto
     * @returns {HTMLElement|null} Input de cantidad
     */
    getQuantityInput(productId) {
        return document.querySelector(`input.quantity-input[data-product-id="${productId}"], input.quantity-input[data-seed-id="${productId}"]`);
    }

    /**
     * Resetea el input de cantidad a 1
     * @param {string} productId - ID del producto
     */
    resetQuantityInput(productId) {
        const quantityInput = this.getQuantityInput(productId);
        if (quantityInput) {
            quantityInput.value = 1;
            this.updateQuantityButtons(productId, 1, 1, 99);
        }
    }

    /**
     * Actualiza el estado de los botones de cantidad
     * @param {string} productId - ID del producto
     * @param {number} value - Valor actual
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     */
    updateQuantityButtons(productId, value, min, max) {
        const decreaseBtn = document.querySelector(`[data-action="quantity-decrease"][data-product-id="${productId}"], [data-action="quantity-decrease"][data-seed-id="${productId}"]`);
        const increaseBtn = document.querySelector(`[data-action="quantity-increase"][data-product-id="${productId}"], [data-action="quantity-increase"][data-seed-id="${productId}"]`);
        
        if (decreaseBtn) {
            decreaseBtn.disabled = value <= min;
        }
        
        if (increaseBtn) {
            increaseBtn.disabled = value >= max;
        }
    }

    /**
     * Extrae datos del producto desde el DOM
     * @param {HTMLElement} button - Botón del producto
     * @returns {Object|null} Datos del producto
     */
    extractProductData(button) {
        console.log('🔍 Extrayendo datos del producto...');
        
        const productCard = button.closest('.product-card, .seed-card');
        if (!productCard) {
            console.error('❌ Tarjeta de producto no encontrada');
            return null;
        }

        const productId = button.dataset.productId || button.dataset.seedId;
        const title = productCard.querySelector('.product-card__title, .seed-card__title');
        const image = productCard.querySelector('.product-card__image, .seed-card__image');
        const category = productCard.querySelector('.product-card__category, .seed-card__bank');
        const priceElement = productCard.querySelector('.product-card__price, .seed-card__price');

        if (!title || !productId) {
            console.error('❌ Título o ID no encontrados');
            return null;
        }

        // Extraer precio numérico
        let price = 0;
        if (priceElement) {
            const priceText = priceElement.textContent || priceElement.innerText;
            // Remover todo excepto números y puntos
            const numericPrice = priceText.replace(/[^\d]/g, '');
            price = parseInt(numericPrice) || 0;
        }

        const productData = {
            id: productId,
            name: title.textContent || title.innerText || 'Producto sin nombre',
            price: price,
            image: image ? image.src : 'imagenes/Logo.png',
            category: category ? (category.textContent || category.innerText) : 'Sin categoría'
        };

        console.log('📦 Datos extraídos:', productData);
        return productData;
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
        if (!this.cartService) return;
        
        const addToCartButtons = document.querySelectorAll('[data-action="add-to-cart"]');
        console.log(`🔄 Actualizando ${addToCartButtons.length} botones de carrito`);
        
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
        
        console.log(`🔄 Actualizando contador del carrito: ${cart.totalItems} items`);
        
        cartCounts.forEach(element => {
            element.textContent = cart.totalItems;
            element.style.display = cart.totalItems > 0 ? 'inline' : 'none';
        });
    }

    /**
     * Maneja otras acciones de productos
     * @param {HTMLElement} button - Botón de acción
     */
    handleOtherActions(button) {
        const action = button.dataset.action;
        const productId = button.dataset.productId || button.dataset.seedId;

        switch (action) {
            case 'wishlist':
                this.notificationService.info('Funcionalidad de favoritos próximamente');
                break;
            case 'info':
                this.notificationService.info('Vista detallada próximamente');
                break;
            default:
                console.log('Acción no reconocida:', action);
        }
    }

    /**
     * Maneja cuando se agrega un item al carrito
     * @param {Object} item - Item agregado
     */
    handleItemAdded(item) {
        console.log('✅ Item agregado al carrito:', item);
        this.updateCartButtons();
    }

    /**
     * Maneja cuando se elimina un item del carrito
     * @param {Object} item - Item eliminado
     */
    handleItemRemoved(item) {
        console.log('🗑️ Item eliminado del carrito:', item);
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

    /**
     * Fuerza una actualización completa
     */
    forceUpdate() {
        console.log('🔄 Forzando actualización completa del carrito');
        this.updateCartDisplay();
        this.updateCartButtons();
    }
}

// Hacer disponible globalmente
window.UnifiedCartController = UnifiedCartController;

// Auto-inicializar cuando el DOM esté listo (EXCEPTO en carrito.html)
document.addEventListener('DOMContentLoaded', () => {
    // NO inicializar en carrito.html - usa CartController normal
    if (document.body.classList.contains('page--carrito')) {
        console.log('🛒 Saltando UnifiedCartController en carrito.html (usa CartController normal)');
        return;
    }
    
    console.log('📄 DOM listo, iniciando UnifiedCartController...');
    
    // Función para verificar e inicializar
    function tryInitialize() {
        if (window.CartService && window.NotificationService) {
            console.log('🎯 Servicios disponibles, inicializando UnifiedCartController...');
            window.unifiedCartController = new UnifiedCartController();
            return true;
        }
        return false;
    }
    
    // Intentar inicializar inmediatamente
    if (!tryInitialize()) {
        console.log('⏳ Servicios no disponibles, esperando...');
        
        // Reintentar cada 50ms hasta que estén disponibles
        const interval = setInterval(() => {
            if (tryInitialize()) {
                clearInterval(interval);
            }
        }, 50);
        
        // Timeout después de 10 segundos
        setTimeout(() => {
            clearInterval(interval);
            if (!window.unifiedCartController) {
                console.error('❌ TIMEOUT: UnifiedCartController no se pudo inicializar después de 10 segundos');
                console.log('Debug info:', {
                    CartService: !!window.CartService,
                    NotificationService: !!window.NotificationService
                });
            }
        }, 10000);
    }
});
