/*
==================================================
ARCHIVO: js/page-manager.js (UNIFIED PAGE MANAGER)
==================================================
OBJETIVO:
Este script maneja la lógica para las páginas de 'productos' y 'semillas',
eliminando la duplicación de código. Detecta en qué página se encuentra
y carga la configuración, los datos y los filtros correspondientes.
*/

// URLs de los archivos de datos
const DATA_URLS = {
    productos: 'data/products.json',
    semillas: 'data/seeds.json'
};

// Función para cargar datos desde un archivo JSON
async function loadData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error al cargar los datos: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        // Mostrar mensaje de error en la interfaz
        const container = document.getElementById('product-grid-container') || document.getElementById('main-content');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Error al cargar los productos</h3>
                    <p>No se pudieron cargar los productos. Por favor, intente recargar la página.</p>
                    <button onclick="window.location.reload()" class="btn btn--primary">Reintentar</button>
                </div>
            `;
        }
        return [];
    }
}

// CONFIGURACIÓN PARA CADA PÁGINA
const pageConfig = {
    productos: {
        ModelClass: Producto,
        rawData: rawProducts,
        containerId: 'product-grid-container',
        noResultsMessage: 'No se encontraron equipamientos que coincidan con tu búsqueda.',
        initialFilters: { searchTerm: '', categoria: 'todos', price: 'todos', sort: 'nombre' },
        filterSelectors: {
            searchTerm: '#search-input-productos',
            categoria: '#categoryFilter',
            price: '#priceFilter',
            sort: '#sortFilter'
        }
    },
    semillas: {
        ModelClass: Semilla,
        rawData: rawSeedProducts,
        containerId: 'seed-grid-container',
        noResultsMessage: 'No se encontraron semillas que coincidan con tu búsqueda.',
        initialFilters: { searchTerm: '', type: 'todos', thc: 'todos', price: 'todos', bank: 'todos', sort: 'nombre'},
        filterSelectors: {
            searchTerm: '#search-input-semillas',
            type: '#typeFilter',
            thc: '#thcFilter',
            price: '#priceFilter',
            bank: '#bankFilter',
            sort: '#sortFilter'
        }
    }
};

// Inicialización de la página
document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page;
    const config = pageConfig[page];

    if (!config) {
        console.error('Configuración no encontrada para la página:', page);
        return;
    }
    
    // Cargar datos desde el archivo JSON correspondiente
    const rawData = await loadData(DATA_URLS[page]);
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.error('No se pudieron cargar los datos o el archivo está vacío');
        return;
    }

    const state = { filters: { ...config.initialFilters } };
    const items = rawData.map(itemData => new config.ModelClass(itemData));
    const gridContainer = document.getElementById(config.containerId);

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const renderItems = (itemsToRender) => {
        if (!gridContainer) return;
        if (itemsToRender.length === 0) {
            gridContainer.innerHTML = `<p class="no-results">${config.noResultsMessage}</p>`;
            return;
        }
        gridContainer.innerHTML = itemsToRender.map(item => item.crearTarjeta()).join('');
    };

    const aplicarFiltrosYOrdenar = () => {
        let resultados = items.filter(item => item.coincideConFiltros(state.filters));

        switch (state.filters.sort) {
            case 'precio-asc':
                resultados.sort((a, b) => a.precio - b.precio);
                break;
            case 'precio-desc':
                resultados.sort((a, b) => b.precio - a.precio);
                break;
            case 'thc-desc': // Específico para semillas
                if (pageName === 'semillas') {
                    resultados.sort((a, b) => b.thc - a.thc);
                }
                break;
            case 'nombre':
            default:
                resultados.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
        }
        return resultados;
    };

    const actualizarVista = () => {
        const resultados = aplicarFiltrosYOrdenar();
        renderItems(resultados);
    };

    // Asignar Event Listeners de forma dinámica
    for (const [filterName, selector] of Object.entries(config.filterSelectors)) {
        const element = document.querySelector(selector);
        if (element) {
            const eventType = (element.type === 'search' || element.type === 'text') ? 'input' : 'change';
            const handler = (e) => {
                state.filters[filterName] = e.target.value;
                actualizarVista();
            };
            element.addEventListener(eventType, eventType === 'input' ? debounce(handler, 300) : handler);
        }
    }

    // Renderizado inicial
    actualizarVista();
});