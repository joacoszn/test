/**
 * APLICACIÓN PRINCIPAL THC GROWSHOP
 * Sistema modular y elegante con arquitectura MVC
 * @version 4.0.0
 * @author THC Growshop
 */

class GrowShopApp {
    constructor() {
        this.isInitialized = false;
        this.services = new Map();
        this.controllers = new Map();
        this.currentPage = this.detectCurrentPage();
        this.config = {
            theme: {
                primary: '#1a1a1a',      // Negro elegante
                secondary: '#d4af37',    // Dorado premium
                accent: '#2c2c2c',       // Gris oscuro
                success: '#27ae60',      // Verde éxito
                error: '#e74c3c',        // Rojo error
                warning: '#f39c12',      // Naranja advertencia
                info: '#3498db'          // Azul información
            },
            animations: {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }
        };
    }

    /**
     * Detecta la página actual
     */
    detectCurrentPage() {
        const body = document.body;
        if (body.classList.contains('page--productos')) return 'productos';
        if (body.classList.contains('page--semillas')) return 'semillas';
        if (body.classList.contains('page--carrito')) return 'carrito';
        return 'home';
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('🚀 Inicializando GrowShop App...');
            
            // 1. Aplicar tema
            this.applyTheme();
            
            // 2. Inicializar servicios core
            await this.initializeServices();
            
            // 3. Inicializar controladores
            this.initializeControllers();
            
            // 4. Inicializar componentes base
            this.initializeBaseComponents();
            
            // 5. Inicializar página específica
            await this.initializePage();
            
            this.isInitialized = true;
            console.log('✅ GrowShop App inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Aplica el tema visual
     */
    applyTheme() {
        const root = document.documentElement;
        Object.entries(this.config.theme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
        document.body.classList.add('theme-premium');
    }

    /**
     * Inicializa todos los servicios
     */
    async initializeServices() {
        // CartService ya está disponible globalmente
        if (window.CartService) {
            this.services.set('cart', window.CartService);
        }
        
        // NotificationService ya está disponible globalmente
        if (window.NotificationService) {
            this.services.set('notification', window.NotificationService);
        }
        
        console.log('✅ Servicios inicializados');
    }

    /**
     * Inicializa controladores
     */
    initializeControllers() {
        // ⚠️ CartController desactivado - ahora se usa UnifiedCartController
        // El UnifiedCartController se inicializa automáticamente
        console.log('✅ Controladores inicializados (CartController delegado a UnifiedCartController)');
    }

    /**
     * Inicializa componentes base
     */
    initializeBaseComponents() {
        this.initializeMobileMenu();
        this.initializeSearch();
        this.initializeBackToTop();
        this.updateCurrentYear();
    }

    /**
     * Inicializa página específica
     */
    async initializePage() {
        switch (this.currentPage) {
            case 'productos':
                await this.initializeProductsPage();
                break;
            case 'semillas':
                await this.initializeSeedsPage();
                break;
            case 'carrito':
                this.initializeCartPage();
                break;
            case 'home':
                this.initializeHomePage();
                break;
        }
    }

    /**
     * Inicializa página de productos
     */
    async initializeProductsPage() {
        try {
            const response = await fetch('./data/products.json');
            const products = await response.json();
            
            if (window.ProductsController) {
                const controller = new window.ProductsController(products);
                this.controllers.set('products', controller);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    }

    /**
     * Inicializa página de semillas
     */
    async initializeSeedsPage() {
        try {
            const response = await fetch('./data/seeds.json');
            const seeds = await response.json();
            
            if (window.SeedsController) {
                const controller = new window.SeedsController(seeds);
                this.controllers.set('seeds', controller);
            }
        } catch (error) {
            console.error('Error cargando semillas:', error);
        }
    }

    /**
     * Inicializa página del carrito
     */
    initializeCartPage() {
        // El CartController ya maneja esta página
        console.log('✅ Página de carrito inicializada');
    }

    /**
     * Inicializa página de inicio
     */
    initializeHomePage() {
        console.log('✅ Página de inicio inicializada');
    }

    /**
     * Menú móvil
     */
    initializeMobileMenu() {
        const toggle = document.querySelector('[data-mobile-menu-toggle]');
        const menu = document.querySelector('[data-mobile-menu]');
        
        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', () => {
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            menu.setAttribute('data-mobile-menu', !isExpanded);
            document.body.classList.toggle('menu-open', !isExpanded);
        });
    }

    /**
     * Búsqueda
     */
    initializeSearch() {
        const searchToggle = document.querySelector('.header__search-toggle');
        const searchForm = document.querySelector('.header__search');
        
        if (!searchToggle || !searchForm) return;
        
        searchToggle.addEventListener('click', (e) => {
            e.preventDefault();
            searchForm.classList.toggle('visible');
        });
    }

    /**
     * Botón volver arriba
     */
    initializeBackToTop() {
        const backToTop = document.querySelector('.back-to-top');
        if (!backToTop) return;
        
        window.addEventListener('scroll', () => {
            const shouldShow = window.pageYOffset > 300;
            backToTop.classList.toggle('visible', shouldShow);
        });
        
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * Actualiza año actual
     */
    updateCurrentYear() {
        const yearElements = document.querySelectorAll('#currentYear');
        const currentYear = new Date().getFullYear();
        yearElements.forEach(el => el.textContent = currentYear);
    }

    /**
     * Maneja errores de inicialización
     */
    handleInitError(error) {
        if (this.services.get('notification')) {
            this.services.get('notification').error('Error al cargar la aplicación');
        } else {
            alert('Error al cargar la aplicación. Por favor, recarga la página.');
        }
    }

    /**
     * Obtiene un servicio
     */
    getService(name) {
        return this.services.get(name);
    }

    /**
     * Obtiene un controlador
     */
    getController(name) {
        return this.controllers.get(name);
    }
}

// Hacer disponible globalmente
window.GrowShopApp = GrowShopApp;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new GrowShopApp();
        window.app.init();
    });
} else {
    window.app = new GrowShopApp();
    window.app.init();
}
