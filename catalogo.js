// =================================================================
// ESTADO Y CONFIGURACIÓN DEL CATÁLOGO
// =================================================================

let state = {
    currentSheet: 'Indumentaria',
    subcategoria: 'TODOS',
    searchTerm: ''
};

const subcategorias = {
    "TODOS": [], "CONJUNTOS": ["CONJ", "VEST", "MONO"], "BUZOS": ["BUZO", "CANG", "SUET"], "CAMPERAS": ["CAMP", "PARK", "ROMP", "CHAQ", "CHAL", "PUFF", "ANOR", "TAPA", "CARD"], "REMERAS": ["REME", "MUSC", "CAMI", "CHOM"], "PANTALONES": ["PANT", "JEAN", "JOGG", "CARG", "BABU", "CHIN", "PALA"], "CALZAS": ["CALZ", "BIKE", "CAPR"], "SHORTS": ["BERM", "BERR", "SHOR"], "MALLAS": ["MALL", "BIKI", "ENTE", "TOAL"], "ACCESORIOS": ["GORR", "PILU", "PELU", "PIJA", "TOPJ", "TOPD", "MEDI"], "MOCHILAS": ["MOCH"]
};

// =================================================================
// SELECTORES DEL DOM (cacheados para eficiencia)
// =================================================================

const dom = {
    title: document.getElementById('title'),
    catalogoTitle: document.getElementById('catalogo-title'), // Si existe
    menuToggle: document.getElementById('menu-toggle'),
    menu: document.getElementById('menu'),
    banners: {
        minIndu: document.getElementById('banner-minorista-indumentaria'),
        minCalzado: document.getElementById('banner-minorista-calzado'),
        mayIndu: document.getElementById('banner-mayorista-indumentaria'),
        mayCalzado: document.getElementById('banner-mayorista-calzado')
    },
    categoriaSelector: document.querySelector('.categoria-selector'),
    subcategoriaSelector: document.querySelector('.subcategoria-selector'),
    subcategoriaSelect: document.getElementById('subcategoria-select'),
    subcategoriaContainer: document.querySelector('.subcategoria-selector'),
    subcategoriaContainerMovil: document.querySelector('.subcategoria-selector-movil'),
    searchInput: document.getElementById('search'),
    searchButton: document.getElementById('search-button'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    productsContainer: document.getElementById('products'),
    modal: document.getElementById('imgModal'),
    modalImg: document.querySelector("#imgModal img"),
    scrollTopBtn: document.getElementById('scrollTopBtn')
};

// =================================================================
// FUNCIONES DE RENDERIZADO Y UI
// =================================================================

function updateUI() {
    // Títulos
    dom.title.textContent = textos[tipo].tituloPagina;
    if (dom.catalogoTitle) dom.catalogoTitle.textContent = textos[tipo].titulo;

    // Banner
    Object.values(dom.banners).forEach(banner => banner.classList.add('hidden'));
    if (state.currentSheet === 'Indumentaria') {
        dom.banners[tipo === 'minorista' ? 'minIndu' : 'mayIndu'].classList.remove('hidden');
    } else if (state.currentSheet === 'Calzado') {
        dom.banners[tipo === 'minorista' ? 'minCalzado' : 'mayCalzado'].classList.remove('hidden');
    }

    // Visibilidad de subcategorías
    const showSubcats = state.currentSheet !== 'Calzado';
    if (showSubcats) {
        dom.subcategoriaContainer.style.display = ''; // Deja que el CSS controle
        dom.subcategoriaContainerMovil.style.display = ''; // Deja que el CSS controle
    } else {
        dom.subcategoriaContainer.style.display = 'none';
        dom.subcategoriaContainerMovil.style.display = 'none';
    }

    // Botones activos
    updateActiveButtons(dom.categoriaSelector, '[data-categoria]', state.currentSheet);
    updateActiveButtons(dom.subcategoriaSelector, '[data-subcat]', state.subcategoria);
    dom.subcategoriaSelect.value = state.subcategoria;

    // Cargar productos
    loadProducts();
}

function updateActiveButtons(container, selector, activeValue) {
    if (!container) return;
    container.querySelectorAll(selector).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.categoria === activeValue || btn.dataset.subcat === activeValue);
    });
}

function generateProductHTML(item) {
    const lowStockLabel = item.isLowStock ? '<div class="low-stock-label">¡Últimas unidades!</div>' : '';

    return `
        ${lowStockLabel}
        <img src="${item.imagen}" alt="${item.nombre}" loading="lazy" onerror="this.onerror=null; this.src='img/imagen-generica.png';">
        <h4>${item.nombre}</h4>
        <div class="price-container">
            <p class="price">${textos[tipo].etiquetaPrecio}: $${formatPrice(item.precio)}</p>
            <p class="promo-price">${textos[tipo].etiquetaPromo}: $${formatPrice(item.precioPromo)}</p>
        </div>
    `;
}

function formatPrice(value) {
    if (!value) return '0';
    return parseFloat(value).toLocaleString('es-AR');
}

// --- NUEVA FUNCIÓN PARA CAPITALIZAR TEXTO ---
function capitalizarPalabras(texto) {
    // Si el texto está vacío, devuelve una cadena vacía para evitar errores.
    if (!texto) return '';

    // 1. Pone todo el texto en minúsculas (ej: "campera de niño")
    return texto.toLowerCase()
        // 2. Separa el texto en un array de palabras (ej: ["campera", "de", "niño"])
        .split(' ')
        // 3. Itera sobre cada palabra y pone su primera letra en mayúscula
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        // 4. Une las palabras de nuevo en una sola cadena de texto
        .join(' '); // Resultado: "Campera De Niño"
}

function abrirModalImagen(rutaImagen) {
    dom.modalImg.src = rutaImagen;
    dom.modal.style.display = 'flex';
    dom.modal.setAttribute('aria-hidden', 'false'); // Hacemos el modal visible para lectores de pantalla
    dom.modal.focus(); // Ponemos el foco en el modal
}

function cerrarModalImagen() {
    dom.modal.style.display = 'none';
    dom.modal.setAttribute('aria-hidden', 'true'); // Lo ocultamos de nuevo
    dom.modalImg.src = ""; // Limpiamos la imagen
}

// =================================================================
// LÓGICA DE DATOS (FETCH)
// =================================================================

async function loadProducts() {
    dom.productsContainer.innerHTML = '<p class="loading">Cargando productos...</p>';
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=${state.currentSheet}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error de red o la hoja "${state.currentSheet}" no existe.`);

        const text = await response.text();
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const data = JSON.parse(jsonText);

        if (!data.table || !data.table.rows || data.table.rows.length === 0) {
            dom.productsContainer.innerHTML = '<p>No hay productos disponibles en esta categoría.</p>';
            return;
        }

        const productFragment = document.createDocumentFragment();
        let productsAdded = 0;

        data.table.rows.forEach(row => {
            if (!row || !row.c) return;

            const stockValue = row.c[6]?.v ? String(row.c[6].v).trim().toLowerCase() : "sin stock";
            
            // Lógica de stock mejorada
            if (stockValue === "sin stock") {
                return; // Si dice "sin stock", no lo mostramos y saltamos al siguiente.
            }

            const item = {
                nombre: capitalizarPalabras(row.c[1]?.v || "Sin nombre"),
                precio: tipo === 'mayorista' ? row.c[4]?.v : row.c[2]?.v,
                precioPromo: tipo === 'mayorista' ? row.c[2]?.v : row.c[3]?.v,
                imagen: row.c[5]?.v || "img/imagen-generica.png",
                stock: stockValue,
                tipoPrenda: row.c[0]?.v ? String(row.c[0].v).substring(0, 4).toUpperCase() : ""
            };

            // Verificamos si tiene stock bajo
            const stockNumerico = parseFloat(item.stock);
            item.isLowStock = !isNaN(stockNumerico) && stockNumerico <= LOW_STOCK_THRESHOLD;

            const inSearch = item.nombre.toLowerCase().includes(state.searchTerm.toLowerCase());
            const inSubcat = state.subcategoria === "TODOS" || subcategorias[state.subcategoria]?.includes(item.tipoPrenda);
            
            if (inSearch && inSubcat) {
                const productDiv = document.createElement('div');
                // Añadimos la clase 'low-stock' si corresponde
                productDiv.className = `product ${item.isLowStock ? 'low-stock' : ''}`;
                productDiv.innerHTML = generateProductHTML(item);
                productFragment.appendChild(productDiv);
                productsAdded++;
            }
        });

        dom.productsContainer.innerHTML = '';
        if (productsAdded > 0) {
            dom.productsContainer.appendChild(productFragment);
        } else {
            dom.productsContainer.innerHTML = '<p>No se encontraron productos con esos filtros.</p>';
        }

    } catch (error) {
        console.error('Error al cargar productos:', error);
        dom.productsContainer.innerHTML = `<p class="error">No se pudieron cargar los productos. Revisa la consola para más detalles.</p>`;
    }
}

// =================================================================
// MANEJADORES DE EVENTOS
// =================================================================

function setupEventListeners() {
    // Menú hamburguesa
    dom.menuToggle.addEventListener('click', () => dom.menu.classList.toggle('active'));

    // Selectores de categoría
    dom.categoriaSelector.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            state.currentSheet = e.target.dataset.categoria;
            state.subcategoria = 'TODOS';
            updateHistory();
            updateUI();
        }
    });

    // Selectores de subcategoría (botones y select)
    dom.subcategoriaSelector.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            state.subcategoria = e.target.dataset.subcat;
            updateHistory();
            updateUI();
        }
    });

    dom.subcategoriaSelect.addEventListener('change', () => {
        state.subcategoria = dom.subcategoriaSelect.value;
        updateHistory();
        updateUI();
    });

        // --- LÓGICA DE BÚSQUEDA ---
    function performSearch() {
        state.searchTerm = dom.searchInput.value;
        updateHistory();
        loadProducts(); // No recarga toda la UI, solo filtra productos
    }

    dom.searchButton.addEventListener('click', performSearch);
    dom.searchInput.addEventListener('keyup', e => {
        dom.searchInput.parentElement.classList.toggle('search-has-text', dom.searchInput.value.length > 0);
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    dom.clearSearchBtn.addEventListener('click', () => {
        dom.searchInput.value = '';
        dom.searchInput.parentElement.classList.remove('search-has-text');
        performSearch();
    });
    // --- FIN DE LÓGICA DE BÚSQUEDA ---

    // Modal de imagen
    dom.productsContainer.addEventListener('click', e => {
        if (e.target.tagName === 'IMG' && e.target.closest('.product')) {
            abrirModalImagen(e.target.src);
        }
    });

    dom.modal.addEventListener('click', (e) => {
        // Cierra el modal solo si se hace clic en el fondo oscuro
        if (e.target === dom.modal) {
            cerrarModalImagen();
        }
    });
    
    // Añadimos cierre con la tecla 'Escape'
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && dom.modal.style.display === 'flex') {
            cerrarModalImagen();
        }
    });


    // Botón de subir
    window.addEventListener('scroll', () => {
        const show = window.scrollY > 500;
        dom.scrollTopBtn.style.display = show ? 'flex' : 'none';
    });
    dom.scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Botón atrás del navegador
    window.addEventListener('popstate', () => {
        // Si el modal está abierto y el usuario navega hacia atrás, lo cerramos
        if (dom.modal.style.display === 'flex') {
            cerrarModalImagen();
        } else {
            initStateFromURL();
            updateUI();
        }
    });
}

// =================================================================
// INICIALIZACIÓN
// =================================================================

function updateHistory() {
    const params = new URLSearchParams();
    params.set('tipo', tipo);
    params.set('cat', state.currentSheet);
    params.set('subcat', state.subcategoria);
    if (state.searchTerm) params.set('search', state.searchTerm);
    history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
}

function initStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    state.currentSheet = params.get('cat') || 'Indumentaria';
    state.subcategoria = params.get('subcat') || 'TODOS';
    state.searchTerm = params.get('search') || '';
    dom.searchInput.value = state.searchTerm;
}

// Arranca todo
document.addEventListener('DOMContentLoaded', () => {
    initStateFromURL();
    setupEventListeners();
    updateUI();
});