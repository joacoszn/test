/**
 * CART CONTROLLER - Patrón MVC
 * Gestiona toda la lógica del carrito de compras
 * @author THC Growshop
 * @version 2.0.0
 */

class CartController {
    constructor() {
        // Referencias a servicios con fallback
        this.cartService = window.CartService || window.cartService;
        this.notificationService = window.NotificationService || window.notificationService;
        this.DOM = this.cacheDOMElements();
        this.state = {
            appliedCoupon: null,
            isLoading: false
        };
        
        // Verificar servicios
        if (!this.cartService) {
            console.error('CartService no disponible en CartController');
            // Reintentar en un momento
            setTimeout(() => {
                this.cartService = window.CartService || window.cartService;
                if (this.cartService) {
                    console.log('✅ CartService ahora disponible, inicializando...');
                    this.init();
                }
            }, 500);
            return;
        }
        
        this.init();
    }

    /**
     * Cache de elementos DOM para mejor rendimiento
     */
    cacheDOMElements() {
        return {
            emptyCart: document.getElementById('empty-cart'),
            cartContent: document.getElementById('cart-content'),
            cartItemsList: document.getElementById('cart-items-list'),
            cartItemsCount: document.getElementById('cart-items-count'),
            cartSubtotal: document.getElementById('cart-subtotal'),
            cartDiscount: document.getElementById('cart-discount'),
            cartShipping: document.getElementById('cart-shipping'),
            cartTotal: document.getElementById('cart-total'),
            discountRow: document.getElementById('discount-row'),
            checkoutBtn: document.getElementById('checkout-btn'),
            couponForm: document.getElementById('coupon-form'),
            couponCode: document.getElementById('coupon-code'),
            couponMessage: document.getElementById('coupon-message'),
            freeShippingMessage: document.getElementById('free-shipping-message'),
            freeShippingRemaining: document.getElementById('free-shipping-remaining'),
            progressBarFill: document.getElementById('progress-bar-fill')
        };
    }

    /**
     * Inicialización del controlador
     */
    init() {
        this.bindEvents();
        this.render();
        
        // Escuchar eventos del carrito
        document.addEventListener('cart:updated', () => this.render());
        document.addEventListener('cart:item-added', (e) => this.handleItemAdded(e.detail));
        document.addEventListener('cart:item-removed', (e) => this.handleItemRemoved(e.detail));
    }

    /**
     * Vinculación de eventos
     */
    bindEvents() {
        // Formulario de cupón
        this.DOM.couponForm?.addEventListener('submit', (e) => this.handleCouponSubmit(e));
        
        // Checkout
        this.DOM.checkoutBtn?.addEventListener('click', () => this.handleCheckout());
        
        // Delegación de eventos para items dinámicos
        this.DOM.cartItemsList?.addEventListener('click', (e) => this.handleItemAction(e));
        this.DOM.cartItemsList?.addEventListener('change', (e) => this.handleQuantityInputChange(e));
    }

    /**
     * Renderiza la vista completa del carrito
     */
    render() {
        const cart = this.cartService.getCart();
        const isEmpty = cart.items.length === 0;

        this.toggleCartVisibility(!isEmpty);
        
        if (!isEmpty) {
            this.renderCartItems(cart.items);
            this.renderCartSummary(cart);
            this.updateFreeShippingProgress(cart.total);
        }

        this.updateCartCount(cart.totalItems);
    }

    /**
     * Alterna la visibilidad entre carrito vacío y con contenido
     */
    toggleCartVisibility(hasItems) {
        if (this.DOM.emptyCart && this.DOM.cartContent) {
            this.DOM.emptyCart.style.display = hasItems ? 'none' : 'block';
            this.DOM.cartContent.style.display = hasItems ? 'block' : 'none';
        }
    }

    /**
     * Renderiza los items del carrito
     */
    renderCartItems(items) {
        if (!this.DOM.cartItemsList) return;

        const itemsHTML = items.map(item => this.createCartItemHTML(item)).join('');
        this.DOM.cartItemsList.innerHTML = itemsHTML;
        
        // Actualizar contador de items
        if (this.DOM.cartItemsCount) {
            this.DOM.cartItemsCount.textContent = items.length;
        }
    }

    /**
     * Crea el HTML para un item del carrito
     */
    createCartItemHTML(item) {
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item__image">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </div>
                
                <div class="cart-item__details">
                    <h3 class="cart-item__name">${item.name}</h3>
                    <p class="cart-item__category">${item.category}</p>
                    ${item.variant ? `<p class="cart-item__variant">${item.variant}</p>` : ''}
                    
                    <div class="cart-item__actions">
                        <button class="cart-item__action-btn cart-item__action-btn--wishlist" 
                                data-action="add-to-wishlist" 
                                data-product-id="${item.id}"
                                aria-label="Agregar a favoritos">
                            <i class="far fa-heart"></i>
                        </button>
                        
                        <button class="cart-item__action-btn cart-item__action-btn--remove" 
                                data-action="remove" 
                                data-product-id="${item.id}"
                                aria-label="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="cart-item__quantity">
                    <label for="quantity-${item.id}" class="sr-only">Cantidad para ${item.name}</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn quantity-btn--decrease" 
                                data-action="decrease" 
                                data-product-id="${item.id}"
                                aria-label="Disminuir cantidad">
                            <i class="fas fa-minus"></i>
                        </button>
                        
                        <input type="number" 
                               id="quantity-${item.id}"
                               class="quantity-input" 
                               value="${item.quantity}" 
                               min="1" 
                               max="99"
                               data-product-id="${item.id}"
                               aria-label="Cantidad">
                        
                        <button class="quantity-btn quantity-btn--increase" 
                                data-action="increase" 
                                data-product-id="${item.id}"
                                aria-label="Aumentar cantidad">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                
                <div class="cart-item__pricing">
                    <div class="cart-item__price">$${this.formatPrice(item.price * item.quantity)}</div>
                    ${item.quantity > 1 ? `<div class="cart-item__unit-price">$${this.formatPrice(item.price)} c/u</div>` : ''}
                    ${item.originalPrice && item.originalPrice > item.price ? 
                        `<div class="cart-item__original-price">$${this.formatPrice(item.originalPrice * item.quantity)}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza el resumen del carrito
     */
    renderCartSummary(cart) {
        if (this.DOM.cartSubtotal) {
            this.DOM.cartSubtotal.textContent = `$${this.formatPrice(cart.subtotal)}`;
        }

        if (this.DOM.cartTotal) {
            this.DOM.cartTotal.textContent = `$${this.formatPrice(cart.total)}`;
        }

        if (this.DOM.cartShipping) {
            this.DOM.cartShipping.textContent = cart.shipping > 0 ? `$${this.formatPrice(cart.shipping)}` : 'Gratis';
        }

        // Mostrar descuento si hay cupón aplicado
        if (this.state.appliedCoupon && this.DOM.discountRow) {
            this.DOM.discountRow.style.display = 'flex';
            if (this.DOM.cartDiscount) {
                this.DOM.cartDiscount.textContent = `-$${this.formatPrice(cart.discount || 0)}`;
            }
        }

        // Habilitar/deshabilitar checkout
        if (this.DOM.checkoutBtn) {
            this.DOM.checkoutBtn.disabled = cart.items.length === 0;
        }
    }

    /**
     * Actualiza el progreso hacia envío gratis
     */
    updateFreeShippingProgress(total) {
        const FREE_SHIPPING_THRESHOLD = 50000;
        const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
        const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

        if (this.DOM.freeShippingRemaining) {
            this.DOM.freeShippingRemaining.textContent = this.formatPrice(remaining);
        }

        if (this.DOM.progressBarFill) {
            this.DOM.progressBarFill.style.width = `${progress}%`;
        }

        if (this.DOM.freeShippingMessage) {
            if (remaining === 0) {
                this.DOM.freeShippingMessage.innerHTML = '<i class="fas fa-check"></i> ¡Felicitaciones! Tienes envío gratis';
                this.DOM.freeShippingMessage.classList.add('free-shipping--achieved');
            } else {
                this.DOM.freeShippingMessage.classList.remove('free-shipping--achieved');
            }
        }
    }

    /**
     * Actualiza el contador del carrito en el header
     */
    updateCartCount(count) {
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline' : 'none';
        });
    }

    /**
     * Maneja las acciones de los items del carrito
     */
    handleItemAction(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        e.preventDefault();
        
        const action = button.dataset.action;
        const productId = button.dataset.productId;

        switch (action) {
            case 'remove':
                this.handleRemoveItem(productId);
                break;
            case 'increase':
                this.handleQuantityChange(productId, 1);
                break;
            case 'decrease':
                this.handleQuantityChange(productId, -1);
                break;
            case 'add-to-wishlist':
                this.handleAddToWishlist(productId);
                break;
        }
    }

    /**
     * Maneja cambios en la cantidad de productos (input directo)
     */
    handleQuantityInputChange(e) {
        if (e.target.classList.contains('quantity-input')) {
            const productId = e.target.dataset.productId;
            const newQuantity = parseInt(e.target.value);
            
            if (newQuantity > 0 && newQuantity <= 99) {
                this.cartService.updateQuantity(productId, newQuantity);
            } else {
                // Restaurar valor anterior si es inválido
                e.target.value = this.cartService.getItemQuantity(productId);
            }
        }
    }

    /**
     * Maneja cambios de cantidad con botones +/-
     */
    handleQuantityChange(productId, delta) {
        const currentQuantity = this.cartService.getItemQuantity(productId);
        const newQuantity = currentQuantity + delta;

        if (newQuantity > 0) {
            this.cartService.updateQuantity(productId, newQuantity);
        } else {
            this.handleRemoveItem(productId);
        }
    }

    /**
     * Obtiene el objeto del producto por ID
     */
    getProductById(id) {
        const allProducts = [...window.products || [], ...window.seeds || []];
        return allProducts.find(p => p.id === id) || null;
    }

    /**
     * Elimina un item del carrito
     */
    handleRemoveItem(productId) {
        const item = this.cartService.getItem(productId);
        if (!item) return;

        if (confirm(`¿Estás seguro de que quieres eliminar "${item.name}" del carrito?`)) {
            this.cartService.removeItem(productId);
            this.notificationService.success(`${item.name} eliminado del carrito`);
        }
    }

    /**
     * Agrega item a wishlist
     */
    handleAddToWishlist(productId) {
        // TODO: Implementar servicio de wishlist
        this.notificationService.info('Funcionalidad de wishlist próximamente');
    }

    /**
     * Maneja el envío del formulario de cupón
     */
    async handleCouponSubmit(e) {
        e.preventDefault();
        
        const couponCode = this.DOM.couponCode?.value.trim();
        if (!couponCode) return;

        this.setLoadingState(true);
        
        try {
            const result = await this.applyCoupon(couponCode);
            
            if (result.success) {
                this.state.appliedCoupon = result.coupon;
                this.showCouponMessage('Cupón aplicado correctamente', 'success');
                this.DOM.couponCode.value = '';
                this.render();
            } else {
                this.showCouponMessage(result.message || 'Cupón inválido', 'error');
            }
        } catch (error) {
            this.showCouponMessage('Error al aplicar el cupón', 'error');
            console.error('Error applying coupon:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Aplica un cupón de descuento (simulado)
     */
    async applyCoupon(code) {
        // Simular llamada API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const validCoupons = {
            'DESCUENTO10': { discount: 0.10, type: 'percentage' },
            'WELCOME': { discount: 5000, type: 'fixed' },
            'GROWSHOP20': { discount: 0.20, type: 'percentage' }
        };

        const coupon = validCoupons[code.toUpperCase()];
        
        if (coupon) {
            this.cartService.applyCoupon({
                code: code.toUpperCase(),
                ...coupon
            });
            
            return {
                success: true,
                coupon: coupon
            };
        }

        return {
            success: false,
            message: 'Código de cupón inválido'
        };
    }

    /**
     * Muestra mensaje de cupón
     */
    showCouponMessage(message, type) {
        if (!this.DOM.couponMessage) return;

        this.DOM.couponMessage.textContent = message;
        this.DOM.couponMessage.className = `coupon-message coupon-message--${type}`;
        
        setTimeout(() => {
            this.DOM.couponMessage.textContent = '';
            this.DOM.couponMessage.className = 'coupon-message';
        }, 5000);
    }

    /**
     * Estado de carga
     */
    setLoadingState(isLoading) {
        this.state.isLoading = isLoading;
        
        if (this.DOM.couponForm) {
            const submitBtn = this.DOM.couponForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = isLoading;
                submitBtn.innerHTML = isLoading ? 
                    '<i class="fas fa-spinner fa-spin"></i> Aplicando...' : 
                    'Aplicar Cupón';
            }
        }
    }

    /**
     * Maneja el proceso de checkout
     */
    handleCheckout() {
        const cart = this.cartService.getCart();
        
        if (cart.items.length === 0) {
            this.notificationService.warning('Tu carrito está vacío');
            return;
        }

        // TODO: Implementar lógica de checkout
        this.notificationService.info('Funcionalidad de checkout próximamente');
        console.log('Checkout data:', cart);
    }

    /**
     * Maneja cuando se agrega un item
     */
    handleItemAdded(item) {
        this.notificationService.success(`${item.name} agregado al carrito`);
    }

    /**
     * Maneja cuando se elimina un item
     */
    handleItemRemoved(item) {
        this.notificationService.info(`${item.name} eliminado del carrito`);
    }

    /**
     * Formatea precios para mostrar
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-AR').format(price);
    }
}

// ✅ Auto-inicialización SOLO para carrito.html
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la página del carrito
    if (document.body.classList.contains('page--carrito')) {
        console.log('🛒 Inicializando CartController para carrito.html');
        new CartController();
    }
});
