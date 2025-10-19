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
                text: '<b>Dashboard de Control de Inventario</b>',
                x: 0.5,
                y: 0.98,
                xanchor: 'center',
                font: { size: 22, color: colors.text }
            },
            height: 1150,
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
            margin: { t: 120, b: 60, l: 40, r: 40 },

            // Subplots 2x2
            grid: { rows: 2, columns: 2, pattern: 'independent' },

            xaxis: { title: 'Producto', tickangle: 45, domain: [0, 0.45] },
            yaxis: { title: 'Cantidad (kg)', domain: [0.55, 1] },

            xaxis2: { title: 'Producto', tickangle: 45, domain: [0.55, 1] },
            yaxis2: { title: 'Cantidad (kg)', domain: [0.55, 1] },

            xaxis3: { domain: [0, 0.45], visible: false },
            yaxis3: { domain: [0, 0.45], visible: false },

            xaxis4: { title: 'Producto', tickangle: 45, domain: [0.55, 1] },
            yaxis4: { title: 'Número de Ventas', domain: [0, 0.45] }
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

        return `
            <div style="font-family:Arial; max-width:1200px; margin:20px auto; padding:20px;">
                <h2 style="color:#2C3E50; margin-bottom:20px;">Resumen Ejecutivo de Inventario</h2>

                <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:30px;">
                    <!-- Tarjeta Productos Sin Movimiento -->
                    <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <div style="color:#2C3E50; font-size:16px; margin-bottom:10px;">Productos Sin Movimiento</div>
                        <div style="font-size:24px; font-weight:bold; margin-bottom:5px; color:#F1C40F;">${productosSinVentas}</div>
                        <div style="font-size:14px; color:#666;">${pctSinVentas}% del inventario no ha tenido ventas</div>
                    </div>

                    <!-- Tarjeta Productos Críticos -->
                    <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <div style="color:#2C3E50; font-size:16px; margin-bottom:10px;">Productos en Estado Crítico</div>
                        <div style="font-size:24px; font-weight:bold; margin-bottom:5px; color:#E74C3C;">${productosCriticos}</div>
                        <div style="font-size:14px; color:#666;">${pctCriticos}% tienen stock bajo el promedio</div>
                    </div>

                    <!-- Tarjeta Stock Total -->
                    <div style="background:white; border-radius:10px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <div style="color:#2C3E50; font-size:16px; margin-bottom:10px;">Stock Total</div>
                        <div style="font-size:24px; font-weight:bold; margin-bottom:5px; color:#2ECC71;">${formatNumber(stats.stock_total_kilos, 0)} kg</div>
                        <div style="font-size:14px; color:#666;">Distribuido en ${totalProductos} productos</div>
                    </div>
                </div>

                <div style="background:#F8F9FA; border-radius:10px; padding:20px;">
                    <h3 style="color:#2C3E50; margin-bottom:15px;">Recomendaciones Principales</h3>
                    <ul style="color:#555;">
                        <li style="margin-bottom:10px;">
                            <strong>Atención Inmediata:</strong> ${topDeficit.length} productos requieren reposición urgente.
                        </li>
                        <li style="margin-bottom:10px;">
                            <strong>Sobrestock:</strong> ${topSobrestock.length} productos tienen niveles de stock significativamente altos.
                        </li>
                        <li>
                            <strong>Productos Sin Movimiento:</strong> Evaluar estrategias para ${productosSinVentas} productos sin ventas recientes.
                        </li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Crea tabla HTML de productos críticos (simplificada)
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

        let html = `
            <div style='margin:20px 0;'>
                <div style='overflow-x:auto;'>
                    <table style='width:100%; border-collapse:collapse; box-shadow:0 2px 4px rgba(0,0,0,0.1);'>
                        <thead>
                            <tr style='background-color:#E74C3C; color:white;'>
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
            html += `
                <tr style='background-color:#ffe6e6;'>
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
            </div>
        `;

        return html;
    }

    /**
     * Crea tabla HTML de inventario completo (simplificada)
     */
    createTablaInventarioCompleto() {
        const df = this.analisis || this.processor.dfProcessed;
        const tieneHistorico = this.hasHistorical;

        let html = `
            <div style="margin: 30px 0;">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Código</th>
                                <th style="padding: 15px; text-align: left; border: 1px solid #ddd;">Producto</th>
                                <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Stock Actual (kg)</th>
        `;

        if (tieneHistorico) {
            html += `
                                <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Promedio Semanal (kg)</th>
                                <th style="padding: 15px; text-align: right; border: 1px solid #ddd;">Diferencia (kg)</th>
                                <th style="padding: 15px; text-align: center; border: 1px solid #ddd;">Estado</th>
            `;
        }

        html += `
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Mostrar primeros 20 productos
        const productos = df.slice(0, 20);

        productos.forEach(p => {
            const bgColor = tieneHistorico && p.Estado === ESTADOS_INVENTARIO.BAJO_PROMEDIO ? '#ffe6e6' : '#e6f7e6';
            const estadoBadgeColor = tieneHistorico && p.Estado === ESTADOS_INVENTARIO.BAJO_PROMEDIO ? '#E74C3C' : '#2ECC71';

            html += `
                <tr style="background-color: ${bgColor}; border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px; border: 1px solid #ddd;">${p.Codigo}</td>
                    <td style="padding: 12px; border: 1px solid #ddd; font-weight: 500;">${p.Producto}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold;">${p.Stock_Actual.toFixed(2)}</td>
            `;

            if (tieneHistorico) {
                const difColor = p.Diferencia < 0 ? '#d62728' : '#2ca02c';
                html += `
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">${p.Promedio_Semanal.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: ${difColor}; font-weight: bold;">${p.Diferencia.toFixed(2)}</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">
                        <span style="background: ${estadoBadgeColor}; color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                            ${p.Estado}
                        </span>
                    </td>
                `;
            }

            html += `</tr>`;
        });

        html += `
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; text-align: center; color: #666;">
                    Total: ${df.length} productos (mostrando primeros 20)
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Renderiza todas las visualizaciones
     */
    renderAll() {
        this.createKpiCards('kpi-cards');
        this.createDashboardCompleto('dashboard-completo');

        document.getElementById('alerta-critica').innerHTML = this.createAlertaCritica();
        document.getElementById('resumen-ejecutivo').innerHTML = this.createResumenEjecutivo();
        document.getElementById('tabla-criticos').innerHTML = this.createTablaProductosCriticos();
        document.getElementById('tabla-inventario').innerHTML = this.createTablaInventarioCompleto();
    }
}

export default DashboardVisualizations;
