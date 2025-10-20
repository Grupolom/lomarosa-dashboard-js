/**
 * Storage Manager - Gestión de IndexedDB
 * Maneja la persistencia de archivos Excel y datos procesados
 */

export class StorageManager {
    constructor() {
        this.db = null;
        this.dbName = 'LomarosaDashboard';
        this.version = 2;
    }

    /**
     * Inicializa IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado correctamente');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear object stores si no existen
                if (!db.objectStoreNames.contains('inventario')) {
                    db.createObjectStore('inventario', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('consolidado')) {
                    db.createObjectStore('consolidado', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('processed')) {
                    db.createObjectStore('processed', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'id' });
                }

                console.log('✅ Object stores creados');
            };
        });
    }

    /**
     * Guarda un archivo Excel
     */
    async saveFile(fileType, arrayBuffer, filename) {
        try {
            const transaction = this.db.transaction([fileType], 'readwrite');
            const store = transaction.objectStore(fileType);

            await store.put({
                id: fileType,
                data: arrayBuffer,
                filename: filename,
                timestamp: new Date().toISOString()
            });

            console.log(`✅ Archivo ${fileType} guardado: ${filename}`);
            return true;
        } catch (error) {
            console.error(`Error al guardar archivo ${fileType}:`, error);
            return false;
        }
    }

    /**
     * NUEVO: Guarda el archivo Excel RAW completo (con todas las hojas)
     */
    async saveRawExcelFile(fileType, arrayBuffer, filename) {
        try {
            const transaction = this.db.transaction([fileType], 'readwrite');
            const store = transaction.objectStore(fileType);
            
            await store.put({
                id: `${fileType}_raw`,
                data: arrayBuffer,
                filename: filename,
                timestamp: new Date().toISOString()
            });
            
            console.log(`✅ Excel RAW completo guardado: ${filename}`);
            return true;
        } catch (error) {
            console.error(`Error al guardar Excel RAW ${fileType}:`, error);
            return false;
        }
    }

    /**
     * NUEVO: Obtiene el archivo Excel RAW completo
     */
    async getRawExcelFile(fileType) {
        try {
            const transaction = this.db.transaction([fileType], 'readonly');
            const store = transaction.objectStore(fileType);
            const request = store.get(`${fileType}_raw`);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error al obtener Excel RAW ${fileType}:`, error);
            return null;
        }
    }

    /**
     * Obtiene un archivo guardado
     */
    async getFile(fileType) {
        try {
            const transaction = this.db.transaction([fileType], 'readonly');
            const store = transaction.objectStore(fileType);
            const request = store.get(fileType);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error al obtener archivo ${fileType}:`, error);
            return null;
        }
    }

    /**
     * Guarda datos procesados
     */
    async saveProcessedData(data) {
        try {
            const transaction = this.db.transaction(['processed'], 'readwrite');
            const store = transaction.objectStore('processed');

            await store.put({
                id: 'processed',
                data: data,
                timestamp: new Date().toISOString()
            });

            console.log('✅ Datos procesados guardados');
            return true;
        } catch (error) {
            console.error('Error al guardar datos procesados:', error);
            return false;
        }
    }

    /**
     * Obtiene datos procesados
     */
    async getProcessedData() {
        try {
            const transaction = this.db.transaction(['processed'], 'readonly');
            const store = transaction.objectStore('processed');
            const request = store.get('processed');

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result;
                    resolve(result ? result.data : null);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error al obtener datos procesados:', error);
            return null;
        }
    }

    /**
     * Guarda metadata
     */
    async saveMetadata(metadata) {
        try {
            const transaction = this.db.transaction(['metadata'], 'readwrite');
            const store = transaction.objectStore('metadata');

            await store.put({
                id: 'metadata',
                ...metadata
            });

            console.log('✅ Metadata guardada');
            return true;
        } catch (error) {
            console.error('Error al guardar metadata:', error);
            return false;
        }
    }

    /**
     * Obtiene metadata
     */
    async getMetadata() {
        try {
            const transaction = this.db.transaction(['metadata'], 'readonly');
            const store = transaction.objectStore('metadata');
            const request = store.get('metadata');

            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Error al obtener metadata:', error);
            return null;
        }
    }

    /**
     * Limpia todos los datos
     */
    async clearAll() {
        try {
            const storeNames = ['inventario', 'consolidado', 'processed', 'metadata'];
            
            for (const storeName of storeNames) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
            }

            console.log('✅ Todos los datos eliminados');
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    }
}

export default StorageManager;
