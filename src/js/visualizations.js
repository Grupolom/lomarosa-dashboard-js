/**
 * Dashboard Visualizations - Generación de gráficos Plotly
 * Réplica EXACTA de visualizations.py
 */

import CONFIG, { SEMANAS_STOCK_CODES, ESTADOS_INVENTARIO } from './config.js';
import { formatNumber } from './utils.js';

export class DashboardVisualizations {
    constructor(dataProcessor) {
        this.processor = dataProcessor;
        this.stats = dataProcessor.getStatistics();
        this.analisis = dataProcessor.analisis;
        this.hasHistorical = this.analisis !== null && this.analisis.length > 0;
        this.inventarioBuffer = null;  
    }

    /**
     * Crea tarjetas de KPIs principales (4 indicadores)
     */
    createKpiCards(containerId) {
        const stats = this.stats;

        const colors = {
            title: CONFIG.COLORS.TITLE,
            total: CONFIG.COLORS.TOTAL,
            good: CONFIG.COLORS.GOOD,
            bad: CONFIG.COLORS.BAD,
            kg: CONFIG.COLORS.KG
        };

        const stockAdecuado = stats.stock_adecuado || stats.productos_disponibles;
        const bajoPromedio = stats.bajo_promedio || stats.productos_sin_stock;

        const data = [
            {
                type: 'indicator',
                mode: 'number',
                value: stats.total_productos,
                number: { font: { size: 50, color: colors.total }, valueformat: ',' },
                title: { text: '<span style="font-size:0.8em;">en inventario</span>', font: { size: 16, color: colors.title } },
                domain: { row: 0, column: 0 }
            },
            {
                type: 'indicator',
                mode: 'number',
                value: stockAdecuado,
                number: { font: { size: 50, color: colors.good }, valueformat: ',' },
                title: { text: '<span style="font-size:0.8em;">sobre el promedio</span>', font: { size: 16, color: colors.title } },
                domain: { row: 0, column: 1 }
            },
            {
                type: 'indicator',
                mode: 'number',
                value: bajoPromedio,
                number: { font: { size: 50, color: colors.bad }, valueformat: ',' },
                title: { text: '<span style="font-size:0.8em;">bajo el promedio</span>', font: { size: 16, color: colors.title } },
                domain: { row: 0, column: 2 }
            },
            {
                type: 'indicator',
                mode: 'number',
                value: stats.stock_total_kilos,
                number: { font: { size: 50, color: colors.kg }, valueformat: ',.1f' },
                title: { text: '<span style="font-size:0.8em;">kilogramos</span>', font: { size: 16, color: colors.title } },
                domain: { row: 0, column: 3 }
            }
        ];

        const layout = {
            height: 300,
            showlegend: false,
            margin: { t: 120, b: 20, l: 20, r: 20 },
            paper_bgcolor: 'white',
            plot_bgcolor: 'white',
            title: {
                text: '<b>Panel de Control de Inventario</b>',
                x: 0.5,
                y: 0.95,
                xanchor: 'center',
                yanchor: 'top',
                font: { size: 24, color: colors.title }
            },
            grid: { rows: 1, columns: 4, pattern: 'independent' }
        };

        const config = { responsive: true, displayModeBar: false };

        Plotly.newPlot(containerId, data, layout, config);
    }

    /**
     * Crea dashboard completo 2x2
     */
    createDashboardCompleto(containerId) {
        if (!this.hasHistorical) {
            document.getElementById(containerId).innerHTML = '<p style="text-align:center; color:#666; padding:30px;">No hay datos históricos disponibles</p>';
            return;
        }

        const colors = {
            sobrestock: CONFIG.COLORS.SOBRESTOCK,
            stock_normal: CONFIG.COLORS.STOCK_NORMAL,
            deficit: CONFIG.COLORS.DEFICIT,
            text: CONFIG.COLORS.TEXT
        };

        // Análisis
        const topSobrestock = this.processor.getTopSobrestock(10);
        const topFaltante = this.processor.getTopDeficit(10);
        const topRotacion = this.processor.getTopRotacion(10);

        // Preparar datos para gráficos
        const traces = [];

        // GRÁFICA 1: Sobrestock (fila 1, col 1)
        if (topSobrestock && topSobrestock.length > 0) {
            traces.push({
                name: 'Stock Actual',
                x: topSobrestock.map(p => p.Producto),
                y: topSobrestock.map(p => p.Stock_Actual),
                type: 'bar',
                marker: { color: colors.sobrestock, opacity: 0.8 },
                text: topSobrestock.map(p => `${((p.Stock_Actual / p.Promedio_Semanal - 1) * 100).toFixed(0)}%`),
                textposition: 'outside',
                xaxis: 'x',
                yaxis: 'y'
            });

            traces.push({
                name: 'Promedio Semanal',
                x: topSobrestock.map(p => p.Producto),
                y: topSobrestock.map(p => p.Promedio_Semanal),
                type: 'bar',
                marker: { color: colors.stock_normal, opacity: 0.6 },
                showlegend: true,
                xaxis: 'x',
                yaxis: 'y'
            });
        }

        // GRÁFICA 2: Faltante (fila 1, col 2)
        if (topFaltante && topFaltante.length > 0) {
            traces.push({
                name: 'Stock Actual',
                x: topFaltante.map(p => p.Producto),
                y: topFaltante.map(p => p.Stock_Actual),
                type: 'bar',
                marker: { color: colors.deficit, opacity: 0.8 },
                text: topFaltante.map(p => `${((p.Stock_Actual / p.Promedio_Semanal - 1) * 100).toFixed(0)}%`),
                textposition: 'outside',
                showlegend: false,
                xaxis: 'x2',
                yaxis: 'y2'
            });

            traces.push({
                name: 'Promedio Semanal',
                x: topFaltante.map(p => p.Producto),
                y: topFaltante.map(p => p.Promedio_Semanal),
                type: 'bar',
                marker: { color: colors.stock_normal, opacity: 0.6 },
                showlegend: false,
                xaxis: 'x2',
                yaxis: 'y2'
            });
        }

        // GRÁFICA 3: Pie Chart (fila 2, col 1)
        const bajoPromedio = this.analisis.filter(a => a.Estado === ESTADOS_INVENTARIO.BAJO_PROMEDIO).length;
        const stockAdecuado = this.analisis.filter(a => a.Estado === ESTADOS_INVENTARIO.STOCK_ADECUADO).length;

        traces.push({
            labels: ['Bajo Promedio', 'Stock Adecuado'],
            values: [bajoPromedio, stockAdecuado],
            type: 'pie',
            hole: 0.4,
            marker: { colors: [colors.sobrestock, colors.stock_normal] },
            textinfo: 'percent+label',
            textposition: 'outside',
            showlegend: false,
            domain: { row: 1, column: 0 },
            xaxis: 'x3',
            yaxis: 'y3'
        });

        // GRÁFICA 4: Top Rotación (fila 2, col 2)
        if (topRotacion && topRotacion.length > 0) {
            traces.push({
                x: topRotacion.map(p => p.Producto).slice(0, 10),
                y: topRotacion.map(p => p.Num_Ventas).slice(0, 10),
                type: 'bar',
                marker: { color: colors.stock_normal },
                name: 'Número de Ventas',
                showlegend: false,
                text: topRotacion.map(p => p.Num_Ventas).slice(0, 10),
                textposition: 'auto',
                xaxis: 'x4',
                yaxis: 'y4'
            });
        }

        const layout = {
            title: {
                text: '<b>Dashboard de Control de Inventario - Análisis por Macropiezas</b>',
                x: 0.5,
                y: 0.98,
                xanchor: 'center',
                font: { size: 22, color: colors.text }
            },
            height: 1300,  // ⬅️ AUMENTADO de 1150 a 1300
            showlegend: true,
            template: 'plotly_white',
            barmode: 'group',
            legend: {
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.02,
                xanchor: 'right',
                x: 1
            },
            font: { family: 'Arial', size: 11, color: colors.text },
            margin: { t: 120, b: 80, l: 60, r: 60 },  // ⬅️ AUMENTADO bottom margin

            // Subplots 2x2
            grid: { 
                rows: 2, 
                columns: 2, 
                pattern: 'independent',
                subplots: [['xy', 'x2y2'], ['x3y3', 'x4y4']],
                roworder: 'top to bottom'
            },

            // GRÁFICA 1: Top Sobrestock
            xaxis: { 
                title: 'Producto', 
                tickangle: 45, 
                domain: [0, 0.45] 
            },
            yaxis: { 
                title: 'Cantidad (kg)', 
                domain: [0.58, 1]  // ⬅️ CAMBIADO de [0.55, 1] a [0.58, 1]
            },

            // GRÁFICA 2: Top Faltante
            xaxis2: { 
                title: 'Producto', 
                tickangle: 45, 
                domain: [0.55, 1] 
            },
            yaxis2: { 
                title: 'Cantidad (kg)', 
                domain: [0.58, 1]  // ⬅️ CAMBIADO de [0.55, 1] a [0.58, 1]
            },

            // GRÁFICA 3: Pie Chart
            xaxis3: { domain: [0, 0.45], visible: false },
            yaxis3: { domain: [0, 0.42], visible: false },  // ⬅️ CAMBIADO de [0, 0.45]

            // GRÁFICA 4: Top Rotación
            xaxis4: { 
                title: 'Producto', 
                tickangle: 45, 
                domain: [0.55, 1] 
            },
            yaxis4: { 
                title: 'Número de Ventas', 
                domain: [0, 0.42]  // ⬅️ CAMBIADO de [0, 0.45]
            },

            // TÍTULOS ENCIMA DE CADA GRÁFICA
            annotations: [
                {
                    text: '<b>Top 10 Macropiezas con Mayor Sobrestock</b>',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.225,
                    y: 1.04,  // ⬅️ AJUSTADO de 1.02 a 1.04
                    xanchor: 'center',
                    yanchor: 'bottom',
                    showarrow: false,
                    font: { size: 14, color: colors.text }
                },
                {
                    text: '<b>Top 10 Macropiezas con Mayor Faltante</b>',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.775,
                    y: 1.04,  // ⬅️ AJUSTADO de 1.02 a 1.04
                    xanchor: 'center',
                    yanchor: 'bottom',
                    showarrow: false,
                    font: { size: 14, color: colors.text }
                },
                {
                    text: '<b>Distribución del Estado de Inventario</b>',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.225,
                    y: 0.46,  // ⬅️ AJUSTADO de 0.50 a 0.46
                    xanchor: 'center',
                    yanchor: 'bottom',
                    showarrow: false,
                    font: { size: 14, color: colors.text }
                },
                {
                    text: '<b>Productos con Mayor Rotación</b>',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.775,
                    y: 0.46,  // ⬅️ AJUSTADO de 0.50 a 0.46
                    xanchor: 'center',
                    yanchor: 'bottom',
                    showarrow: false,
                    font: { size: 14, color: colors.text }
                }
            ]
        };




        const config = { responsive: true };

        Plotly.newPlot(containerId, traces, layout, config);
    }

    /**
     * Crea HTML de alerta crítica
     */
    createAlertaCritica() {
        if (!this.hasHistorical) {
            return '<p style="text-align:center; color:#666; font-size:16px; padding:30px;">📊 No hay datos históricos para mostrar alertas</p>';
        }

        const productosBajos = this.analisis.filter(a => a.Estado === ESTADOS_INVENTARIO.BAJO_PROMEDIO).length;

        if (productosBajos === 0) {
            return `
                <div style="background-color:#d4edda; border:2px solid #28a745; border-radius:8px; padding:20px; margin:20px 0;">
                    <h3 style="color:#155724; margin:0;">✅ Estado Óptimo</h3>
                    <p style="color:#155724; margin-top:10px;">Todos los productos tienen stock adecuado respecto al promedio de ventas.</p>
                </div>
            `;
        }

        const productosCriticos = this.processor.getProductosCriticosVentas(5);

        let productosHtml = "";
        if (productosCriticos && productosCriticos.length > 0) {
            productosHtml = "<div style='margin-top:15px; padding-top:15px; border-top:1px solid #FFCDD2;'><strong>Productos más críticos:</strong><br>";
            productosCriticos.forEach(p => {
                const deficit = p.Promedio_Semanal - p.Stock_Actual;
                productosHtml += `<div style='margin:5px 0; color:#555;'>• ${p.Producto}: Stock ${p.Stock_Actual.toFixed(1)} kg vs Promedio ${p.Promedio_Semanal.toFixed(1)} kg (Déficit: ${deficit.toFixed(1)} kg)</div>`;
            });
            productosHtml += "</div>";
        }

        return `
            <div style="background-color:#FFEBEE; border:2px solid #E57373; border-radius:8px; padding:20px; margin:20px 0; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <div style="display:flex; align-items:center; margin-bottom:15px; color:#D32F2F;">
                    <span style="font-size:24px; margin-right:10px;">⚠️</span>
                    <h3 style="margin:0; font-size:20px;">Alerta Crítica</h3>
                </div>
                <p style="color:#555; font-size:16px; margin:0;">
                    Hay <strong>${productosBajos}</strong> producto(s) con stock por debajo del promedio semanal de ventas.
                </p>
                ${productosHtml}
            </div>
        `;
    }

    /**
     * Crea HTML de resumen ejecutivo
     */
    createResumenEjecutivo() {
        if (!this.hasHistorical) {
            return '<p style="text-align:center; color:#666; padding:30px;">No hay datos históricos disponibles</p>';
        }

        const stats = this.stats;
        const totalProductos = stats.total_productos;
        const productosSinVentas = stats.productos_sin_ventas || 0;
        const productosCriticos = stats.bajo_promedio || 0;

        const pctSinVentas = totalProductos > 0 ? ((productosSinVentas / totalProductos) * 100).toFixed(1) : 0;
        const pctCriticos = totalProductos > 0 ? ((productosCriticos / totalProductos) * 100).toFixed(1) : 0;

        const topDeficit = this.processor.getTopDeficit(10) || [];
        const topSobrestock = this.processor.getTopSobrestock(10) || [];
        
        // Obtener productos sin movimiento
        const productosSinMovimiento = this.analisis.filter(p => 
            p.Num_Ventas === 0 || p.Num_Ventas == null
        ).sort((a, b) => b.Stock_Actual - a.Stock_Actual);
        
        const top5SinMovimiento = productosSinMovimiento.slice(0, 5);

        // Obtener productos críticos (bajo promedio)
        const productosEstadoCritico = this.analisis.filter(p => 
            p.Estado === ESTADOS_INVENTARIO.BAJO_PROMEDIO
        ).sort((a, b) => a.Diferencia - b.Diferencia); // Ordenar por déficit (más negativo primero)
        
        const top5Criticos = productosEstadoCritico.slice(0, 5);

        const html = `
            <div style="font-family:Arial; max-width:1200px; margin:20px auto; padding:20px;">
                <h2 style="color:#2C3E50; margin-bottom:20px;">Resumen Ejecutivo de Inventario</h2>

                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:30px;">
                    <!-- Tarjeta Productos Sin Movimiento -->
                    <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <div style="color:#2C3E50; font-size:16px; margin-bottom:10px;">Productos Sin Movimiento</div>
                        <div style="font-size:24px; font-weight:bold; margin-bottom:5px; color:#F1C40F;">${productosSinVentas}</div>
                        <div style="font-size:14px; color:#666;">${pctSinVentas}% del inventario no ha tenido ventas</div>
                        ${productosSinMovimiento.length > 0 ? `
                            <div style="margin-top:10px; font-size:12px; color:#3498DB; cursor:pointer;" onclick="document.getElementById('ver-sin-movimiento').click();">
                                🔍 Click para ver detalle
                            </div>
                        ` : ''}
                    </div>

                    <!-- Tarjeta Productos Críticos -->
                    <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <div style="color:#2C3E50; font-size:16px; margin-bottom:10px;">Productos en Estado Crítico</div>
                        <div style="font-size:24px; font-weight:bold; margin-bottom:5px; color:#E74C3C;">${productosCriticos}</div>
                        <div style="font-size:14px; color:#666;">${pctCriticos}% tienen stock bajo el promedio</div>
                        ${productosEstadoCritico.length > 0 ? `
                            <div style="margin-top:10px; font-size:12px; color:#3498DB; cursor:pointer;" onclick="document.getElementById('ver-criticos').click();">
                                🔍 Click para ver detalle
                            </div>
                        ` : ''}
                    </div>

                    <!-- Tarjeta Stock Total -->
                    <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <div style="color:#2C3E50; font-size:16px; margin-bottom:10px;">Stock Total</div>
                        <div style="font-size:24px; font-weight:bold; margin-bottom:5px; color:#2ECC71;">${formatNumber(stats.stock_total_kilos, 0)} kg</div>
                        <div style="font-size:14px; color:#666;">Distribuido en ${totalProductos} productos</div>
                    </div>
                </div>

                ${productosSinMovimiento.length > 0 ? `
                <!-- Sección expandible: Productos sin movimiento -->
                <details style="background:white; border-radius:10px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); overflow:hidden;">
                    <summary id="ver-sin-movimiento" style="background: linear-gradient(135deg, #F39C12 0%, #E67E22 100%); color:white; padding:20px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; list-style:none;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:24px;">📦</span>
                            <span style="font-weight:600; font-size:18px;">Productos sin ventas registradas:</span>
                        </div>
                        <span style="font-size:20px;">▼</span>
                    </summary>
                    <div style="padding:20px; background:#FFF8E7;">
                        <p style="color:#555; margin-bottom:20px; line-height:1.6;">
                            ${pctSinVentas}% del inventario no ha tenido ventas
                        </p>
                        <div style="background:#FEF5E7; border-left:4px solid #F39C12; padding:15px; border-radius:5px;">
                            ${top5SinMovimiento.map(p => `
                                <div style="padding:8px 0; border-bottom:1px solid #FCE4BE;">
                                    <span style="font-weight:600; color:#7D5A07;">• ${p.Producto}</span> 
                                    <span style="color:#666;">(Código: ${p.Codigo})</span> 
                                    - Stock actual: <strong style="color:#F39C12;">${p.Stock_Actual.toFixed(1)} kg</strong>
                                </div>
                            `).join('')}
                            ${productosSinMovimiento.length > 5 ? `
                                <div style="margin-top:10px; padding-top:10px; border-top:2px solid #FCE4BE; color:#F39C12; font-weight:500; text-align:center;">
                                    + ${productosSinMovimiento.length - 5} productos más sin movimiento
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </details>
                ` : ''}

                ${productosEstadoCritico.length > 0 ? `
                <!-- Sección expandible: Productos críticos -->
                <details style="background:white; border-radius:10px; margin-bottom:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); overflow:hidden;">
                    <summary id="ver-criticos" style="background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%); color:white; padding:20px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; list-style:none;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:24px;">⚠️</span>
                            <span style="font-weight:600; font-size:18px;">Productos que requieren atención inmediata:</span>
                        </div>
                        <span style="font-size:20px;">▼</span>
                    </summary>
                    <div style="padding:20px; background:#FFEBEE;">
                        <p style="color:#555; margin-bottom:20px; line-height:1.6;">
                            ${pctCriticos}% del inventario tiene stock por debajo del promedio semanal de ventas
                        </p>
                        <div style="background:#FFCDD2; border-left:4px solid #E74C3C; padding:15px; border-radius:5px;">
                            ${top5Criticos.map(p => {
                                const deficit = Math.abs(p.Diferencia);
                                return `
                                <div style="padding:8px 0; border-bottom:1px solid #FFAB91;">
                                    <span style="font-weight:600; color:#B71C1C;">• ${p.Producto}</span> 
                                    <span style="color:#666;">(Código: ${p.Codigo})</span><br>
                                    <span style="color:#555; font-size:14px; margin-left:15px;">
                                        Stock: <strong style="color:#E74C3C;">${p.Stock_Actual.toFixed(1)} kg</strong> 
                                        vs Promedio: <strong>${p.Promedio_Semanal.toFixed(1)} kg</strong> 
                                        - Déficit: <strong style="color:#D32F2F;">${deficit.toFixed(1)} kg</strong>
                                    </span>
                                </div>
                            `}).join('')}
                            ${productosEstadoCritico.length > 5 ? `
                                <div style="margin-top:10px; padding-top:10px; border-top:2px solid #FFAB91; color:#E74C3C; font-weight:500; text-align:center;">
                                    + ${productosEstadoCritico.length - 5} productos más en estado crítico
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </details>
                ` : ''}

                <div style="background:#F8F9FA; border-radius:10px; padding:20px;">
                    <h3 style="color:#2C3E50; margin-bottom:15px;">💡 Recomendaciones Principales</h3>
                    <ul style="color:#555; line-height:1.8;">
                        ${productosSinMovimiento.length > 0 ? `
                            <li style="margin-bottom:10px;">
                                <strong>Productos Sin Movimiento:</strong> Evaluar estrategias para ${productosSinVentas} productos sin ventas recientes.
                            </li>
                        ` : ''}
                        ${productosEstadoCritico.length > 0 ? `
                            <li style="margin-bottom:10px;">
                                <strong>Atención Inmediata:</strong> ${productosCriticos} productos requieren reposición urgente.
                            </li>
                        ` : ''}
                        <li style="margin-bottom:10px;">
                            <strong>Sobrestock:</strong> ${topSobrestock.length} productos tienen niveles de stock significativamente altos.
                        </li>
                        <li>
                            <strong>Stock Total:</strong> ${formatNumber(stats.stock_total_kilos, 0)} kg distribuidos en ${totalProductos} productos únicos.
                        </li>
                    </ul>
                </div>
            </div>
        `;
        
        return html;
    }



    /**
     * Crea tabla HTML de productos críticos (simplificada)
     */
/**
 * Crea tabla HTML de productos críticos con filtro por Macropieza
 */
    createTablaProductosCriticos() {
        if (!this.hasHistorical) {
            return '<p style="text-align:center; color:#666; padding:30px;">No hay datos de análisis disponibles</p>';
        }

        const productosCriticos = this.analisis
            .filter(p => p.Stock_Actual < p.Promedio_Semanal && p.Promedio_Semanal > 0)
            .sort((a, b) => a.Diferencia - b.Diferencia)
            .slice(0, 10);

        if (productosCriticos.length === 0) {
            return '<p style="text-align:center; color:#2ca02c; font-size:18px; padding:40px;">✅ No hay productos críticos en este momento</p>';
        }

        // Obtener lista única de Macropiezas
        const macropiezasUnicas = [...new Set(this.analisis.map(p => p.Macropieza || 'Sin clasificar'))].sort();

        let html = `
            <div style='margin:20px 0;'>
                <!-- FILTRO POR MACROPIEZA -->
                <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <label style="font-weight: bold; color: #2C3E50;">🔍 Filtrar por Macropieza:</label>
                    
                    <div style="position: relative;">
                        <button id="macropiezaFilterBtn"
                                style="padding: 10px 15px; border: 2px solid #E74C3C; border-radius: 5px; 
                                    background: white; cursor: pointer; font-size: 14px; min-width: 200px; text-align: left;">
                            🏷️ Todas las Macropiezas ▼
                        </button>
                        
                        <!-- Dropdown del filtro -->
                        <div id="macropiezaFilterDropdown" 
                            style="display: none; position: absolute; top: 100%; left: 0; z-index: 1000; 
                                    background: white; border: 2px solid #E74C3C; border-radius: 5px; 
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 300px; max-height: 350px; 
                                    overflow-y: auto; margin-top: 5px;">
                            
                            <!-- Buscador dentro del dropdown -->
                            <div style="padding: 10px; border-bottom: 1px solid #ddd; background: #ffe6e6;">
                                <input type="text" id="macropiezaSearchFilter" placeholder="Buscar macropieza..." 
                                    style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
                            </div>
                            
                            <!-- Checkbox "Seleccionar todo" -->
                            <div style="padding: 10px; border-bottom: 1px solid #ddd; background: #fff5f5;">
                                <label style="cursor: pointer; font-weight: bold;">
                                    <input type="checkbox" id="selectAllMacropiezas" checked> 
                                    (Seleccionar todas)
                                </label>
                            </div>
                            
                            <!-- Lista de checkboxes -->
                            <div id="macropiezaCheckboxList" style="padding: 10px;">
        `;

        // Generar checkboxes de Macropiezas
        macropiezasUnicas.forEach(macropieza => {
            const safeId = macropieza.replace(/\s+/g, '_').replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
            html += `
                                <div class="macropieza-checkbox-item" style="margin-bottom: 5px;">
                                    <label style="cursor: pointer;">
                                        <input type="checkbox" class="macro-checkbox" value="${macropieza}" checked>
                                        ${macropieza}
                                    </label>
                                </div>
            `;
        });

        html += `
                            </div>
                            
                            <!-- Botones de acción -->
                            <div style="padding: 10px; border-top: 1px solid #ddd; display: flex; gap: 10px; justify-content: flex-end; background: #fff5f5;">
                                <button id="clearMacropiezaBtn"
                                        style="padding: 8px 15px; background: #95A5A6; color: white; 
                                            border: none; border-radius: 3px; cursor: pointer;">
                                    Limpiar
                                </button>
                                <button id="applyMacropiezaBtn"
                                        style="padding: 8px 15px; background: #E74C3C; color: white; 
                                            border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <span id="macropiezaFilterStatus" style="color: #666; font-size: 14px;"></span>
                </div>
                
                <!-- TABLA -->
                <div style='overflow-x:auto;'>
                    <table id="criticosTable" style='width:100%; border-collapse:collapse; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>
                        <thead>
                            <tr style='background-color:#E74C3C; color:white;'>
                                <th style='padding:12px; text-align:left; border:1px solid #ddd;'>Macropieza</th>
                                <th style='padding:12px; text-align:left; border:1px solid #ddd;'>Producto</th>
                                <th style='padding:12px; text-align:right; border:1px solid #ddd;'>Stock Actual</th>
                                <th style='padding:12px; text-align:right; border:1px solid #ddd;'>Promedio Semanal</th>
                                <th style='padding:12px; text-align:right; border:1px solid #ddd;'>Déficit</th>
                                <th style='padding:12px; text-align:right; border:1px solid #ddd;'>Num. Ventas</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        productosCriticos.forEach(p => {
            const deficit = Math.abs(p.Diferencia);
            const macropieza = p.Macropieza || 'Sin clasificar';
            html += `
                            <tr style='background-color:#ffe6e6;' class="critico-row" data-macropieza="${macropieza}">
                                <td style='padding:10px; border:1px solid #ddd; font-weight:500;'>${macropieza}</td>
                                <td style='padding:10px; border:1px solid #ddd;'>${p.Producto}</td>
                                <td style='padding:10px; text-align:right; border:1px solid #ddd; font-weight:bold;'>${p.Stock_Actual.toFixed(2)} kg</td>
                                <td style='padding:10px; text-align:right; border:1px solid #ddd;'>${p.Promedio_Semanal.toFixed(2)} kg</td>
                                <td style='padding:10px; text-align:right; border:1px solid #ddd; color:#d62728; font-weight:bold;'>${deficit.toFixed(2)} kg</td>
                                <td style='padding:10px; text-align:right; border:1px solid #ddd;'>${Math.floor(p.Num_Ventas)}</td>
                            </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 15px; text-align: center; color: #666;">
                    <span id="criticosCount">Mostrando ${productosCriticos.length} productos críticos</span>
                </div>
            </div>
        `;

        // Configurar event listeners DESPUÉS de renderizar
        setTimeout(() => {
            this._setupMacropiezaFilter();
        }, 100);

        return html;
    }

    /**
     * Configura los event listeners para el filtro de macropiezas
     */
    _setupMacropiezaFilter() {
        const button = document.getElementById('macropiezaFilterBtn');
        const dropdown = document.getElementById('macropiezaFilterDropdown');
        const searchInput = document.getElementById('macropiezaSearchFilter');
        const selectAllCheckbox = document.getElementById('selectAllMacropiezas');
        const applyBtn = document.getElementById('applyMacropiezaBtn');
        const clearBtn = document.getElementById('clearMacropiezaBtn');
        const checkboxes = document.querySelectorAll('.macro-checkbox');

        if (!button || !dropdown) return;

        // Variables para el filtro
        let allMacropiezas = Array.from(checkboxes).map(cb => cb.value);
        let selectedMacropiezas = new Set(allMacropiezas);

        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.style.display = 'none';
            }
        });

        // Prevenir que clicks dentro del dropdown lo cierren
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Buscador
        if (searchInput) {
            searchInput.addEventListener('keyup', () => {
                const searchValue = searchInput.value.toUpperCase();
                const items = document.querySelectorAll('.macropieza-checkbox-item');
                
                items.forEach(item => {
                    const text = item.textContent || item.innerText;
                    item.style.display = text.toUpperCase().includes(searchValue) ? '' : 'none';
                });
            });
        }

        // Seleccionar todas
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', () => {
                checkboxes.forEach(cb => {
                    if (cb.parentElement.parentElement.style.display !== 'none') {
                        cb.checked = selectAllCheckbox.checked;
                    }
                });
            });
        }

        // Actualizar "Seleccionar todas" cuando cambia un checkbox individual
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const allChecked = Array.from(checkboxes).every(c => c.checked);
                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = allChecked;
                }
            });
        });

        // Botón Limpiar
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                checkboxes.forEach(cb => cb.checked = true);
                if (selectAllCheckbox) selectAllCheckbox.checked = true;
                selectedMacropiezas = new Set(allMacropiezas);
                this._applyMacropiezaFilterLogic(selectedMacropiezas, allMacropiezas, button, dropdown);
            });
        }

        // Botón Aplicar
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                selectedMacropiezas.clear();
                checkboxes.forEach(cb => {
                    if (cb.checked) {
                        selectedMacropiezas.add(cb.value);
                    }
                });
                this._applyMacropiezaFilterLogic(selectedMacropiezas, allMacropiezas, button, dropdown);
            });
        }
    }

    /**
     * Lógica para aplicar el filtro de macropiezas
     */
    _applyMacropiezaFilterLogic(selectedMacropiezas, allMacropiezas, button, dropdown) {
        // Actualizar botón
        if (selectedMacropiezas.size === allMacropiezas.length) {
            button.textContent = '🏷️ Todas las Macropiezas ▼';
        } else {
            button.textContent = `🏷️ Macropiezas (${selectedMacropiezas.size}) ▼`;
        }
        
        // Filtrar tabla
        const rows = document.querySelectorAll('.critico-row');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const macropieza = row.getAttribute('data-macropieza');
            if (selectedMacropiezas.has(macropieza)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Actualizar contador
        const counter = document.getElementById('criticosCount');
        if (counter) {
            counter.textContent = `Mostrando ${visibleCount} productos críticos`;
        }
        
        // Cerrar dropdown
        dropdown.style.display = 'none';
    }


    /**
     * Crea tabla HTML de inventario completo (simplificada)
     */

    createTablaInventarioCompleto() {
        const productos = this.processor.dfProcessed;
        
        if (!productos || productos.length === 0) {
            return '<p style="text-align:center; color:#666; padding:40px;">No hay datos de inventario disponibles</p>';
        }

        let html = `
            <div style="margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="inv-sheet-btn active" data-sheet="CONSOLIDADO" style="padding: 10px 20px; border: 2px solid #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            📦 CONSOLIDADO
                        </button>
                        <button class="inv-sheet-btn" data-sheet="CAVA 1" style="padding: 10px 20px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            ❄️ CAVA 1
                        </button>
                        <button class="inv-sheet-btn" data-sheet="CAVA 2" style="padding: 10px 20px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            🧊 CAVA 2
                        </button>
                        <button class="inv-sheet-btn" data-sheet="CAVA 3" style="padding: 10px 20px; border: 2px solid #667eea; background: white; color: #667eea; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                            🌡️ CAVA 3
                        </button>
                    </div>

                    <input type="text" id="searchInventarioSimple" placeholder="🔍 Buscar producto..." 
                        style="padding: 10px; border: 2px solid #ddd; border-radius: 5px; width: 300px; font-size: 14px;">
                </div>

                <div id="inventario-table-container">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <thead id="inv-thead">
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                    <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Código</th>
                                    <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Producto</th>
                                    <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Total (kg)</th>
                                </tr>
                            </thead>
                            <tbody id="inv-tbody">
                                ${productos.map((p, idx) => `
                                    <tr class="inventario-simple-row" style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}; border-bottom: 1px solid #ddd;">
                                        <td style="padding: 12px; border: 1px solid #ddd;">${p.Codigo || ''}</td>
                                        <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">${p.Producto || ''}</td>
                                        <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">${(p.Stock_Actual || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold;">
                                    <td colspan="2" style="padding: 15px; text-align: right; border: 1px solid #ddd;">TOTAL:</td>
                                    <td style="padding: 15px; text-align: right; border: 1px solid #ddd; font-size: 16px;">${productos.reduce((sum, p) => sum + (p.Stock_Actual || 0), 0).toFixed(2)} kg</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center; color: #666;">
                    <span id="inventarioSimpleCount">Mostrando ${productos.length} productos en CONSOLIDADO</span>
                </div>
            </div>
        `;

        setTimeout(() => {
            this._setupInventarioSimple(productos);
        }, 100);

        return html;
    }
    async _setupInventarioSimple(productosConsolidado) {
        // Obtener el Excel RAW directamente del uploader
        let excelBuffer = null;
        
        if (window.dashboardApp && window.dashboardApp.uploader) {
            const files = window.dashboardApp.uploader.getFiles();
            if (files.inventario && files.inventario.arrayBuffer) {
                excelBuffer = files.inventario.arrayBuffer;
                console.log('✅ Excel buffer obtenido del uploader');
            }
        }

        // Búsqueda
        const searchInput = document.getElementById('searchInventarioSimple');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('.inventario-simple-row');
                let visibleCount = 0;

                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        row.style.display = '';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });

                const currentSheet = document.querySelector('.inv-sheet-btn.active')?.getAttribute('data-sheet') || 'CONSOLIDADO';
                const tbody = document.getElementById('inv-tbody');
                const totalRows = tbody ? tbody.querySelectorAll('tr').length : 0;
                document.getElementById('inventarioSimpleCount').textContent = 
                    `Mostrando ${visibleCount} de ${totalRows} productos en ${currentSheet}`;
            });
        }

        // Botones de cambio de hoja
        document.querySelectorAll('.inv-sheet-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const sheetName = btn.getAttribute('data-sheet');
                
                // Actualizar estilos
                document.querySelectorAll('.inv-sheet-btn').forEach(b => {
                    if (b === btn) {
                        b.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        b.style.color = 'white';
                        b.classList.add('active');
                    } else {
                        b.style.background = 'white';
                        b.style.color = '#667eea';
                        b.classList.remove('active');
                    }
                });

                const tbody = document.getElementById('inv-tbody');

                if (sheetName === 'CONSOLIDADO') {
                    // Mostrar CONSOLIDADO
                    // Para CONSOLIDADO
                    // Calcular total
                    const totalKgConsolidado = productosConsolidado.reduce((sum, p) => sum + (p.Stock_Actual || 0), 0);

                    tbody.innerHTML = productosConsolidado.map((p, idx) => `
                        <tr class="inventario-simple-row" style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}; border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; border: 1px solid #ddd;">${p.Codigo || ''}</td>
                            <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">${p.Producto || ''}</td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">${(p.Stock_Actual || 0).toFixed(2)}</td>
                        </tr>
                    `).join('') + `
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold;">
                            <td colspan="2" style="padding: 15px; text-align: right; border: 1px solid #ddd;">TOTAL:</td>
                            <td style="padding: 15px; text-align: right; border: 1px solid #ddd; font-size: 16px;">${totalKgConsolidado.toFixed(2)} kg</td>
                        </tr>
                    `;

                    
                    document.getElementById('inventarioSimpleCount').textContent = 
                        `Mostrando ${productosConsolidado.length} productos en CONSOLIDADO`;
                        
                } else if (excelBuffer) {
                    // Leer hoja específica
                    try {
                        const workbook = XLSX.read(excelBuffer, { type: 'array' });
                        
                        // ⬇️ CAMBIAR ESTA LÍNEA:
                        // if (workbook.SheetNames.includes(sheetName)) {
                        
                        // ⬇️ POR ESTAS DOS LÍNEAS:
                        const actualSheetName = workbook.SheetNames.find(name => name.trim() === sheetName.trim());
                        
                        if (actualSheetName) {
                            const sheet = workbook.Sheets[actualSheetName];  // ⬅️ Usar actualSheetName
                            const data = XLSX.utils.sheet_to_json(sheet, {
                                header: 1,
                                range: 9,
                                defval: ''
                            });
                            
                            if (data.length > 0) {
                                const headers = data[0].map(h => h ? h.toString().trim() : '');
                                const rows = data.slice(1).filter(row => row && row.length > 0 && row[0]);
                                
                                const codigoIdx = headers.findIndex(h => h.toLowerCase().includes('codigo') || h.toLowerCase().includes('codi'));
                                const productoIdx = headers.findIndex(h => h.toLowerCase().includes('producto'));
                                const totalIdx = headers.findIndex(h => h.toLowerCase().includes('total'));
                                
                                if (codigoIdx === -1 || productoIdx === -1 || totalIdx === -1) {
                                    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:40px; color:#d32f2f;">No se encontraron las columnas necesarias</td></tr>';
                                    return;
                                }
                                
                                // Calcular total
                                let totalKg = 0;
                                rows.forEach(row => {
                                    const value = row[totalIdx];
                                    if (typeof value === 'number') {
                                        totalKg += value;
                                    } else if (value && !isNaN(parseFloat(value))) {
                                        totalKg += parseFloat(value);
                                    }
                                });

                                tbody.innerHTML = rows.map((row, idx) => `
                                    <tr class="inventario-simple-row" style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'}; border-bottom: 1px solid #ddd;">
                                        <td style="padding: 12px; border: 1px solid #ddd;">${row[codigoIdx] || ''}</td>
                                        <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">${row[productoIdx] || ''}</td>
                                        <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">${typeof row[totalIdx] === 'number' ? row[totalIdx].toFixed(2) : row[totalIdx] || '0.00'}</td>
                                    </tr>
                                `).join('') + `
                                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold;">
                                        <td colspan="2" style="padding: 15px; text-align: right; border: 1px solid #ddd;">TOTAL:</td>
                                        <td style="padding: 15px; text-align: right; border: 1px solid #ddd; font-size: 16px;">${totalKg.toFixed(2)} kg</td>
                                    </tr>
                                `;

                            
                                document.getElementById('inventarioSimpleCount').textContent = 
                                    `Mostrando ${rows.length} productos en ${sheetName}`;
                            } else {
                                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:40px; color:#666;">No hay datos en esta hoja</td></tr>';
                            }
                        } else {
                            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:40px; color:#d32f2f;">La hoja ${sheetName} no existe en el archivo</td></tr>`;
                        }
                    } catch (error) {
                        console.error('Error al leer hoja:', error);
                        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:40px; color:#d32f2f;">Error al cargar datos de la hoja</td></tr>';
                    }
                } else {
                    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:40px; color:#666;">
                        Reinicia y carga los archivos nuevamente para ver ${sheetName}
                    </td></tr>`;
                }
            });
        });
    }

    /**
     * Crea tabla de análisis por ubicación de almacenamiento
     */
    createAnalisisPorUbicacion() {
        if (!this.hasHistorical) {
            return '<p style="text-align:center; color:#666; padding:40px;">No hay datos históricos disponibles para análisis por ubicación</p>';
        }

        // Duplicar productos por CAVA
        const productos = this.analisis || this.processor.dfProcessed;
        const productosCavas = [];

        productos.forEach(p => {
            // CAVA 1 (Congelado)
            productosCavas.push({
                ...p,
                Cava: 'CAVA 1',
                Tipo: 'Congelado',
                Semanas_Limite: 4
            });

            // CAVA 2 (Refrigeración)
            productosCavas.push({
                ...p,
                Cava: 'CAVA 2',
                Tipo: 'Refrigeración',
                Semanas_Limite: 0.4
            });

            // CAVA 3
            productosCavas.push({
                ...p,
                Cava: 'CAVA 3',
                Tipo: 'Seco',
                Semanas_Limite: 8
            });
        });

        // Calcular semanas de stock y estado
        productosCavas.forEach(p => {
            p.Semanas_Stock = p.Promedio_Semanal > 0 ? p.Stock_Actual / p.Promedio_Semanal : 0;
            
            if (p.Promedio_Semanal === 0 || !p.Promedio_Semanal) {
                p.Estado_Ubicacion = 'Sin Ventas';
            } else if (p.Semanas_Stock >= p.Semanas_Limite) {
                p.Estado_Ubicacion = 'Sobre Stock';
            } else if (p.Semanas_Stock > 0) {
                p.Estado_Ubicacion = 'Stock Adecuado';
            } else {
                p.Estado_Ubicacion = 'Stock Bajo';
            }
        });

        // Ordenar por Cava y Stock
        productosCavas.sort((a, b) => {
            if (a.Cava !== b.Cava) return a.Cava.localeCompare(b.Cava);
            return b.Stock_Actual - a.Stock_Actual;
        });

        const html = `
            <div style="margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: #667eea;">🏬 Análisis por Ubicación de Almacenamiento</h3>
                    
                    <div style="position: relative;">
                        <button id="cavaFilterBtn" style="padding: 10px 20px; background: white; border: 2px solid #667eea; border-radius: 5px; cursor: pointer; color: #667eea; font-weight: 600; min-width: 200px;">
                            ❄️ Filtrar CAVAs ▼
                        </button>
                        
                        <div id="cavaFilterDropdown" style="display: none; position: absolute; top: 100%; right: 0; background: white; border: 2px solid #667eea; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 250px; z-index: 1000; margin-top: 5px;">
                            <div style="padding: 15px; border-bottom: 1px solid #ddd;">
                                <label style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer;">
                                    <input type="checkbox" class="cava-checkbox" value="CAVA 1" checked style="margin-right: 10px; cursor: pointer;">
                                    <span>❄️ CAVA 1 (Congelado)</span>
                                </label>
                                <label style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer;">
                                    <input type="checkbox" class="cava-checkbox" value="CAVA 2" checked style="margin-right: 10px; cursor: pointer;">
                                    <span>🧊 CAVA 2 (Refrigeración)</span>
                                </label>
                                <label style="display: flex; align-items: center; cursor: pointer;">
                                    <input type="checkbox" class="cava-checkbox" value="CAVA 3" style="margin-right: 10px; cursor: pointer;">
                                    <span>🌡️ CAVA 3 (Seco)</span>
                                </label>
                            </div>
                            <div style="padding: 10px; display: flex; justify-content: flex-end; gap: 10px;">
                                <button id="cavaApplyBtn" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="overflow-x: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 5px;">
                    <table id="ubicacionTable" style="width: 100%; border-collapse: collapse; font-size: 14px; background: white;">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Código</th>
                                <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Producto</th>
                                <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Ubicación</th>
                                <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Stock Actual (kg)</th>
                                <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Prom. Ventas/Sem (kg)</th>
                                <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Semanas de Stock</th>
                                <th style="padding: 15px; text-align: center; border: 1px solid #ddd;">Estado</th>
                            </tr>
                        </thead>
                        <tbody id="ubicacionTableBody">
                            ${this._renderUbicacionRows(productosCavas, ['CAVA 1', 'CAVA 2'])}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        setTimeout(() => {
            this._setupUbicacionFilter(productosCavas);
        }, 100);

        return html;
    }

    _renderUbicacionRows(productos, selectedCavas) {
        let html = '';
        let currentCava = null;

        const filteredProductos = productos.filter(p => selectedCavas.includes(p.Cava));

        filteredProductos.forEach((p, idx) => {
            // Header de CAVA
            if (currentCava !== p.Cava) {
                currentCava = p.Cava;
                html += `
                    <tr style="background: #f0f2ff;">
                        <td colspan="7" style="padding: 12px; font-weight: bold; color: #667eea; border: 1px solid #000000ff;">
                            ${p.Tipo} (${p.Cava})
                        </td>
                    </tr>
                `;
            }

            // Color según estado
            let bgColor = '#ffffff';
            if (p.Estado_Ubicacion === 'Sobre Stock') bgColor = '#ffe6e6';
            else if (p.Estado_Ubicacion === 'Stock Bajo') bgColor = '#fff4e6';
            else if (p.Estado_Ubicacion === 'Stock Adecuado') bgColor = '#e6ffe6';
            else bgColor = '#f5f5f5';

            html += `
                <tr class="ubicacion-row" data-cava="${p.Cava}" style="background: ${bgColor}; border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px; border: 1px solid #ddd; color: #333;">${p.Codigo || ''}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500; color: #333;">${p.Producto}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; color: #333;">${p.Tipo} (${p.Cava})</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #333;">${p.Stock_Actual.toFixed(1)}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #333;">${p.Promedio_Semanal ? p.Promedio_Semanal.toFixed(1) : '0.0'}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #333;">${p.Semanas_Stock > 0 ? p.Semanas_Stock.toFixed(1) : 'Sin datos'}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                        <span style="padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; color: white; background: ${this._getEstadoColorUbicacion(p.Estado_Ubicacion)};">
                            ${p.Estado_Ubicacion}
                        </span>
                    </td>
                </tr>
            `;
        });

        return html || '<tr><td colspan="7" style="text-align:center; padding:40px; color:#666;">No hay datos para mostrar</td></tr>';
    }

    _getEstadoColorUbicacion(estado) {
        const colores = {
            'Sobre Stock': '#E74C3C',
            'Stock Bajo': '#F39C12',
            'Stock Adecuado': '#2ECC71',
            'Sin Ventas': '#95A5A6'
        };
        return colores[estado] || '#95A5A6';
    }

    _setupUbicacionFilter(productos) {
        const filterBtn = document.getElementById('cavaFilterBtn');
        const filterDropdown = document.getElementById('cavaFilterDropdown');
        const applyBtn = document.getElementById('cavaApplyBtn');

        if (!filterBtn || !filterDropdown) return;

        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && e.target !== filterBtn) {
                filterDropdown.style.display = 'none';
            }
        });

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const selectedCavas = Array.from(document.querySelectorAll('.cava-checkbox:checked')).map(cb => cb.value);
                
                const tbody = document.getElementById('ubicacionTableBody');
                tbody.innerHTML = this._renderUbicacionRows(productos, selectedCavas);
                
                filterDropdown.style.display = 'none';
                
                const totalSelected = selectedCavas.length;
                filterBtn.textContent = totalSelected === 3 ? '❄️ Todas las CAVAs ▼' : `❄️ CAVAs (${totalSelected}) ▼`;
            });
        }
    }
    
    /**
     * Renderiza todas las visualizaciones
     */
    renderAll() {
        this.createKpiCards('kpi-cards');
        this.createDashboardCompleto('dashboard-completo');

        document.getElementById('alerta-critica').innerHTML = this.createAlertaCritica();
        document.getElementById('resumen-ejecutivo').innerHTML = this.createResumenEjecutivo();
        document.getElementById('analisis-ubicacion').innerHTML = this.createAnalisisPorUbicacion();
        document.getElementById('tabla-criticos').innerHTML = this.createTablaProductosCriticos();
        document.getElementById('tabla-inventario').innerHTML = this.createTablaInventarioCompleto();
    }
}

export default DashboardVisualizations;
