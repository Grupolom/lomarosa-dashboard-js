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

    async init() {
        console.log('🚀 Inicializando Dashboard Lomarosa...');

        this.storage = new StorageManager();
        await this.storage.init();

        this.uploader = new FileUploader();
        await this.uploader.init();

        this.setupElements();
        this.setupEventListeners();
        await this.checkSavedData();

        console.log('✅ Dashboard inicializado correctamente');
    }

    setupElements() {
        this.btnProcess = document.getElementById('btn-process');
        this.btnReset = document.getElementById('btn-reset');
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.welcomeMessage = document.getElementById('welcome-message');
        this.dashboardContent = document.getElementById('dashboard-content');
    }

    setupEventListeners() {
        if (this.btnProcess) {
            this.btnProcess.addEventListener('click', () => this.procesarDatos());
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => this.reiniciar());
        }

        this.uploader.onFilesReady((files) => {
            this.enableProcessButton();
        });

        this.uploader.onFileUploaded((fileType, filename) => {
            console.log(`✅ Archivo ${fileType} cargado: ${filename}`);
        });
    }

    enableProcessButton() {
        if (this.btnProcess) {
            this.btnProcess.disabled = false;
            this.btnProcess.style.opacity = '1';
            this.btnProcess.style.cursor = 'pointer';
        }
    }

    disableProcessButton() {
        if (this.btnProcess) {
            this.btnProcess.disabled = true;
            this.btnProcess.style.opacity = '0.5';
            this.btnProcess.style.cursor = 'not-allowed';
        }
    }

    showLoading(show = true) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showDashboard(show = true) {
        if (this.welcomeMessage && this.dashboardContent) {
            this.welcomeMessage.style.display = show ? 'none' : 'block';
            this.dashboardContent.style.display = show ? 'block' : 'none';
        }
    }

    async procesarDatos() {
        try {
            console.log('\n🚀 Iniciando procesamiento de datos...\n');

            this.showLoading(true);
            this.disableProcessButton();

            const files = this.uploader.getFiles();

            if (!files.inventario || !files.consolidado) {
                throw new Error('Faltan archivos por cargar');
            }

            this.processor = new DataProcessor();

            const success = await this.processor.process(
                files.inventario.arrayBuffer,
                files.consolidado.arrayBuffer
            );

            if (!success) {
                throw new Error('Error al procesar los datos');
            }

            const allData = this.processor.getAllData();
            await this.storage.saveProcessedData(allData);

            await this.storage.saveMetadata({
                lastUpdate: new Date().toISOString(),
                inventarioFile: files.inventario.name,
                consolidadoFile: files.consolidado.name
            });

            await this.generarVisualizaciones();

            this.updateLastUpdate();

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

        // ⬇️ NUEVO: Pasar el buffer de inventario
        if (this.uploader && this.uploader.files && this.uploader.files.inventario) {
            this.visualizations.inventarioBuffer = this.uploader.files.inventario.arrayBuffer;
            console.log('✅ Buffer de inventario pasado a visualizations');
        }

        // Renderizar todas las visualizaciones
        this.visualizations.renderAll();

        console.log('✅ Visualizaciones generadas correctamente');
    }

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

    async checkSavedData() {
        try {
            console.log('🔍 Verificando datos guardados...');

            const processedData = await this.storage.getProcessedData();
            const metadata = await this.storage.getMetadata();

            if (processedData && metadata) {
                console.log('📊 Datos guardados encontrados');

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

    async cargarDatosGuardados(processedData, metadata) {
        try {
            console.log('📂 Cargando datos guardados...');

            this.showLoading(true);

            this.processor = new DataProcessor();
            this.processor.dfProcessed = processedData.dfProcessed;
            this.processor.analisis = processedData.analisis;

            await this.generarVisualizaciones();

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

            this.showDashboard(true);

            console.log('✅ Datos guardados cargados correctamente');

        } catch (error) {
            console.error('Error al cargar datos guardados:', error);
            alert('Error al cargar datos guardados. Por favor, carga los archivos nuevamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async reiniciar() {
        const confirmar = confirm('¿Estás seguro de que deseas reiniciar? Se borrarán todos los datos cargados.');

        if (!confirmar) return;

        try {
            console.log('🔄 Reiniciando aplicación...');

            await this.uploader.reset();

            await this.storage.clearAll();

            this.processor = null;
            this.visualizations = null;

            this.showDashboard(false);

            this.disableProcessButton();

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

document.addEventListener('DOMContentLoaded', async () => {
    const app = new DashboardApp();
    await app.init();

    window.dashboardApp = app;
});

export default DashboardApp;
