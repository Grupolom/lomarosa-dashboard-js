/**
 * Data Processor - Procesamiento de datos de inventario
 * Réplica EXACTA de data_processor.py
 */

import CONFIG, { CATEGORIAS_PRODUCTOS, CATEGORIAS_STOCK, ESTADOS_INVENTARIO, SEMANAS_STOCK_CODES } from './config.js';
import {
    toNumber, normalizeString, round, sortBy, groupBy,
    parseExcelDate, dateDiffInDays, formatDate
} from './utils.js';

export class DataProcessor {
    constructor() {
        this.df = null;                    // DataFrame de inventario crudo
        this.dfProcessed = null;           // DataFrame de inventario procesado
        this.dfHistorical = null;          // DataFrame histórico de ventas
        this.promedios = null;             // Promedios semanales de ventas
        this.analisis = null;              // Análisis combinado
    }

    /**
     * Carga datos de inventario desde ArrayBuffer
     */
    loadData(arrayBuffer) {
        try {
            console.log('📂 Cargando archivo de inventario...');

            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            if (!workbook.SheetNames.includes(CONFIG.SHEET_NAME)) {
                throw new Error(`Hoja "${CONFIG.SHEET_NAME}" no encontrada`);
            }

            const sheet = workbook.Sheets[CONFIG.SHEET_NAME];

            // Leer desde fila 10 (índice 9)
            const data = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                range: CONFIG.HEADER_ROW,  // 9
                defval: null
            });

            if (data.length < 2) {
                throw new Error('No hay datos suficientes');
            }

            // Limpiar headers (quitar espacios)
            const headers = data[0].map(h => h ? h.toString().trim() : '');
            console.log('📊 Headers limpios:', headers);

            const rows = data.slice(1);
            console.log(`📊 Filas de datos: ${rows.length}`);

            // Encontrar índices de columnas EXACTAS
            const codigoIdx = headers.indexOf(CONFIG.COLUMNS.CODIGO);
            const productoIdx = headers.indexOf(CONFIG.COLUMNS.PRODUCTO);
            const totalIdx = headers.indexOf(CONFIG.COLUMNS.TOTAL);

            if (codigoIdx === -1 || productoIdx === -1 || totalIdx === -1) {
                console.error('❌ No se encontraron columnas:');
                console.log('   Codigo índice:', codigoIdx, '- Buscando:', CONFIG.COLUMNS.CODIGO);
                console.log('   Producto índice:', productoIdx, '- Buscando:', CONFIG.COLUMNS.PRODUCTO);
                console.log('   Total índice:', totalIdx, '- Buscando:', CONFIG.COLUMNS.TOTAL);
                console.log('   Headers disponibles:', headers);
                throw new Error('No se encontraron las columnas requeridas');
            }

            console.log(`   Codigo en columna: ${codigoIdx} (${headers[codigoIdx]})`);
            console.log(`   Producto en columna: ${productoIdx} (${headers[productoIdx]})`);
            console.log(`   Total en columna: ${totalIdx} (${headers[totalIdx]})`);

            // Mapear datos usando índices exactos
            this.df = rows
                .filter(row => row && row[codigoIdx] != null)
                .map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
                })
                .filter(row => {
                    // Filtrar filas completamente vacías
                    return Object.values(row).some(val => val !== null && val !== undefined && val !== '');
                });

            console.log(`✅ Inventario cargado: ${this.df.length} productos`);
            console.log(`   Ejemplo:`, this.df[0]);

            return true;

        } catch (error) {
            console.error('❌ Error al cargar inventario:', error);
            throw error;
        }
    }

    /**
     * Carga datos históricos de ventas desde ArrayBuffer
     */
    loadHistoricalData(arrayBuffer) {
        try {
            console.log('📊 Cargando histórico de ventas...');

            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            if (!workbook.SheetNames.includes(CONFIG.CONSOLIDADO_SHEET)) {
                throw new Error(`Hoja "${CONFIG.CONSOLIDADO_SHEET}" no encontrada`);
            }

            const sheet = workbook.Sheets[CONFIG.CONSOLIDADO_SHEET];

            // Leer todos los datos
            this.dfHistorical = XLSX.utils.sheet_to_json(sheet, { defval: null });

            console.log(`✅ Consolidado cargado: ${this.dfHistorical.length} registros`);

            return true;

        } catch (error) {
            console.error('❌ Error al cargar consolidado:', error);
            return false;
        }
    }

    /**
     * Limpia y prepara los datos de inventario
     */
    cleanData() {
        if (!this.df || this.df.length === 0) {
            console.error('❌ No hay datos cargados');
            return false;
        }

        try {
            console.log('🧹 Limpiando datos de inventario...');

            // Usar columnas EXACTAS del CONFIG
            const codigoCol = CONFIG.COLUMNS.CODIGO;      // "Codigo"
            const productoCol = CONFIG.COLUMNS.PRODUCTO;  // "Productos"
            const totalCol = CONFIG.COLUMNS.TOTAL;        // "Total"

            console.log(`📌 Usando columnas:`);
            console.log(`   - Código: "${codigoCol}"`);
            console.log(`   - Producto: "${productoCol}"`);
            console.log(`   - Total: "${totalCol}"`);

            // Procesar datos
            let processed = this.df.map(row => {
                // Convertir Total a numérico
                const total = toNumber(row[totalCol]);

                // Normalizar código
                let codigo = toNumber(row[codigoCol]);

                if (codigo === null || total === null || total <= 0) {
                    return null;
                }

                return {
                    Codigo: Math.floor(codigo).toString(),
                    Producto: row[productoCol] ? row[productoCol].toString().trim() : '',
                    Stock_Actual: total,
                    categoria_stock: this._categorizarStock(total),
                    categoria_producto: this._categorizarProducto(row[productoCol] || ''),
                    disponible: total > 0
                };
            }).filter(row => row !== null && row.Codigo && row.Producto);

            this.dfProcessed = processed;

            console.log(`✅ Datos limpiados: ${this.dfProcessed.length} productos procesados`);

            return true;

        } catch (error) {
            console.error('❌ Error al limpiar datos:', error);
            return false;
        }
    }

    /**
     * Procesa datos históricos de ventas
     */
    processHistoricalSales() {
        if (!this.dfHistorical || this.dfHistorical.length === 0) {
            console.warn('⚠️ No hay datos históricos para procesar');
            return false;
        }

        try {
            console.log('🔄 Procesando ventas históricas...');

            // Usar columnas EXACTAS del CONFIG.COLUMNS_CONSOLIDADO
            const colDoc = CONFIG.COLUMNS_CONSOLIDADO.DOC;              // "Doc"
            const colLocal = CONFIG.COLUMNS_CONSOLIDADO.LOCAL;          // "Local"
            const colCod = CONFIG.COLUMNS_CONSOLIDADO.COD;              // "Cod"
            const colKgVendidos = CONFIG.COLUMNS_CONSOLIDADO.KG_VENDIDOS; // "Kg totales2"
            const colFecha = CONFIG.COLUMNS_CONSOLIDADO.FECHA;          // "Fecha"

            // Normalizar y filtrar
            let ventas = this.dfHistorical
                .filter(row => {
                    const doc = normalizeString(row[colDoc] || '');
                    const local = normalizeString(row[colLocal] || '');
                    return doc === CONFIG.FILTRO_DOC_TIPO && local === CONFIG.FILTRO_LOCAL;
                })
                .map(row => {
                    const codigo = toNumber(row[colCod]);
                    const kgVendidos = toNumber(row[colKgVendidos]);
                    let fecha = row[colFecha];

                    // Convertir fecha
                    if (typeof fecha === 'number') {
                        fecha = parseExcelDate(fecha);
                    } else if (typeof fecha === 'string') {
                        fecha = new Date(fecha);
                    }

                    if (codigo === null || kgVendidos === null || !fecha || isNaN(fecha.getTime())) {
                        return null;
                    }

                    return {
                        Cod: Math.floor(codigo).toString(),
                        Kg_Vendidos: kgVendidos,
                        fecha: fecha
                    };
                })
                .filter(row => row !== null);

            console.log(`📌 Registros después de filtros: ${ventas.length}`);

            if (ventas.length === 0) {
                console.warn('⚠️ No hay ventas válidas después de filtrar');
                return false;
            }

            // Calcular rango de fechas
            const fechas = ventas.map(v => v.fecha);
            const fechaMin = new Date(Math.min(...fechas));
            const fechaMax = new Date(Math.max(...fechas));
            const numSemanas = dateDiffInDays(fechaMin, fechaMax) / 7;

            console.log(`📅 Período: ${formatDate(fechaMin)} a ${formatDate(fechaMax)}`);
            console.log(`📊 Total semanas: ${numSemanas.toFixed(1)}`);

            // Agrupar por código
            const grouped = groupBy(ventas, 'Cod');

            // Calcular promedios semanales
            this.promedios = Object.keys(grouped).map(cod => {
                const rows = grouped[cod];
                const totalVendido = rows.reduce((sum, r) => sum + r.Kg_Vendidos, 0);
                const numVentas = rows.length;
                const promedioSemanal = totalVendido / numSemanas;

                return {
                    Cod: cod,
                    Total_Vendido: round(totalVendido, 2),
                    Num_Ventas: numVentas,
                    Promedio_Semanal: round(promedioSemanal, 2)
                };
            });

            console.log(`✅ Promedios calculados para ${this.promedios.length} productos`);

            return true;

        } catch (error) {
            console.error('❌ Error al procesar ventas:', error);
            return false;
        }
    }

    /**
     * Une inventario actual con promedios de ventas
     */
    mergeWithHistorical() {
        if (!this.dfProcessed || this.dfProcessed.length === 0) {
            console.warn('⚠️ No hay datos de inventario procesados');
            return false;
        }

        if (!this.promedios || this.promedios.length === 0) {
            console.warn('⚠️ No hay promedios de ventas');
            return false;
        }

        try {
            console.log('🔗 Combinando inventario con ventas...');

            // Crear map de promedios por código
            const promediosMap = {};
            this.promedios.forEach(p => {
                promediosMap[p.Cod] = p;
            });

            // Crear map de Macropiezas
            const macropiezaMap = {};
            if (this.dfHistorical) {
                this.dfHistorical.forEach(row => {
                    const codigo = toNumber(row['Cod']);
                    if (codigo !== null) {
                        const codigoStr = Math.floor(codigo).toString();
                        if (row['Macropieza'] && !macropiezaMap[codigoStr]) {
                            macropiezaMap[codigoStr] = row['Macropieza'].toString().trim();
                        }
                    }
                });
            }

            // Merge
            this.analisis = this.dfProcessed.map(producto => {
                const promedio = promediosMap[producto.Codigo] || {
                    Total_Vendido: 0,
                    Num_Ventas: 0,
                    Promedio_Semanal: 0
                };

                const promedioSemanal = promedio.Promedio_Semanal;
                const stockActual = producto.Stock_Actual;

                // Calcular estado
                const estado = stockActual >= promedioSemanal
                    ? ESTADOS_INVENTARIO.STOCK_ADECUADO
                    : ESTADOS_INVENTARIO.BAJO_PROMEDIO;

                // Calcular diferencia
                const diferencia = round(stockActual - promedioSemanal, 2);

                // Calcular semanas de stock
                let semanasStock = this._calcularSemanasStock(stockActual, promedioSemanal);

                // Agregar Macropieza
                const macropieza = macropiezaMap[producto.Codigo] || 'Sin clasificar';

                return {
                    ...producto,
                    Total_Vendido: promedio.Total_Vendido,
                    Num_Ventas: promedio.Num_Ventas,
                    Promedio_Semanal: promedioSemanal,
                    Estado: estado,
                    Diferencia: diferencia,
                    Semanas_Stock: semanasStock,
                    Macropieza: macropieza
                };
            });

            console.log(`✅ Datos combinados exitosamente: ${this.analisis.length} productos`);

            // Estadísticas de Macropiezas
            const macropiezasUnicas = new Set(this.analisis.map(a => a.Macropieza));
            console.log(`✅ Macropiezas agregadas: ${macropiezasUnicas.size} categorías`);

            return true;

        } catch (error) {
            console.error('❌ Error al combinar datos:', error);
            return false;
        }
    }

    /**
     * Calcula semanas de stock con casos especiales
     */
    _calcularSemanasStock(stockActual, promedioSemanal) {
        if (stockActual < 0) {
            return SEMANAS_STOCK_CODES.ERROR;
        }
        if (stockActual === 0) {
            return SEMANAS_STOCK_CODES.AGOTADO;
        }
        if (promedioSemanal === 0 || promedioSemanal === null) {
            return SEMANAS_STOCK_CODES.SIN_DATOS;
        }
        return round(stockActual / promedioSemanal, 1);
    }

    /**
     * Categoriza el nivel de stock
     */
    _categorizarStock(cantidad) {
        if (cantidad === 0) return CATEGORIAS_STOCK.SIN_STOCK;
        if (cantidad <= CONFIG.STOCK_CRITICO) return CATEGORIAS_STOCK.CRITICO;
        if (cantidad <= CONFIG.STOCK_BAJO) return CATEGORIAS_STOCK.BAJO;
        return CATEGORIAS_STOCK.NORMAL;
    }

    /**
     * Categoriza productos por tipo
     */
    _categorizarProducto(nombre) {
        const nombreUpper = nombre.toUpperCase();

        if (nombreUpper.includes('CHULETA')) return CATEGORIAS_PRODUCTOS.CHULETA;
        if (nombreUpper.includes('COSTILLA') || nombreUpper.includes('COSTILOMO')) return CATEGORIAS_PRODUCTOS.COSTILLA;
        if (nombreUpper.includes('CANASTO')) return CATEGORIAS_PRODUCTOS.CANASTO;
        if (nombreUpper.includes('MERMA')) return CATEGORIAS_PRODUCTOS.MERMA;
        if (nombreUpper.includes('SILLA')) return CATEGORIAS_PRODUCTOS.SILLA;
        if (nombreUpper.includes('SPARRY')) return CATEGORIAS_PRODUCTOS.SPARRY;
        if (nombreUpper.includes('MATAMBRITO')) return CATEGORIAS_PRODUCTOS.MATAMBRITO;
        if (nombreUpper.includes('COSTIPIEL')) return CATEGORIAS_PRODUCTOS.COSTIPIEL;

        return CATEGORIAS_PRODUCTOS.OTROS;
    }

    /**
     * Calcula estadísticas del inventario
     */
    getStatistics() {
        if (!this.dfProcessed || this.dfProcessed.length === 0) {
            return null;
        }

        const stats = {
            total_productos: this.dfProcessed.length,
            productos_disponibles: this.dfProcessed.filter(p => p.disponible).length,
            productos_sin_stock: this.dfProcessed.filter(p => !p.disponible).length,
            porcentaje_disponibilidad: 0,
            stock_total_kilos: this.dfProcessed.reduce((sum, p) => sum + p.Stock_Actual, 0),
            productos_criticos: this.dfProcessed.filter(p => p.categoria_stock === CATEGORIAS_STOCK.CRITICO).length,
            productos_bajo_stock: this.dfProcessed.filter(p => p.categoria_stock === CATEGORIAS_STOCK.BAJO).length,
            fecha_actualizacion: new Date().toISOString()
        };

        stats.porcentaje_disponibilidad = stats.total_productos > 0
            ? round((stats.productos_disponibles / stats.total_productos) * 100, 1)
            : 0;

        if (this.analisis && this.analisis.length > 0) {
            stats.stock_adecuado = this.analisis.filter(a => a.Estado === ESTADOS_INVENTARIO.STOCK_ADECUADO).length;
            stats.bajo_promedio = this.analisis.filter(a => a.Estado === ESTADOS_INVENTARIO.BAJO_PROMEDIO).length;
            stats.productos_sin_ventas = this.analisis.filter(a => a.Num_Ventas === 0).length;
        }

        return stats;
    }

    /**
     * Obtiene productos con mayor sobrestock
     */
    getTopSobrestock(n = 10) {
        if (!this.analisis) return null;

        return sortBy(this.analisis, 'Diferencia', false)
            .filter(p => p.Diferencia > 0)
            .slice(0, n);
    }

    /**
     * Obtiene productos con mayor déficit
     */
    getTopDeficit(n = 10) {
        if (!this.analisis) return null;

        return sortBy(this.analisis, 'Diferencia', true)
            .filter(p => p.Diferencia < 0)
            .slice(0, n);
    }

    /**
     * Obtiene productos con mayor rotación
     */
    getTopRotacion(n = 10) {
        if (!this.analisis) return null;

        return sortBy(this.analisis, 'Num_Ventas', false).slice(0, n);
    }

    /**
     * Obtiene productos más críticos según ratio de cobertura
     */
    getProductosCriticosVentas(n = 5) {
        if (!this.analisis) return null;

        const criticos = this.analisis
            .filter(p => p.Promedio_Semanal > 0 && p.Stock_Actual < p.Promedio_Semanal)
            .map(p => ({
                ...p,
                Ratio_Cobertura: p.Stock_Actual / p.Promedio_Semanal
            }));

        return sortBy(criticos, 'Ratio_Cobertura', true).slice(0, n);
    }

    /**
     * Ejecuta todo el proceso completo
     */
    async process(inventarioBuffer, consolidadoBuffer) {
        console.log('\n🚀 Iniciando procesamiento de datos...\n');

        if (!this.loadData(inventarioBuffer)) {
            return false;
        }

        if (!this.cleanData()) {
            return false;
        }

        if (consolidadoBuffer) {
            if (this.loadHistoricalData(consolidadoBuffer)) {
                if (this.processHistoricalSales()) {
                    this.mergeWithHistorical();
                }
            }
        }

        console.log('\n✅ Procesamiento completado exitosamente\n');

        return true;
    }

    /**
     * Obtiene todos los datos procesados
     */
    getAllData() {
        return {
            dfProcessed: this.dfProcessed,
            analisis: this.analisis,
            statistics: this.getStatistics()
        };
    }
}

export default DataProcessor;
