/**
 * PRODUCTS CONTROLLER - Patrón MVC
 * Gestiona la funcionalidad de la página de productos
 * @author THC Growshop
 * @version 2.0.0
 */

class ProductsController {
    constructor() {
        // Obtener servicios con fallback
        this.cartService = window.CartService || window.cartService;
        this.notificationService = window.NotificationService || window.notificationService;
        
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.allProducts = [];
        this.filteredProducts = [];
        this.DOM = this.cacheDOMElements();
        this.filters = {
            search: '',
            category: 'todos',
            priceRange: 'todos',
            sortBy: 'relevancia'
        };
        
        // Verificar que los servicios estén disponibles
        if (!this.cartService) {
            console.error('CartService no disponible en ProductsController');
        }
        if (!this.notificationService) {
            console.error('NotificationService no disponible en ProductsController');
        }
        
        this.init();
    }

    /**
     * Cache de elementos DOM
     */
    cacheDOMElements() {
        return {
            productGrid: document.getElementById('product-grid-container'),
            searchInput: document.getElementById('search-input'),
            categoryFilter: document.getElementById('category-filter'),
            priceFilter: document.getElementById('price-filter'),
            sortByFilter: document.getElementById('sort-by'),
            paginationContainer: document.getElementById('pagination-container'),
            paginationPages: document.getElementById('pagination-pages'),
            prevPageBtn: document.getElementById('prev-page'),
            nextPageBtn: document.getElementById('next-page'),
            noResults: document.getElementById('no-results'),
            resetFiltersBtn: document.getElementById('reset-filters')
        };
    }

    /**
     * Inicialización
     */
    async init() {
        try {
            await this.loadProducts();
            this.bindEvents();
            this.applyFilters();
            this.updateCartCount();
        } catch (error) {
            console.error('Error initializing products page:', error);
            this.showError('Error al cargar los productos');
        }
    }

    /**
     * Carga los datos de productos
     */
    async loadProducts() {
        try {
            const response = await fetch('data/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.allProducts = await response.json();
            this.filteredProducts = [...this.allProducts];
        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
        }
    }

    /**
     * Vincula eventos
     */
    bindEvents() {
        // Filtros
        this.DOM.searchInput?.addEventListener('input', 
            this.debounce((e) => this.handleSearchChange(e), 300)
        );
        
        this.DOM.categoryFilter?.addEventListener('change', (e) => this.handleFilterChange('category', e.target.value));
        this.DOM.priceFilter?.addEventListener('change', (e) => this.handleFilterChange('priceRange', e.target.value));
        this.DOM.sortByFilter?.addEventListener('change', (e) => this.handleFilterChange('sortBy', e.target.value));

        // Paginación
        this.DOM.prevPageBtn?.addEventListener('click', (e) => this.handlePrevPage(e));
        this.DOM.nextPageBtn?.addEventListener('click', (e) => this.handleNextPage(e));

        // Reset filtros
        this.DOM.resetFiltersBtn?.addEventListener('click', () => this.clearFilters());

        // NO manejamos eventos de carrito aquí - el UnifiedCartController se encarga
        console.log('✅ ProductsController: Eventos vinculados (carrito manejado por UnifiedCartController)');
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Maneja cambios en la búsqueda
     */
    handleSearchChange(e) {
        this.handleFilterChange('search', e.target.value);
    }

    /**
     * Maneja cambios en filtros
     */
    handleFilterChange(filterType, value) {
        this.filters[filterType] = value;
        this.currentPage = 1;
        this.applyFilters();
    }

    /**
     * Aplica filtros a los productos
     */
    applyFilters() {
        this.filteredProducts = this.allProducts.filter(product => {
            // Filtro de búsqueda
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesSearch = 
                    product.nombre.toLowerCase().includes(searchTerm) ||
                    product.descripcion.toLowerCase().includes(searchTerm) ||
                    product.categoria.toLowerCase().includes(searchTerm);
                
                if (!matchesSearch) return false;
            }

            // Filtro por categoría
            if (this.filters.category !== 'todos' && product.categoria !== this.filters.category) {
                return false;
            }

            // Filtro por precio
            if (this.filters.priceRange !== 'todos') {
                const price = product.precio;
                switch (this.filters.priceRange) {
                    case '0-10000':
                        if (price >= 10000) return false;
                        break;
                    case '10000-20000':
                        if (price < 10000 || price >= 20000) return false;
                        break;
                    case '20000-50000':
                        if (price < 20000 || price >= 50000) return false;
                        break;
                    case '50000-100000':
                        if (price < 50000 || price >= 100000) return false;
                        break;
                    case '100000':
                        if (price < 100000) return false;
                        break;
                }
            }

            return true;
        });

        // Aplicar ordenamiento
        this.sortProducts();
        this.renderProducts();
        this.renderPagination();
    }

    /**
     * Ordena los productos
     */
    sortProducts() {
        switch (this.filters.sortBy) {
            case 'nombre':
                this.filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'nombre-desc':
                this.filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
                break;
            case 'precio-asc':
                this.filteredProducts.sort((a, b) => a.precio - b.precio);
                break;
            case 'precio-desc':
                this.filteredProducts.sort((a, b) => b.precio - a.precio);
                break;
            default:
                // Mantener orden original (relevancia)
                break;
        }
    }

    /**
     * Renderiza los productos
     */
    renderProducts() {
        if (!this.DOM.productGrid) return;

        if (this.filteredProducts.length === 0) {
            this.renderNoResults();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentProducts = this.filteredProducts.slice(startIndex, endIndex);

        const productsHTML = currentProducts.map(product => this.createProductHTML(product)).join('');
        this.DOM.productGrid.innerHTML = productsHTML;
        
        // ✅ Problema CSS resuelto - ya no necesitamos fixes temporales
        
        console.log(`✅ ${currentProducts.length} productos renderizados correctamente`);

        // Scroll to top after filter change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Crea HTML para un producto
     */
    createProductHTML(product) {
        const isInCart = this.cartService ? this.cartService.hasItem(product.id) : false;
        const hasDiscount = product.precioOriginal && product.precioOriginal > product.precio;
        const isAvailable = product.disponible !== false;

        return `
            <article class="product-card" data-product-id="${product.id}">
                <div class="product-card__image-container">
                    <img src="${product.imagen || 'imagenes/Logo.png'}" 
                         alt="${product.nombre}" 
                         class="product-card__image" 
                         loading="lazy"
                         onerror="this.src='imagenes/Logo.png'">
                    
                    <div class="product-card__badges">
                        ${product.destacado ? '<span class="product-card__badge product-card__badge--featured">Destacado</span>' : ''}
                        ${hasDiscount ? '<span class="product-card__badge product-card__badge--sale">Oferta</span>' : ''}
                        ${!isAvailable ? '<span class="product-card__badge product-card__badge--unavailable">Agotado</span>' : ''}
                    </div>
                </div>

                <div class="product-card__content">
                    <div class="product-card__header">
                        <span class="product-card__category">${product.categoriaDisplay || product.categoria || 'Producto'}</span>
                    </div>

                    <h3 class="product-card__title">${product.nombre}</h3>
                    <p class="product-card__description">${product.descripcion}</p>

                    <div class="product-card__footer">
                        <div class="product-card__pricing">
                            <span class="product-card__price">$${this.formatPrice(product.precio)}</span>
                            ${hasDiscount ? 
                                `<span class="product-card__original-price">$${this.formatPrice(product.precioOriginal)}</span>` : 
                                ''}
                        </div>

                        <div class="product-card__actions">
                            <button class="product-card__action-btn product-card__action-btn--wishlist" 
                                    data-action="wishlist" 
                                    data-product-id="${product.id}"
                                    aria-label="Agregar a favoritos">
                                <i class="far fa-heart"></i>
                            </button>

                            <button class="product-card__action-btn product-card__action-btn--info" 
                                    data-action="info" 
                                    data-product-id="${product.id}"
                                    aria-label="Ver información detallada">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                        
                        <!-- NUEVO: Selector de cantidad premium -->
                        <div class="product-card__quantity-section">
                            <div class="quantity-selector">
                                <label class="quantity-selector__label">Cantidad:</label>
                                <div class="quantity-controls">
                                    <button class="quantity-btn quantity-btn--minus" 
                                            data-action="quantity-decrease" 
                                            data-product-id="${product.id}"
                                            aria-label="Disminuir cantidad">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <input class="quantity-input" 
                                           type="number" 
                                           min="1" 
                                           max="99" 
                                           value="1" 
                                           data-product-id="${product.id}"
                                           aria-label="Cantidad del producto">
                                    <button class="quantity-btn quantity-btn--plus" 
                                            data-action="quantity-increase" 
                                            data-product-id="${product.id}"
                                            aria-label="Aumentar cantidad">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <button class="product-card__add-to-cart ${isInCart ? 'product-card__add-to-cart--in-cart' : ''}" 
                                    data-action="add-to-cart" 
                                    data-product-id="${product.id}"
                                    ${!isAvailable ? 'disabled' : ''}
                                    aria-label="${isInCart ? 'Ya en el carrito' : (isAvailable ? 'Agregar al carrito' : 'Producto no disponible')}">
                                <i class="fas ${isInCart ? 'fa-check' : 'fa-shopping-cart'}"></i>
                                <span>${isInCart ? 'En Carrito' : (isAvailable ? 'Agregar' : 'Agotado')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Renderiza mensaje de no resultados
     */
    renderNoResults() {
        this.DOM.productGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results__content">
                    <i class="fas fa-tools no-results__icon"></i>
                    <h3 class="no-results__title">No se encontraron productos</h3>
                    <p class="no-results__message">
                        Intenta ajustar los filtros o prueba con otros términos de búsqueda.
                    </p>
                    <button class="btn btn--primary" onclick="window.productsController.clearFilters()">
                        Limpiar Filtros
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Limpia todos los filtros
     */
    clearFilters() {
        this.filters = {
            search: '',
            category: 'todos',
            priceRange: 'todos',
            sortBy: 'relevancia'
        };

        // Reset form elements
        if (this.DOM.searchInput) this.DOM.searchInput.value = '';
        if (this.DOM.categoryFilter) this.DOM.categoryFilter.value = 'todos';
        if (this.DOM.priceFilter) this.DOM.priceFilter.value = 'todos';
        if (this.DOM.sortByFilter) this.DOM.sortByFilter.value = 'relevancia';

        this.currentPage = 1;
        this.applyFilters();
    }

    /**
     * Renderiza la paginación
     */
    renderPagination() {
        if (!this.DOM.paginationContainer) return;

        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);

        if (totalPages <= 1) {
            this.DOM.paginationContainer.style.display = 'none';
            return;
        }

        this.DOM.paginationContainer.style.display = 'flex';

        // Actualizar botones prev/next
        this.DOM.prevPageBtn.classList.toggle('pagination__link--disabled', this.currentPage === 1);
        this.DOM.nextPageBtn.classList.toggle('pagination__link--disabled', this.currentPage === totalPages);

        // Generar páginas
        let pagesHTML = '';
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            pagesHTML += `<a href="#" class="pagination__link" data-page="1">1</a>`;
            if (startPage > 2) {
                pagesHTML += `<span class="pagination__ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            pagesHTML += `
                <a href="#" class="pagination__link ${isActive ? 'pagination__link--active' : ''}" 
                   data-page="${i}">${i}</a>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHTML += `<span class="pagination__ellipsis">...</span>`;
            }
            pagesHTML += `<a href="#" class="pagination__link" data-page="${totalPages}">${totalPages}</a>`;
        }

        this.DOM.paginationPages.innerHTML = pagesHTML;

        // Bind page click events
        this.DOM.paginationPages.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('pagination__link') && e.target.dataset.page) {
                this.goToPage(parseInt(e.target.dataset.page));
            }
        });
    }

    /**
     * Navega a una página específica
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderProducts();
        this.renderPagination();
    }

    /**
     * Página anterior
     */
    handlePrevPage(e) {
        e.preventDefault();
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    /**
     * Página siguiente
     */
    handleNextPage(e) {
        e.preventDefault();
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    // ✅ Funciones de carrito eliminadas - ahora manejadas por UnifiedCartController

    /**
     * Actualiza contador del carrito
     */
    updateCartCount() {
        if (!this.cartService) {
            console.warn('CartService no disponible para actualizar contador');
            return;
        }
        
        const cart = this.cartService.getCart();
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(element => {
            element.textContent = cart.totalItems;
            element.style.display = cart.totalItems > 0 ? 'inline' : 'none';
        });
    }

    /**
     * Formatea precios
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-AR').format(price);
    }

    /**
     * Muestra error
     */
    showError(message) {
        if (this.DOM.productGrid) {
            this.DOM.productGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button class="btn btn--primary" onclick="location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para inicializar cuando los servicios estén listos
function initializeProductsController() {
    if (window.CartService && window.NotificationService) {
        console.log('🛒 Inicializando ProductsController con servicios disponibles');
        window.productsController = new ProductsController();
        return true;
    }
    return false;
}

// Inicializar cuando el DOM esté listo y estemos en la página de productos
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('page--productos')) {
        console.log('🔄 Intentando inicializar ProductsController...');
        
        // Intentar inicializar inmediatamente
        if (!initializeProductsController()) {
            console.log('⏳ Servicios no disponibles, esperando...');
            
            // Si no están disponibles, esperar un poco y reintentar
            const interval = setInterval(() => {
                if (initializeProductsController()) {
                    clearInterval(interval);
                }
            }, 100);
            
            // Timeout después de 5 segundos
            setTimeout(() => {
                clearInterval(interval);
                console.error('❌ Timeout: ProductsController no se pudo inicializar');
            }, 5000);
        }
    }
});
