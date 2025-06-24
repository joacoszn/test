/**
 * SEEDS PAGE CONTROLLER - Patrón MVC
 * Gestiona la funcionalidad de la página de semillas
 * @author THC Growshop
 * @version 2.0.0
 */

class SeedsController {
    constructor() {
        this.cartService = window.CartService;
        this.notificationService = window.NotificationService;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.allSeeds = [];
        this.filteredSeeds = [];
        this.DOM = this.cacheDOMElements();
        this.filters = {
            search: '',
            type: '',
            genetics: '',
            thc: ''
        };
        
        this.init();
    }

    /**
     * Cache de elementos DOM
     */
    cacheDOMElements() {
        return {
            seedsGrid: document.getElementById('seeds-grid'),
            searchInput: document.getElementById('search'),
            typeFilter: document.getElementById('type-filter'),
            geneticsFilter: document.getElementById('genetics-filter'),
            thcFilter: document.getElementById('thc-filter'),
            paginationContainer: document.getElementById('pagination-container'),
            paginationPages: document.getElementById('pagination-pages'),
            prevPageBtn: document.getElementById('prev-page'),
            nextPageBtn: document.getElementById('next-page')
        };
    }

    /**
     * Inicialización
     */
    async init() {
        try {
            await this.loadSeeds();
            this.bindEvents();
            this.applyFilters();
            this.updateCartCount();
        } catch (error) {
            console.error('Error initializing seeds page:', error);
            this.showError('Error al cargar las semillas');
        }
    }

    /**
     * Carga los datos de semillas
     */
    async loadSeeds() {
        try {
            const response = await fetch('data/seeds.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.allSeeds = await response.json();
            this.filteredSeeds = [...this.allSeeds];
        } catch (error) {
            console.error('Error loading seeds:', error);
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
        
        this.DOM.typeFilter?.addEventListener('change', (e) => this.handleFilterChange('type', e.target.value));
        this.DOM.geneticsFilter?.addEventListener('change', (e) => this.handleFilterChange('genetics', e.target.value));
        this.DOM.thcFilter?.addEventListener('change', (e) => this.handleFilterChange('thc', e.target.value));

        // Paginación
        this.DOM.prevPageBtn?.addEventListener('click', (e) => this.handlePrevPage(e));
        this.DOM.nextPageBtn?.addEventListener('click', (e) => this.handleNextPage(e));

        // Delegación de eventos para botones de productos
        this.DOM.seedsGrid?.addEventListener('click', (e) => this.handleProductAction(e));

        // Eventos del carrito
        document.addEventListener('cart:updated', () => this.updateCartCount());
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
     * Aplica filtros a las semillas
     */
    applyFilters() {
        this.filteredSeeds = this.allSeeds.filter(seed => {
            // Filtro de búsqueda
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesSearch = 
                    seed.nombre.toLowerCase().includes(searchTerm) ||
                    seed.descripcion.toLowerCase().includes(searchTerm) ||
                    seed.banco.toLowerCase().includes(searchTerm) ||
                    seed.efectos.some(efecto => efecto.toLowerCase().includes(searchTerm)) ||
                    seed.sabores.some(sabor => sabor.toLowerCase().includes(searchTerm));
                
                if (!matchesSearch) return false;
            }

            // Filtro por tipo
            if (this.filters.type) {
                if (this.filters.type === 'cbd' && seed.cbd < 5) return false;
                if (this.filters.type !== 'cbd' && seed.tipo !== this.filters.type) return false;
            }

            // Filtro por genética
            if (this.filters.genetics && seed.genetica !== this.filters.genetics) {
                return false;
            }

            // Filtro por THC
            if (this.filters.thc) {
                const thcLevel = seed.thc;
                switch (this.filters.thc) {
                    case 'bajo':
                        if (thcLevel >= 10) return false;
                        break;
                    case 'medio':
                        if (thcLevel < 10 || thcLevel > 20) return false;
                        break;
                    case 'alto':
                        if (thcLevel <= 20) return false;
                        break;
                }
            }

            return true;
        });

        this.renderSeeds();
        this.renderPagination();
    }

    /**
     * Renderiza las semillas
     */
    renderSeeds() {
        if (!this.DOM.seedsGrid) return;

        if (this.filteredSeeds.length === 0) {
            this.renderNoResults();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentSeeds = this.filteredSeeds.slice(startIndex, endIndex);

        const seedsHTML = currentSeeds.map(seed => this.createSeedHTML(seed)).join('');
        this.DOM.seedsGrid.innerHTML = seedsHTML;

        // Scroll to top after filter change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Crea HTML para una semilla
     */
    createSeedHTML(seed) {
        const isInCart = this.cartService.hasItem(seed.id);
        const isAvailable = seed.disponible;
        const hasDiscount = seed.precioOriginal && seed.precioOriginal > seed.precio;

        return `
            <article class="seed-card ${!isAvailable ? 'seed-card--unavailable' : ''}" data-seed-id="${seed.id}">
                <div class="seed-card__image-container">
                    <img src="${seed.imagen}" 
                         alt="${seed.nombre}" 
                         class="seed-card__image" 
                         loading="lazy"
                         onerror="this.src='imagenes/Logo.png'">
                    
                    <div class="seed-card__badges">
                        ${seed.destacado ? '<span class="seed-card__badge seed-card__badge--featured">Destacado</span>' : ''}
                        ${hasDiscount ? '<span class="seed-card__badge seed-card__badge--sale">Oferta</span>' : ''}
                        ${!isAvailable ? '<span class="seed-card__badge seed-card__badge--unavailable">Agotado</span>' : ''}
                    </div>

                    <div class="seed-card__genetics-badge seed-card__genetics-badge--${seed.genetica}">
                        ${this.formatGenetics(seed.genetica)}
                    </div>
                </div>

                <div class="seed-card__content">
                    <div class="seed-card__header">
                        <span class="seed-card__bank">${seed.banco}</span>
                        <div class="seed-card__rating">
                            ${this.renderStars(seed.calificacion)}
                            <span class="seed-card__reviews">(${seed.reviews})</span>
                        </div>
                    </div>

                    <h3 class="seed-card__title">${seed.nombre}</h3>
                    <p class="seed-card__description">${seed.descripcion}</p>

                    <div class="seed-card__specs">
                        <div class="seed-card__spec">
                            <span class="seed-card__spec-label">THC:</span>
                            <span class="seed-card__spec-value">${seed.thc}%</span>
                        </div>
                        <div class="seed-card__spec">
                            <span class="seed-card__spec-label">CBD:</span>
                            <span class="seed-card__spec-value">${seed.cbd}%</span>
                        </div>
                        <div class="seed-card__spec">
                            <span class="seed-card__spec-label">Floración:</span>
                            <span class="seed-card__spec-value">${seed.tiempoFloracion}</span>
                        </div>
                    </div>

                    <div class="seed-card__effects">
                        ${seed.efectos.slice(0, 3).map(efecto => 
                            `<span class="seed-card__effect">${efecto}</span>`
                        ).join('')}
                    </div>

                    <div class="seed-card__footer">
                        <div class="seed-card__pricing">
                            <span class="seed-card__price">$${this.formatPrice(seed.precio)}</span>
                            ${hasDiscount ? 
                                `<span class="seed-card__original-price">$${this.formatPrice(seed.precioOriginal)}</span>` : 
                                ''}
                        </div>

                        <div class="seed-card__actions">
                            <button class="seed-card__action-btn seed-card__action-btn--wishlist" 
                                    data-action="wishlist" 
                                    data-seed-id="${seed.id}"
                                    aria-label="Agregar a favoritos">
                                <i class="far fa-heart"></i>
                            </button>

                            <button class="seed-card__action-btn seed-card__action-btn--info" 
                                    data-action="info" 
                                    data-seed-id="${seed.id}"
                                    aria-label="Ver información detallada">
                                <i class="fas fa-info-circle"></i>
                            </button>

                            <button class="seed-card__add-to-cart ${isInCart ? 'seed-card__add-to-cart--in-cart' : ''}" 
                                    data-action="add-to-cart" 
                                    data-seed-id="${seed.id}"
                                    ${!isAvailable ? 'disabled' : ''}
                                    aria-label="${isInCart ? 'Ya en el carrito' : 'Agregar al carrito'}">
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
     * Formatea la genética para mostrar
     */
    formatGenetics(genetics) {
        const geneticsMap = {
            'indica': 'Indica',
            'sativa': 'Sativa',
            'hibrida': 'Híbrida'
        };
        return geneticsMap[genetics] || genetics;
    }

    /**
     * Renderiza estrellas de calificación
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHTML = '';

        // Estrellas llenas
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }

        // Media estrella
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }

        // Estrellas vacías
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }

        return `<div class="seed-card__stars">${starsHTML}</div>`;
    }

    /**
     * Renderiza mensaje de no resultados
     */
    renderNoResults() {
        this.DOM.seedsGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results__content">
                    <i class="fas fa-seedling no-results__icon"></i>
                    <h3 class="no-results__title">No se encontraron semillas</h3>
                    <p class="no-results__message">
                        Intenta ajustar los filtros o prueba con otros términos de búsqueda.
                    </p>
                    <button class="btn btn--primary" onclick="window.seedsController.clearFilters()">
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
            type: '',
            genetics: '',
            thc: ''
        };

        // Reset form elements
        if (this.DOM.searchInput) this.DOM.searchInput.value = '';
        if (this.DOM.typeFilter) this.DOM.typeFilter.value = '';
        if (this.DOM.geneticsFilter) this.DOM.geneticsFilter.value = '';
        if (this.DOM.thcFilter) this.DOM.thcFilter.value = '';

        this.currentPage = 1;
        this.applyFilters();
    }

    /**
     * Renderiza la paginación
     */
    renderPagination() {
        if (!this.DOM.paginationContainer) return;

        const totalPages = Math.ceil(this.filteredSeeds.length / this.itemsPerPage);

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
        const totalPages = Math.ceil(this.filteredSeeds.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderSeeds();
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
        const totalPages = Math.ceil(this.filteredSeeds.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    /**
     * Maneja acciones de productos
     */
    handleProductAction(e) {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        e.preventDefault();
        
        const action = button.dataset.action;
        const seedId = button.dataset.seedId;
        const seed = this.allSeeds.find(s => s.id === seedId);

        if (!seed) return;

        switch (action) {
            case 'add-to-cart':
                this.handleAddToCart(seed, button);
                break;
            case 'wishlist':
                this.handleAddToWishlist(seed);
                break;
            case 'info':
                this.handleShowInfo(seed);
                break;
        }
    }

    /**
     * Agregar al carrito
     */
    handleAddToCart(seed, button) {
        if (!seed.disponible) {
            this.notificationService.warning('Esta semilla no está disponible');
            return;
        }

        const result = this.cartService.addItem(seed, 1);
        
        if (result.success) {
            // Actualizar botón
            button.classList.add('seed-card__add-to-cart--in-cart');
            button.innerHTML = '<i class="fas fa-check"></i><span>En Carrito</span>';
            button.setAttribute('aria-label', 'Ya en el carrito');
            
            this.notificationService.success(`${seed.nombre} agregado al carrito`);
        } else {
            this.notificationService.error(result.error || 'Error al agregar al carrito');
        }
    }

    /**
     * Agregar a wishlist
     */
    handleAddToWishlist(seed) {
        // TODO: Implementar wishlist service
        this.notificationService.info('Funcionalidad de favoritos próximamente');
    }

    /**
     * Mostrar información detallada
     */
    handleShowInfo(seed) {
        // TODO: Implementar modal con información detallada
        this.notificationService.info('Vista detallada próximamente');
    }

    /**
     * Actualiza contador del carrito
     */
    updateCartCount() {
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
        if (this.DOM.seedsGrid) {
            this.DOM.seedsGrid.innerHTML = `
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.seedsController = new SeedsController();
});
