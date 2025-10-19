/**
 * App.js - Orquestador principal del dashboard
 * Maneja el flujo completo: Upload → Process → Visualize → Persist
 */

import { FileUploader } from './fileUploader.js';
import { DataProcessor } from './dataProcessor.js';
import { DashboardVisualizations } from './visualizations.js';
import { StorageManager } from './storageManager.js';
import { formatDateTime } from './utils.js';

class DashboardApp {
    constructor() {
        this.uploader = null;
        this.processor = null;
        this.visualizations = null;
        this.storage = null;

        this.btnProcess = null;
        this.btnReset = null;
        this.loadingOverlay = null;
        this.welcomeMessage = null;
        this.dashboardContent = null;
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log('🚀 Inicializando Dashboard Lomarosa...');

        // Inicializar storage
        this.storage = new StorageManager();
        await this.storage.init();

        // Inicializar uploader
        this.uploader = new FileUploader();
        await this.uploader.init();

        // Configurar elementos del DOM
        this.setupElements();

        // Configurar event listeners
        this.setupEventListeners();

        // Verificar si hay datos guardados
        await this.checkSavedData();

        console.log('✅ Dashboard inicializado correctamente');
    }

    /**
     * Configura referencias a elementos del DOM
     */
    setupElements() {
        this.btnProcess = document.getElementById('btn-process');
        this.btnReset = document.getElementById('btn-reset');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.welcomeMessage = document.getElementById('welcome-message');
        this.dashboardContent = document.getElementById('dashboard-content');
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Botón procesar
        if (this.btnProcess) {
            this.btnProcess.addEventListener('click', () => this.procesarDatos());
        }

        // Botón reiniciar
        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => this.reiniciar());
        }

        // Callback cuando ambos archivos están listos
        this.uploader.onFilesReady((files) => {
            this.enableProcessButton();
        });

        // Callback cuando se carga un archivo
        this.uploader.onFileUploaded((fileType, filename) => {
            console.log(`✅ Archivo ${fileType} cargado: ${filename}`);
        });
    }

    /**
     * Habilita el botón de procesar
     */
    enableProcessButton() {
        if (this.btnProcess) {
            this.btnProcess.disabled = false;
            this.btnProcess.style.opacity = '1';
            this.btnProcess.style.cursor = 'pointer';
        }
    }

    /**
     * Deshabilita el botón de procesar
     */
    disableProcessButton() {
        if (this.btnProcess) {
            this.btnProcess.disabled = true;
            this.btnProcess.style.opacity = '0.5';
            this.btnProcess.style.cursor = 'not-allowed';
        }
    }

    /**
     * Muestra overlay de carga
     */
    showLoading(show = true) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * Muestra dashboard
     */
    showDashboard(show = true) {
        if (this.welcomeMessage && this.dashboardContent) {
            this.welcomeMessage.style.display = show ? 'none' : 'block';
            this.dashboardContent.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Procesa los datos
     */
    async procesarDatos() {
        try {
            console.log('\n🚀 Iniciando procesamiento de datos...\n');

            this.showLoading(true);
            this.disableProcessButton();

            // Obtener archivos del uploader
            const files = this.uploader.getFiles();

            if (!files.inventario || !files.consolidado) {
                throw new Error('Faltan archivos por cargar');
            }

            // Crear procesador
            this.processor = new DataProcessor();

            // Procesar datos
            const success = await this.processor.process(
                files.inventario.arrayBuffer,
                files.consolidado.arrayBuffer
            );

            if (!success) {
                throw new Error('Error al procesar los datos');
            }

            // Guardar datos procesados
            const allData = this.processor.getAllData();
            await this.storage.saveProcessedData(allData);

            // Guardar metadata
            await this.storage.saveMetadata({
                lastUpdate: new Date().toISOString(),
                inventarioFile: files.inventario.name,
                consolidadoFile: files.consolidado.name
            });

            // Generar visualizaciones
            await this.generarVisualizaciones();

            // Actualizar fecha de actualización
            this.updateLastUpdate();

            // Mostrar dashboard
            this.showDashboard(true);

            console.log('\n✅ Dashboard generado exitosamente!\n');

        } catch (error) {
            console.error('❌ Error al procesar datos:', error);
            alert(`Error al generar dashboard: ${error.message}`);
        } finally {
            this.showLoading(false);
            this.enableProcessButton();
        }
    }

    /**
     * Genera todas las visualizaciones
     */
    async generarVisualizaciones() {
        if (!this.processor) {
            throw new Error('No hay datos procesados');
        }

        console.log('🎨 Generando visualizaciones...');

        // Crear instancia de visualizaciones
        this.visualizations = new DashboardVisualizations(this.processor);

        // Renderizar todas las visualizaciones
        this.visualizations.renderAll();

        console.log('✅ Visualizaciones generadas correctamente');
    }

    /**
     * Actualiza la fecha de última actualización
     */
    updateLastUpdate() {
        const updateBadge = document.getElementById('fecha-actualizacion');
        const lastUpdateSidebar = document.getElementById('last-update');

        const now = new Date();
        const formattedDate = formatDateTime(now);

        if (updateBadge) {
            updateBadge.textContent = formattedDate;
        }

        if (lastUpdateSidebar) {
            const updateText = lastUpdateSidebar.querySelector('.update-text');
            if (updateText) {
                updateText.innerHTML = `<strong>Última actualización:</strong><br>${formattedDate}`;
            }
        }
    }

    /**
     * Verifica si hay datos guardados en IndexedDB
     */
    async checkSavedData() {
        try {
            console.log('🔍 Verificando datos guardados...');

            const processedData = await this.storage.getProcessedData();
            const metadata = await this.storage.getMetadata();

            if (processedData && metadata) {
                console.log('📊 Datos guardados encontrados');

                // Preguntar al usuario si quiere cargar los datos guardados
                const loadSaved = confirm(
                    `Se encontraron datos guardados del ${formatDateTime(new Date(metadata.lastUpdate))}.\n\n` +
                    `Archivos:\n` +
                    `- Inventario: ${metadata.inventarioFile}\n` +
                    `- Consolidado: ${metadata.consolidadoFile}\n\n` +
                    `¿Desea cargar estos datos?`
                );

                if (loadSaved) {
                    await this.cargarDatosGuardados(processedData, metadata);
                }
            } else {
                console.log('ℹ️ No hay datos guardados');
            }

        } catch (error) {
            console.error('Error al verificar datos guardados:', error);
        }
    }

    /**
     * Carga datos guardados
     */
    async cargarDatosGuardados(processedData, metadata) {
        try {
            console.log('📂 Cargando datos guardados...');

            this.showLoading(true);

            // Reconstruir processor
            this.processor = new DataProcessor();
            this.processor.dfProcessed = processedData.dfProcessed;
            this.processor.analisis = processedData.analisis;

            // Generar visualizaciones
            await this.generarVisualizaciones();

            // Actualizar fecha de actualización
            const updateBadge = document.getElementById('fecha-actualizacion');
            const lastUpdateSidebar = document.getElementById('last-update');

            if (updateBadge) {
                updateBadge.textContent = formatDateTime(new Date(metadata.lastUpdate));
            }

            if (lastUpdateSidebar) {
                const updateText = lastUpdateSidebar.querySelector('.update-text');
                if (updateText) {
                    updateText.innerHTML = `<strong>Última actualización:</strong><br>${formatDateTime(new Date(metadata.lastUpdate))}<br><small>(Datos guardados)</small>`;
                }
            }

            // Mostrar dashboard
            this.showDashboard(true);

            console.log('✅ Datos guardados cargados correctamente');

        } catch (error) {
            console.error('Error al cargar datos guardados:', error);
            alert('Error al cargar datos guardados. Por favor, carga los archivos nuevamente.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Reinicia la aplicación
     */
    async reiniciar() {
        const confirmar = confirm('¿Estás seguro de que deseas reiniciar? Se borrarán todos los datos cargados.');

        if (!confirmar) return;

        try {
            console.log('🔄 Reiniciando aplicación...');

            // Reiniciar uploader
            await this.uploader.reset();

            // Limpiar storage
            await this.storage.clearAll();

            // Limpiar procesador y visualizaciones
            this.processor = null;
            this.visualizations = null;

            // Ocultar dashboard
            this.showDashboard(false);

            // Deshabilitar botón procesar
            this.disableProcessButton();

            // Limpiar fecha de actualización
            const lastUpdateSidebar = document.getElementById('last-update');
            if (lastUpdateSidebar) {
                const updateText = lastUpdateSidebar.querySelector('.update-text');
                if (updateText) {
                    updateText.textContent = 'Sin datos cargados';
                }
            }

            console.log('✅ Aplicación reiniciada');

        } catch (error) {
            console.error('Error al reiniciar:', error);
            alert('Error al reiniciar la aplicación');
        }
    }
}

// Inicializar app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DashboardApp();
    await app.init();

    // Hacer app global para debugging
    window.dashboardApp = app;
});

export default DashboardApp;
