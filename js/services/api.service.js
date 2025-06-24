/**
 * Servicio para manejar peticiones a la API
 * @module services/api.service
 */

/**
 * Configuración de la API
 */
const API_CONFIG = {
  baseURL: '../api',
  endpoints: {
    products: '/products.json',
    seeds: '/seeds.json'
  },
  timeout: 10000 // 10 segundos
};

/**
 * Realiza una petición HTTP con timeout
 * @param {string} url - URL a consultar
 * @param {number} timeout - Tiempo límite en milisegundos
 * @returns {Promise<Response>} Respuesta de la petición
 */
async function fetchWithTimeout(url, timeout = API_CONFIG.timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado');
    }
    throw error;
  }
}

/**
 * Obtiene datos de un archivo JSON
 * @param {string} endpoint - Endpoint relativo
 * @returns {Promise<Array>} Datos obtenidos
 * @throws {Error} Si falla la petición
 */
async function fetchData(endpoint) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  
  try {
    console.log(`🔄 Cargando datos desde: ${url}`);
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('⚠️ Los datos no son un array, convirtiendo...');
      return [];
    }
    
    console.log(`✅ Datos cargados correctamente: ${data.length} elementos`);
    return data;
    
  } catch (error) {
    console.error(`❌ Error al cargar datos desde ${url}:`, error);
    
    // Proporcionar datos de fallback si está disponible
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.log('🔄 Intentando cargar datos de fallback...');
      return getFallbackData(endpoint);
    }
    
    throw new Error(`No se pudieron cargar los datos: ${error.message}`);
  }
}

/**
 * Proporciona datos de fallback en caso de error
 * @param {string} endpoint - Endpoint que falló
 * @returns {Array} Datos de fallback
 */
function getFallbackData(endpoint) {
  const fallbackData = {
    '/products.json': [],
    '/seeds.json': []
  };
  
  return fallbackData[endpoint] || [];
}

/**
 * Obtiene los productos de la tienda
 * @returns {Promise<Array>} Lista de productos
 */
export async function loadProducts() {
  try {
    return await fetchData(API_CONFIG.endpoints.products);
  } catch (error) {
    console.error('Error específico cargando productos:', error);
    throw error;
  }
}

/**
 * Obtiene las semillas de la tienda
 * @returns {Promise<Array>} Lista de semillas
 */
export async function loadSeeds() {
  try {
    return await fetchData(API_CONFIG.endpoints.seeds);
  } catch (error) {
    console.error('Error específico cargando semillas:', error);
    throw error;
  }
}

/**
 * Obtiene un producto específico por ID
 * @param {string} id - ID del producto
 * @param {string} type - Tipo de producto ('product' o 'seed')
 * @returns {Promise<Object|null>} Producto encontrado o null
 */
export async function getProductById(id, type = 'product') {
  try {
    const data = type === 'seed' ? await loadSeeds() : await loadProducts();
    return data.find(item => item.id === id) || null;
  } catch (error) {
    console.error(`Error al buscar ${type} con ID ${id}:`, error);
    return null;
  }
}

/**
 * Filtra productos según los criterios especificados
 * @param {Array} products - Lista de productos a filtrar
 * @param {Object} filters - Objeto con los filtros a aplicar
 * @returns {Array} Productos filtrados
 */
export function filterProducts(products, filters = {}) {
  if (!Array.isArray(products)) {
    console.warn('filterProducts: products no es un array');
    return [];
  }
  
  return products.filter(product => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'todos' || value === '') return true;
      
      switch (key) {
        case 'searchTerm':
          return matchesSearchTerm(product, value);
        case 'categoria':
          return product.categoria === value;
        case 'price':
          return matchesPriceRange(product.precio, value);
        case 'tipo':
          return product.tipoFloracion?.toLowerCase().includes(value.toLowerCase());
        case 'thc':
          return matchesThcLevel(product.thc, value);
        case 'genetics':
          return product.tipoGenetico?.toLowerCase().includes(value.toLowerCase());
        default:
          return true;
      }
    });
  });
}

/**
 * Verifica si un producto coincide con el término de búsqueda
 * @param {Object} product - Producto a verificar
 * @param {string} searchTerm - Término de búsqueda
 * @returns {boolean} True si coincide
 */
function matchesSearchTerm(product, searchTerm) {
  const term = searchTerm.toLowerCase();
  const searchableFields = [
    product.nombre,
    product.descripcion,
    product.categoria,
    product.banco,
    product.tipoGenetico,
    ...(product.efectos || []),
    ...(product.sabores || [])
  ];
  
  return searchableFields.some(field => 
    field && field.toString().toLowerCase().includes(term)
  );
}

/**
 * Verifica si el precio está en el rango especificado
 * @param {number} precio - Precio del producto
 * @param {string} range - Rango de precios
 * @returns {boolean} True si está en el rango
 */
function matchesPriceRange(precio, range) {
  if (!range || range === 'todos') return true;
  
  const [min, max] = range.split('-').map(Number);
  
  if (max) {
    return precio >= min && precio <= max;
  } else {
    return precio >= min;
  }
}

/**
 * Verifica si el nivel de THC está en el rango especificado
 * @param {string|number} thc - Nivel de THC
 * @param {string} level - Nivel esperado
 * @returns {boolean} True si coincide
 */
function matchesThcLevel(thc, level) {
  if (!thc || !level) return true;
  
  const thcNum = parseFloat(thc);
  
  switch (level) {
    case 'bajo':
      return thcNum < 10;
    case 'medio':
      return thcNum >= 10 && thcNum <= 20;
    case 'alto':
      return thcNum > 20;
    default:
      return true;
  }
}

/**
 * Ordena productos según el criterio especificado
 * @param {Array} products - Lista de productos a ordenar
 * @param {string} sortBy - Criterio de ordenación
 * @returns {Array} Productos ordenados
 */
export function sortProducts(products, sortBy = 'nombre') {
  if (!Array.isArray(products)) {
    console.warn('sortProducts: products no es un array');
    return [];
  }
  
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'precio-asc':
        return (a.precio || 0) - (b.precio || 0);
      case 'precio-desc':
        return (b.precio || 0) - (a.precio || 0);
      case 'nombre-desc':
        return (b.nombre || '').localeCompare(a.nombre || '');
      case 'thc-desc':
        return parseFloat(b.thc || 0) - parseFloat(a.thc || 0);
      case 'relevancia':
        return 0; // Mantener orden original
      case 'nombre':
      default:
        return (a.nombre || '').localeCompare(b.nombre || '');
    }
  });
}

/**
 * Agrupa productos por categoría
 * @param {Array} products - Lista de productos
 * @returns {Object} Productos agrupados por categoría
 */
export function groupProductsByCategory(products) {
  if (!Array.isArray(products)) return {};
  
  return products.reduce((groups, product) => {
    const category = product.categoria || 'Sin categoría';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});
}

/**
 * Obtiene estadísticas de los productos
 * @param {Array} products - Lista de productos
 * @returns {Object} Estadísticas
 */
export function getProductStats(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      total: 0,
      categories: {},
      priceRange: { min: 0, max: 0, avg: 0 }
    };
  }
  
  const prices = products.map(p => p.precio || 0).filter(p => p > 0);
  const categories = groupProductsByCategory(products);
  
  return {
    total: products.length,
    categories: Object.keys(categories).reduce((acc, cat) => {
      acc[cat] = categories[cat].length;
      return acc;
    }, {}),
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
    }
  };
}
