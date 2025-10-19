# 🚀 Instrucciones de Uso - Dashboard Lomarosa

## 📋 Pasos para Usar el Dashboard

### 1. Abrir el Dashboard

**Opción A: Directamente en el navegador**
- Navega a la carpeta del proyecto
- Haz doble click en `index.html`
- El dashboard se abrirá en tu navegador

**Opción B: Con servidor local (recomendado)**
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx serve .

# Luego abre: http://localhost:8000
```

### 2. Cargar Archivos Excel

El dashboard requiere **2 archivos Excel**:

#### 📄 Archivo 1: INVENTARIO_LOMAROSA.xlsx
- **Arrastra** o **selecciona** el archivo en la primera zona de carga
- Debe contener la hoja: `CONSOLIDADO`
- Columnas requeridas:
  - `Codigo` (código del producto)
  - `Productos` (nombre del producto)
  - `Total` (stock actual en kg)

#### 📊 Archivo 2: consolidado.xlsx
- **Arrastra** o **selecciona** el archivo en la segunda zona de carga
- Debe contener la hoja: `Sheet1`
- Columnas requeridas:
  - `Doc` (tipo de documento)
  - `Local` (ubicación)
  - `Fecha` (fecha de la venta)
  - `Cod` (código del producto)
  - `Kg totales2` (kilogramos vendidos)
  - `Macropieza` (categoría del producto)

### 3. Generar Dashboard

- Una vez ambos archivos estén cargados (verás ✅ verde)
- Haz click en el botón **"🚀 Generar Dashboard"**
- Espera unos segundos mientras se procesan los datos
- El dashboard se generará automáticamente

### 4. Explorar el Dashboard

El dashboard incluye:

#### 📈 KPIs Principales
- Total de productos
- Stock adecuado
- Productos bajo promedio
- Stock total en kg

#### 📊 Gráficos Interactivos
- **Sobrestock**: Top 10 productos con mayor exceso
- **Faltante**: Top 10 productos con mayor déficit
- **Distribución**: Estado del inventario (pie chart)
- **Rotación**: Productos más vendidos

#### ⚠️ Alertas Críticas
- Productos que requieren atención inmediata
- Déficit vs promedio de ventas

#### 📋 Resumen Ejecutivo
- Productos sin movimiento
- Productos críticos
- Recomendaciones

#### 📦 Tablas Detalladas
- Productos críticos con filtros
- Inventario completo
- Análisis por ubicación (CAVA 1 y CAVA 2)

### 5. Actualizar Datos

Para actualizar con nuevos archivos:
- Haz click en **"🔄 Reiniciar"**
- Carga los nuevos archivos Excel
- Genera el dashboard nuevamente

## 💾 Persistencia de Datos

- Los datos se guardan automáticamente en **IndexedDB**
- Al volver a abrir el dashboard, preguntará si quieres cargar los datos guardados
- Los datos persisten entre sesiones del navegador

## ❓ Solución de Problemas

### Los archivos no se cargan
- Verifica que sean archivos `.xlsx` válidos
- Asegúrate de que tengan las hojas y columnas correctas
- Revisa que no estén protegidos o dañados

### Los gráficos no se muestran
- Asegúrate de tener conexión a internet (CDN de Plotly)
- Revisa la consola del navegador (F12) para errores
- Intenta recargar la página

### IndexedDB no funciona
- Algunos navegadores bloquean IndexedDB en modo incógnito
- Verifica los permisos del navegador
- Intenta en un navegador diferente

### Error al procesar datos
- Verifica que los archivos tengan el formato correcto
- Asegúrate de que las columnas tengan datos válidos
- Revisa la consola (F12) para más detalles del error

## 🌐 Deploy en GitHub Pages

1. Crea un repositorio en GitHub
2. Sube todos los archivos
3. Ve a Settings → Pages
4. Source: main branch, / (root)
5. Save
6. Tu dashboard estará en: `https://TU_USUARIO.github.io/lomarosa-dashboard/`

## 📞 Soporte

Para reportar problemas o sugerencias:
- Contacta al equipo de Data Science de Grupo Lom
- Abre un issue en el repositorio de GitHub

---

**Desarrollado con ❤️ por el equipo de Data Science de Grupo Lom**
