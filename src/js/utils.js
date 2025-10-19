/**
 * Utilidades - Funciones auxiliares para el dashboard
 */

/**
 * Formatea un número con separadores de miles
 * @param {number} num - Número a formatear
 * @param {number} decimales - Cantidad de decimales
 * @returns {string} - Número formateado
 */
export function formatNumber(num, decimales = 0) {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }
    return num.toLocaleString('es-CO', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });
}

/**
 * Convierte fecha serial de Excel a objeto Date
 * Excel guarda fechas como números seriales desde 1900-01-01
 * @param {number} serial - Número serial de Excel
 * @returns {Date} - Objeto Date
 */
export function parseExcelDate(serial) {
    if (typeof serial === 'object' && serial instanceof Date) {
        return serial;
    }

    if (typeof serial === 'string') {
        return new Date(serial);
    }

    // Excel epoch: 1899-12-30 (no 1900-01-01 debido a bug histórico)
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

/**
 * Compara dos fechas
 * @param {Date} d1 - Primera fecha
 * @param {Date} d2 - Segunda fecha
 * @returns {number} - Diferencia en días
 */
export function dateDiffInDays(d1, d2) {
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Formatea fecha a string legible
 * @param {Date} date - Fecha
 * @returns {string} - Fecha formateada (DD/MM/YYYY)
 */
export function formatDate(date) {
    if (!date || !(date instanceof Date)) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Formatea fecha y hora
 * @param {Date} date - Fecha
 * @returns {string} - Fecha y hora formateadas
 */
export function formatDateTime(date) {
    if (!date || !(date instanceof Date)) return 'N/A';

    const dateStr = formatDate(date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * Convierte string a número, manejando errores
 * @param {any} value - Valor a convertir
 * @returns {number|null} - Número o null si no es válido
 */
export function toNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
}

/**
 * Normaliza string: trim + uppercase
 * @param {string} str - String a normalizar
 * @returns {string} - String normalizado
 */
export function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().toUpperCase();
}

/**
 * Redondea número a n decimales
 * @param {number} num - Número
 * @param {number} decimales - Decimales
 * @returns {number} - Número redondeado
 */
export function round(num, decimales = 1) {
    if (num === null || num === undefined || isNaN(num)) {
        return 0;
    }
    const factor = Math.pow(10, decimales);
    return Math.round(num * factor) / factor;
}

/**
 * Calcula suma de un array
 * @param {Array} arr - Array de números
 * @returns {number} - Suma
 */
export function sum(arr) {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((acc, val) => acc + (toNumber(val) || 0), 0);
}

/**
 * Calcula promedio de un array
 * @param {Array} arr - Array de números
 * @returns {number} - Promedio
 */
export function mean(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return sum(arr) / arr.length;
}

/**
 * Encuentra valor mínimo en array
 * @param {Array} arr - Array de números
 * @returns {number} - Mínimo
 */
export function min(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Math.min(...arr.map(v => toNumber(v) || Infinity));
}

/**
 * Encuentra valor máximo en array
 * @param {Array} arr - Array de números
 * @returns {number} - Máximo
 */
export function max(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Math.max(...arr.map(v => toNumber(v) || -Infinity));
}

/**
 * Ordena array de objetos por campo
 * @param {Array} arr - Array de objetos
 * @param {string} field - Campo por el cual ordenar
 * @param {boolean} ascending - Ascendente o descendente
 * @returns {Array} - Array ordenado
 */
export function sortBy(arr, field, ascending = true) {
    if (!Array.isArray(arr)) return [];

    return [...arr].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];

        if (valA === valB) return 0;

        if (ascending) {
            return valA > valB ? 1 : -1;
        } else {
            return valA < valB ? 1 : -1;
        }
    });
}

/**
 * Agrupa array de objetos por campo
 * @param {Array} arr - Array de objetos
 * @param {string} field - Campo por el cual agrupar
 * @returns {Object} - Objeto con grupos
 */
export function groupBy(arr, field) {
    if (!Array.isArray(arr)) return {};

    return arr.reduce((groups, item) => {
        const key = item[field] || 'undefined';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Filtra valores null/undefined de un array
 * @param {Array} arr - Array
 * @returns {Array} - Array filtrado
 */
export function compact(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(item => item !== null && item !== undefined);
}

/**
 * Crea copia profunda de objeto/array
 * @param {any} obj - Objeto a copiar
 * @returns {any} - Copia profunda
 */
export function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Genera ID único
 * @returns {string} - ID único
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function (evita ejecuciones repetidas)
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Muestra notificación toast
 * @param {string} message - Mensaje
 * @param {string} type - Tipo: success, error, warning, info
 */
export function showToast(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Aquí podrías implementar un sistema de notificaciones visual
}

/**
 * Valida si un string es una fecha válida
 * @param {any} value - Valor a validar
 * @returns {boolean} - true si es fecha válida
 */
export function isValidDate(value) {
    if (value instanceof Date) {
        return !isNaN(value.getTime());
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
}

/**
 * Sanitiza nombre de archivo
 * @param {string} filename - Nombre de archivo
 * @returns {string} - Nombre sanitizado
 */
export function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
}

export default {
    formatNumber,
    parseExcelDate,
    dateDiffInDays,
    formatDate,
    formatDateTime,
    toNumber,
    normalizeString,
    round,
    sum,
    mean,
    min,
    max,
    sortBy,
    groupBy,
    compact,
    deepCopy,
    generateId,
    debounce,
    showToast,
    isValidDate,
    sanitizeFilename
};
