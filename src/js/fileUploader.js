/**
 * File Uploader - Gestión de carga de archivos Excel con Drag & Drop
 */

import CONFIG from './config.js';
import { StorageManager } from './storageManager.js';

export class FileUploader {
    constructor() {
        this.storage = new StorageManager();
        this.files = {
            inventario: null,
            consolidado: null
        };

        this.uploadZones = {
            inventario: null,
            consolidado: null
        };

        this.fileInputs = {
            inventario: null,
            consolidado: null
        };

        this.statusElements = {
            inventario: null,
            consolidado: null
        };

        this.onFilesReadyCallback = null;
        this.onFileUploadedCallback = null;
    }

    /**
     * Inicializa el uploader
     */
    async init() {
        await this.storage.init();
        this.setupElements();
        this.setupEventListeners();
        await this.checkExistingFiles();
    }

    /**
     * Configura referencias a elementos del DOM
     */
    setupElements() {
        console.log(`🔧 === Configurando elementos del DOM ===`);

        this.uploadZones = {
            inventario: document.getElementById('upload-inventario'),
            consolidado: document.getElementById('upload-consolidado')
        };
        console.log(`   - Upload zones:`, this.uploadZones);

        this.fileInputs = {
            inventario: document.getElementById('file-inventario'),
            consolidado: document.getElementById('file-consolidado')
        };
        console.log(`   - File inputs:`, this.fileInputs);

        this.statusElements = {
            inventario: document.getElementById('status-inventario'),
            consolidado: document.getElementById('status-consolidado')
        };
        console.log(`   - Status elements:`, this.statusElements);

        // Verificar que todos los elementos existen
        const missing = [];
        if (!this.uploadZones.inventario) missing.push('upload-inventario');
        if (!this.uploadZones.consolidado) missing.push('upload-consolidado');
        if (!this.fileInputs.inventario) missing.push('file-inventario');
        if (!this.fileInputs.consolidado) missing.push('file-consolidado');
        if (!this.statusElements.inventario) missing.push('status-inventario');
        if (!this.statusElements.consolidado) missing.push('status-consolidado');

        if (missing.length > 0) {
            console.error(`❌ Elementos del DOM faltantes:`, missing);
        } else {
            console.log(`✅ Todos los elementos del DOM encontrados`);
        }

        console.log(`🔧 === Fin configuración elementos ===\n`);
    }

    /**
     * Configura event listeners para drag & drop y file input
     */
    setupEventListeners() {
        // Inventario
        this.setupDragAndDrop('inventario');
        this.setupFileInput('inventario');

        // Consolidado
        this.setupDragAndDrop('consolidado');
        this.setupFileInput('consolidado');
    }

    /**
     * Configura drag & drop para un tipo de archivo
     */
    setupDragAndDrop(fileType) {
        const zone = this.uploadZones[fileType];

        if (!zone) return;

        // Prevenir comportamiento por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Agregar clase visual cuando arrastra sobre la zona
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.remove('drag-over');
            });
        });

        // Manejar drop
        zone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0], fileType);
            }
        });
    }

    /**
     * Configura input de archivo
     */
    setupFileInput(fileType) {
        const input = this.fileInputs[fileType];

        console.log(`🔧 Configurando input para ${fileType}:`, input);

        if (!input) {
            console.error(`❌ Input file para ${fileType} no encontrado!`);
            return;
        }

        input.addEventListener('change', (e) => {
            console.log(`📁 Evento 'change' disparado para ${fileType}`);
            console.log(`   - Target:`, e.target);
            console.log(`   - Files:`, e.target.files);

            const files = e.target.files;
            if (files.length > 0) {
                console.log(`   - Archivo seleccionado: ${files[0].name}`);
                this.handleFile(files[0], fileType);
            } else {
                console.warn(`   - No se seleccionaron archivos`);
            }
        });

        console.log(`✅ Event listener configurado para ${fileType}`);
    }

    /**
     * Maneja archivo seleccionado/dropeado
     */
    async handleFile(file, fileType) {
        console.log(`\n📂 === INICIO handleFile para ${fileType} ===`);
        console.log(`   - Nombre: ${file.name}`);
        console.log(`   - Tamaño: ${file.size} bytes`);
        console.log(`   - Tipo: ${file.type}`);

        // Validar extensión
        if (!file.name.endsWith('.xlsx')) {
            console.error(`❌ Extensión inválida: ${file.name}`);
            this.updateStatus(fileType, 'error', `❌ Error: Solo archivos .xlsx`);
            return;
        }

        console.log(`✅ Extensión válida`);

        // Mostrar estado de carga
        this.updateStatus(fileType, 'loading', `⏳ Cargando ${file.name}...`);

        try {
            // Leer archivo como ArrayBuffer
            console.log(`📖 Leyendo archivo como ArrayBuffer...`);
            const arrayBuffer = await this.readFileAsArrayBuffer(file);
            console.log(`✅ ArrayBuffer leído: ${arrayBuffer.byteLength} bytes`);

            // Validar contenido del Excel
            console.log(`🔍 Validando contenido del Excel...`);
            const isValid = await this.validateExcelFile(arrayBuffer, fileType);
            console.log(`   - Validación: ${isValid ? 'VÁLIDO ✅' : 'INVÁLIDO ❌'}`);

            if (!isValid) {
                this.updateStatus(fileType, 'error', `❌ Archivo inválido: columnas requeridas no encontradas`);
                return;
            }

            // Guardar en IndexedDB
            console.log(`💾 Guardando en IndexedDB...`);
            await this.storage.saveFile(fileType, arrayBuffer, file.name);
            console.log(`✅ Guardado en IndexedDB`);

            // Guardar referencia local
            this.files[fileType] = {
                name: file.name,
                arrayBuffer: arrayBuffer,
                uploadedAt: new Date()
            };
            console.log(`✅ Referencia local guardada`);

            // Actualizar status
            this.updateStatus(fileType, 'success', `✅ ${file.name}`);
            console.log(`✅ Status actualizado a SUCCESS`);

            // Callback
            if (this.onFileUploadedCallback) {
                console.log(`📞 Llamando callback onFileUploaded`);
                this.onFileUploadedCallback(fileType, file.name);
            }

            // Verificar si ambos archivos están listos
            console.log(`🔍 Verificando si ambos archivos están listos...`);
            const ready = this.checkIfFilesReady();
            console.log(`   - Ambos listos: ${ready ? 'SÍ ✅' : 'NO ⏳'}`);

            console.log(`📂 === FIN handleFile para ${fileType} ===\n`);

        } catch (error) {
            console.error(`❌ ERROR en handleFile para ${fileType}:`, error);
            console.error(`   - Stack:`, error.stack);
            this.updateStatus(fileType, 'error', `❌ Error: ${error.message}`);
        }
    }

    /**
     * Lee archivo como ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        console.log(`   📖 Iniciando FileReader...`);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadstart = () => {
                console.log(`   ⏳ FileReader: onloadstart`);
            };

            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = ((e.loaded / e.total) * 100).toFixed(0);
                    console.log(`   📊 FileReader: progreso ${percent}%`);
                }
            };

            reader.onload = (e) => {
                console.log(`   ✅ FileReader: onload - ${e.target.result.byteLength} bytes`);
                resolve(e.target.result);
            };

            reader.onerror = (error) => {
                console.error(`   ❌ FileReader: onerror`, error);
                reject(error);
            };

            reader.onabort = () => {
                console.warn(`   ⚠️ FileReader: onabort`);
                reject(new Error('Lectura de archivo abortada'));
            };

            console.log(`   🚀 FileReader: readAsArrayBuffer iniciado`);
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Valida que el archivo Excel tenga las columnas requeridas
     */
    async validateExcelFile(arrayBuffer, fileType) {
        try {
            console.log(`\n🔍 === VALIDANDO EXCEL: ${fileType} ===`);

            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            console.log(`📑 Hojas disponibles:`, workbook.SheetNames);

            if (fileType === 'inventario') {
                if (!workbook.SheetNames.includes('CONSOLIDADO')) {
                    console.error('❌ Hoja CONSOLIDADO no encontrada');
                    return false;
                }

                const sheet = workbook.Sheets['CONSOLIDADO'];
                const data = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    range: 9
                });

                if (data.length === 0) return false;

                // Limpiar headers (quitar espacios)
                const headers = data[0].map(h => h ? h.toString().trim() : '');
                console.log('📋 Headers INVENTARIO (limpios):', headers);

                // Validar con headers limpios
                const required = ['Codigo', 'Productos', 'Total', 'U/m', 'Comentarios'];

                const found = {};
                required.forEach(col => {
                    found[col] = headers.includes(col);
                    console.log(`   ${found[col] ? '✅' : '❌'} "${col}"`);
                });

                const allFound = Object.values(found).every(v => v);

                if (!allFound) {
                    const missing = required.filter(col => !found[col]);
                    console.error('❌ Columnas faltantes:', missing);
                    console.log('   Headers disponibles:', headers);
                    return false;
                }

                console.log('✅ Inventario válido - todas las columnas encontradas');

            } else if (fileType === 'consolidado') {
                // Verificar hoja Sheet1
                if (!workbook.SheetNames.includes(CONFIG.CONSOLIDADO_SHEET)) {
                    console.error(`❌ Hoja "${CONFIG.CONSOLIDADO_SHEET}" no encontrada`);
                    console.log(`   Hojas disponibles:`, workbook.SheetNames);
                    return false;
                }

                console.log(`✅ Hoja "${CONFIG.CONSOLIDADO_SHEET}" encontrada`);

                const sheet = workbook.Sheets[CONFIG.CONSOLIDADO_SHEET];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                if (data.length === 0) {
                    console.error(`❌ Archivo vacío`);
                    return false;
                }

                const headers = data[0];

                console.log(`📋 Headers encontrados (${headers.length} columnas):`);
                headers.forEach((h, idx) => {
                    console.log(`   [${idx}] "${h}"`);
                });

                // Patrones flexibles para consolidado (case-insensitive)
                const requiredPatterns = [
                    { pattern: /doc/i, name: 'Doc (tipo documento)' },
                    { pattern: /local/i, name: 'Local (ubicación)' },
                    { pattern: /fecha/i, name: 'Fecha' },
                    { pattern: /cod/i, name: 'Cod (código producto)' }
                ];

                console.log(`\n🔍 Buscando columnas requeridas...`);

                const foundColumns = requiredPatterns.map(req => {
                    const found = headers.find(h =>
                        h && h.toString().match(req.pattern)
                    );

                    const status = found ? '✅' : '❌';
                    console.log(`   ${status} ${req.name}: ${found ? `"${found}"` : 'NO ENCONTRADO'}`);

                    return {
                        required: req.name,
                        pattern: req.pattern.toString(),
                        found: found || null,
                        success: !!found
                    };
                });

                const allFound = foundColumns.every(col => col.success);

                if (!allFound) {
                    console.error(`\n❌ VALIDACIÓN FALLIDA - Columnas faltantes:`);
                    foundColumns.filter(c => !c.success).forEach(c => {
                        console.error(`   - ${c.required} (patrón: ${c.pattern})`);
                    });
                    return false;
                }

                console.log(`\n✅ VALIDACIÓN EXITOSA - Todas las columnas encontradas`);
            }

            console.log(`🔍 === FIN VALIDACIÓN: ${fileType} ===\n`);
            return true;

        } catch (error) {
            console.error(`❌ Error al validar Excel:`, error);
            console.error(`   Stack:`, error.stack);
            return false;
        }
    }

    /**
     * Actualiza el status visual de carga
     */
    updateStatus(fileType, status, message) {
        const statusEl = this.statusElements[fileType];
        if (!statusEl) return;

        const iconEl = statusEl.querySelector('.status-icon');
        const textEl = statusEl.querySelector('.status-text');

        statusEl.className = `file-status status-${status}`;

        if (iconEl) iconEl.textContent = this.getStatusIcon(status);
        if (textEl) textEl.textContent = message;
    }

    /**
     * Retorna icono según estado
     */
    getStatusIcon(status) {
        const icons = {
            loading: '⏳',
            success: '✅',
            error: '❌',
            waiting: '⏳'
        };
        return icons[status] || '⏳';
    }

    /**
     * Verifica si ambos archivos están listos
     */
    checkIfFilesReady() {
        const bothFilesReady = this.files.inventario !== null && this.files.consolidado !== null;

        if (bothFilesReady && this.onFilesReadyCallback) {
            this.onFilesReadyCallback(this.files);
        }

        return bothFilesReady;
    }

    /**
     * Verifica si hay archivos guardados en IndexedDB
     */
    async checkExistingFiles() {
        try {
            // Inventario
            const inventarioFile = await this.storage.getFile('inventario');
            if (inventarioFile) {
                this.files.inventario = inventarioFile;
                this.updateStatus('inventario', 'success', `✅ ${inventarioFile.filename} (guardado)`);
            }

            // Consolidado
            const consolidadoFile = await this.storage.getFile('consolidado');
            if (consolidadoFile) {
                this.files.consolidado = consolidadoFile;
                this.updateStatus('consolidado', 'success', `✅ ${consolidadoFile.filename} (guardado)`);
            }

            // Verificar si ambos están listos
            this.checkIfFilesReady();

        } catch (error) {
            console.error('Error al verificar archivos existentes:', error);
        }
    }

    /**
     * Reinicia el uploader
     */
    async reset() {
        // Limpiar archivos
        this.files = {
            inventario: null,
            consolidado: null
        };

        // Resetear inputs
        if (this.fileInputs.inventario) this.fileInputs.inventario.value = '';
        if (this.fileInputs.consolidado) this.fileInputs.consolidado.value = '';

        // Resetear status
        this.updateStatus('inventario', 'waiting', 'Esperando archivo...');
        this.updateStatus('consolidado', 'waiting', 'Esperando archivo...');

        // Limpiar IndexedDB
        await this.storage.clearAll();

        console.log('🔄 Uploader reiniciado');
    }

    /**
     * Obtiene archivos cargados
     */
    getFiles() {
        return this.files;
    }

    /**
     * Define callback para cuando ambos archivos están listos
     */
    onFilesReady(callback) {
        this.onFilesReadyCallback = callback;
    }

    /**
     * Define callback para cuando se carga un archivo
     */
    onFileUploaded(callback) {
        this.onFileUploadedCallback = callback;
    }
}

export default FileUploader;
