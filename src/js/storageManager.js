/**
 * Storage Manager - Gestión de IndexedDB para persistencia local
 */

import CONFIG from './config.js';

export class StorageManager {
    constructor() {
        this.dbName = CONFIG.DB_NAME;
        this.dbVersion = CONFIG.DB_VERSION;
        this.db = null;
    }

    /**
     * Inicializa la base de datos IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object stores si no existen
                if (!db.objectStoreNames.contains(CONFIG.STORE_INVENTARIO)) {
                    db.createObjectStore(CONFIG.STORE_INVENTARIO, { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(CONFIG.STORE_CONSOLIDADO)) {
                    db.createObjectStore(CONFIG.STORE_CONSOLIDADO, { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains(CONFIG.STORE_PROCESSED)) {
                    db.createObjectStore(CONFIG.STORE_PROCESSED, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(CONFIG.STORE_METADATA)) {
                    db.createObjectStore(CONFIG.STORE_METADATA, { keyPath: 'key' });
                }

                console.log('🗄️ Object stores creados en IndexedDB');
            };
        });
    }

    /**
     * Guarda datos en un store
     * @param {string} storeName - Nombre del store
     * @param {any} data - Datos a guardar
     * @param {string} key - Clave (opcional, para stores con keyPath)
     */
    async saveData(storeName, data, key = null) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            const dataToSave = key ? { key, data, timestamp: Date.now() } : { data, timestamp: Date.now() };
            const request = store.put(dataToSave);

            request.onsuccess = () => {
                console.log(`✅ Datos guardados en ${storeName}`);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error(`❌ Error al guardar en ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtiene datos de un store
     * @param {string} storeName - Nombre del store
     * @param {string|number} key - Clave del dato (opcional)
     */
    async getData(storeName, key = null) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            let request;

            if (key) {
                request = store.get(key);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                const result = request.result;

                if (key && result) {
                    resolve(result.data);
                } else if (!key && result && result.length > 0) {
                    resolve(result.map(item => item.data));
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error(`❌ Error al leer ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Verifica si existen datos en un store
     * @param {string} storeName - Nombre del store
     * @param {string} key - Clave específica (opcional)
     */
    async checkIfDataExists(storeName, key = null) {
        const data = await this.getData(storeName, key);
        return data !== null && data !== undefined;
    }

    /**
     * Elimina datos de un store
     * @param {string} storeName - Nombre del store
     * @param {string|number} key - Clave del dato (opcional, si no se provee borra todo)
     */
    async deleteData(storeName, key = null) {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            let request;

            if (key) {
                request = store.delete(key);
            } else {
                request = store.clear();
            }

            request.onsuccess = () => {
                console.log(`🗑️ Datos eliminados de ${storeName}`);
                resolve();
            };

            request.onerror = () => {
                console.error(`❌ Error al eliminar de ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Limpia todos los datos de la base de datos
     */
    async clearAll() {
        if (!this.db) {
            await this.init();
        }

        const storeNames = [
            CONFIG.STORE_INVENTARIO,
            CONFIG.STORE_CONSOLIDADO,
            CONFIG.STORE_PROCESSED,
            CONFIG.STORE_METADATA
        ];

        for (const storeName of storeNames) {
            await this.deleteData(storeName);
        }

        console.log('🗑️ Todos los datos fueron eliminados');
    }

    /**
     * Guarda archivo Excel en IndexedDB
     * @param {string} fileType - 'inventario' o 'consolidado'
     * @param {ArrayBuffer} arrayBuffer - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     */
    async saveFile(fileType, arrayBuffer, filename) {
        const storeName = fileType === 'inventario' ? CONFIG.STORE_INVENTARIO : CONFIG.STORE_CONSOLIDADO;

        // Convertir ArrayBuffer a Base64 para almacenamiento
        const base64 = this._arrayBufferToBase64(arrayBuffer);

        const fileData = {
            filename,
            data: base64,
            uploadedAt: new Date().toISOString()
        };

        await this.deleteData(storeName); // Limpiar datos anteriores
        return await this.saveData(storeName, fileData);
    }

    /**
     * Obtiene archivo Excel de IndexedDB
     * @param {string} fileType - 'inventario' o 'consolidado'
     */
    async getFile(fileType) {
        const storeName = fileType === 'inventario' ? CONFIG.STORE_INVENTARIO : CONFIG.STORE_CONSOLIDADO;
        const data = await this.getData(storeName);

        if (!data || data.length === 0) {
            return null;
        }

        const fileData = data[0];

        // Convertir Base64 de vuelta a ArrayBuffer
        const arrayBuffer = this._base64ToArrayBuffer(fileData.data);

        return {
            arrayBuffer,
            filename: fileData.filename,
            uploadedAt: fileData.uploadedAt
        };
    }

    /**
     * Guarda datos procesados
     * @param {Object} processedData - Datos procesados
     */
    async saveProcessedData(processedData) {
        return await this.saveData(CONFIG.STORE_PROCESSED, processedData, 'main');
    }

    /**
     * Obtiene datos procesados
     */
    async getProcessedData() {
        return await this.getData(CONFIG.STORE_PROCESSED, 'main');
    }

    /**
     * Guarda metadata (fecha de actualización, etc.)
     * @param {Object} metadata - Metadata
     */
    async saveMetadata(metadata) {
        return await this.saveData(CONFIG.STORE_METADATA, metadata, 'main');
    }

    /**
     * Obtiene metadata
     */
    async getMetadata() {
        return await this.getData(CONFIG.STORE_METADATA, 'main');
    }

    /**
     * Convierte ArrayBuffer a Base64
     * @private
     */
    _arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;

        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        return btoa(binary);
    }

    /**
     * Convierte Base64 a ArrayBuffer
     * @private
     */
    _base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    }

    /**
     * Cierra la conexión con la base de datos
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('🔒 IndexedDB cerrado');
        }
    }
}

export default StorageManager;
