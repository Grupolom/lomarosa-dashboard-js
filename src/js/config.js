/**
 * Archivo de Configuración - Dashboard Inventario Lomarosa
 * Réplica exacta del config.py de Python
 */

export const CONFIG = {
    // ====== CONFIGURACIÓN DE EXCEL ======
    SHEET_NAME: "CONSOLIDADO",
    CONSOLIDADO_SHEET: "Sheet1",
    HEADER_ROW: 9, // Fila 10 en Excel (índice base 0)

    // ====== COLUMNAS EXACTAS DEL INVENTARIO (CONSOLIDADO sheet) ======
    COLUMNS: {
        CODIGO: "Codigo",        // Sin tilde
        PRODUCTO: "Productos",   // Con 's' al final
        TOTAL: "Total",
        UNIDAD: "U/m",
        COMENTARIOS: "Comentarios"
    },

    // ====== COLUMNAS DEL HISTÓRICO (Sheet1) ======
    COLUMNS_CONSOLIDADO: {
        DOC: "Doc",
        LOCAL: "Local",
        FECHA: "Fecha",
        COD: "Cod",
        KG_VENDIDOS: "Kg totales2",
        MACROPIEZA: "Macropieza"
    },

    // ====== FILTROS PARA PROCESAR VENTAS ======
    FILTRO_DOC_TIPO: "VENTA",
    FILTRO_LOCAL: "PLANTA GALAN",

    // ====== CONFIGURACIÓN DE ANÁLISIS ======
    STOCK_CRITICO: 50,
    STOCK_BAJO: 100,

    // ====== CONFIGURACIÓN VISUAL ======
    COLORS: {
        PRIMARY: "#1f77b4",
        SUCCESS: "#2ca02c",
        WARNING: "#ff7f0e",
        DANGER: "#d62728",
        INFO: "#17becf",

        // Colores específicos del dashboard
        TITLE: "#2C3E50",
        TOTAL: "#3498DB",
        GOOD: "#2ECC71",
        BAD: "#E74C3C",
        KG: "#F1C40F",

        // Gráficos
        SOBRESTOCK: "#E74C3C",
        STOCK_NORMAL: "#2ECC71",
        DEFICIT: "#3498DB",
        TEXT: "#2C3E50",
        BACKGROUND: "#ECF0F1"
    },

    // ====== TEXTOS ======
    DASHBOARD_TITLE: "Dashboard de Inventario - Lomarosa",
    COMPANY_NAME: "Inversiones Agropecuarias Lom SAS",

    // ====== INDEXEDDB ======
    DB_NAME: "LomarosaInventarioDB",
    DB_VERSION: 1,
    STORE_INVENTARIO: "inventario",
    STORE_CONSOLIDADO: "consolidado",
    STORE_PROCESSED: "processed_data",
    STORE_METADATA: "metadata"
};

/**
 * Categorías de productos
 */
export const CATEGORIAS_PRODUCTOS = {
    CHULETA: "Chuletas",
    COSTILLA: "Costillas",
    CANASTO: "Canastos",
    MERMA: "Mermas",
    SILLA: "Sillas",
    SPARRY: "Sparry",
    MATAMBRITO: "Matambrito",
    COSTIPIEL: "Costipiel",
    OTROS: "Otros"
};

/**
 * Categorías de stock
 */
export const CATEGORIAS_STOCK = {
    SIN_STOCK: "Sin Stock",
    CRITICO: "Crítico",
    BAJO: "Bajo",
    NORMAL: "Normal"
};

/**
 * Estados de inventario
 */
export const ESTADOS_INVENTARIO = {
    STOCK_ADECUADO: "Stock Adecuado",
    BAJO_PROMEDIO: "Bajo Promedio"
};

/**
 * Códigos especiales de semanas de stock
 */
export const SEMANAS_STOCK_CODES = {
    ERROR: -999,      // Stock negativo (error)
    AGOTADO: -1,      // Stock = 0
    SIN_DATOS: -2     // Promedio = 0 o null
};

export default CONFIG;
