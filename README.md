# 📊 Dashboard de Inventario - Lomarosa

Dashboard interactivo de análisis de inventario para **Inversiones Agropecuarias Lom SAS**, desarrollado con JavaScript puro (sin frameworks).

## ✨ Características

- ✅ **100% Cliente** - Sin necesidad de backend o servidor
- 📂 **Drag & Drop** - Carga fácil de archivos Excel
- 📊 **Gráficos Interactivos** - Visualizaciones con Plotly.js
- 💾 **Persistencia Local** - IndexedDB para guardar datos
- 📱 **Responsive** - Funciona en móvil, tablet y desktop
- 🚀 **GitHub Pages Ready** - Deploy instantáneo

## 🚀 Inicio Rápido

### ⚠️ IMPORTANTE: No puedes abrir `index.html` directamente

Los navegadores modernos **bloquean módulos ES6** desde el protocolo `file://` por seguridad (CORS).

**DEBES usar un servidor local:**

### ✅ Opción 1: Archivo BAT (Windows) - MÁS FÁCIL

1. Haz **doble click** en: `INICIAR_SERVIDOR.bat`
2. Espera el mensaje "Serving HTTP..."
3. Abre tu navegador en: **http://localhost:8000**
4. **NO cierres** la ventana CMD mientras uses el dashboard

### ✅ Opción 2: Comando Python

```bash
# Abre CMD/PowerShell en la carpeta del proyecto
cd lomarosa-dashboard-js

# Python 3
python -m http.server 8000

# Abre http://localhost:8000
```

### ✅ Opción 3: Node.js

```bash
# Si tienes Node.js instalado
npx serve .

# Abre la URL que muestra (ej: http://localhost:3000)
```

### ✅ Opción 4: VS Code Live Server

1. Abre la carpeta en VS Code
2. Instala la extensión "Live Server"
3. Click derecho en `index.html` → "Open with Live Server"

---

Si tienes problemas, abre: **`COMO_ABRIR.html`** (este archivo SÍ se puede abrir directamente)

## 📂 Archivos Requeridos

El dashboard necesita **2 archivos Excel**:

### 1️⃣ Inventario (`INVENTARIO_LOMAROSA.xlsx`)
- **Hoja:** `CONSOLIDADO`
- **Columnas requeridas:**
  - `Codigo` - Código del producto
  - `Productos` - Nombre del producto
  - `Total` - Stock actual en kg
- **Formato:** Skip primeras 9 filas (encabezado en fila 10)

### 2️⃣ Histórico de Ventas (`consolidado.xlsx`)
- **Hoja:** `Sheet1`
- **Columnas requeridas:**
  - `Doc` - Tipo de documento
  - `Local` - Ubicación
  - `Fecha` - Fecha de la venta
  - `Cod` - Código del producto
  - `Kg totales2` - Kilogramos vendidos
  - `Macropieza` - Categoría del producto

## 📊 Funcionalidades del Dashboard

### KPIs Principales
- Total de productos en inventario
- Productos con stock adecuado
- Productos bajo promedio de ventas
- Stock total en kilogramos

### Análisis Completo
- Top 10 productos con sobrestock
- Top 10 productos con faltante
- Distribución del estado de inventario
- Productos con mayor rotación

### Alertas y Recomendaciones
- Productos críticos que requieren reposición
- Productos sin movimiento
- Análisis por ubicación (CAVA 1 y CAVA 2)

### Tablas Interactivas
- Inventario completo con filtros avanzados
- Búsqueda por producto
- Filtrado por estado
- Ordenamiento por columna
- Exportación de datos

## 🛠️ Estructura del Proyecto

```
lomarosa-dashboard-js/
├── index.html                 # Página principal
├── src/
│   ├── js/
│   │   ├── app.js            # Orquestador principal
│   │   ├── config.js         # Configuración
│   │   ├── dataProcessor.js  # Procesamiento de datos
│   │   ├── fileUploader.js   # Gestión de archivos
│   │   ├── storageManager.js # IndexedDB
│   │   ├── utils.js          # Utilidades
│   │   └── visualizations.js # Gráficos Plotly
│   └── css/
│       ├── main.css          # Estilos globales
│       └── dashboard.css     # Estilos del dashboard
├── package.json
├── .nojekyll                 # Para GitHub Pages
└── README.md
```

## 🌐 Deploy en GitHub Pages

1. **Crea un repositorio en GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/lomarosa-dashboard.git
   git push -u origin main
   ```

2. **Activa GitHub Pages**
   - Ve a Settings → Pages
   - Source: `main` branch
   - Folder: `/ (root)`
   - Save

3. **Accede a tu dashboard**
   - URL: `https://TU_USUARIO.github.io/lomarosa-dashboard/`

## 🔧 Tecnologías Utilizadas

- **HTML5** - Estructura
- **CSS3** - Estilos (Grid, Flexbox, Variables CSS)
- **JavaScript (ES6+)** - Lógica (Modules, Classes, async/await)
- **Plotly.js** - Gráficos interactivos
- **SheetJS (xlsx)** - Lectura de archivos Excel
- **IndexedDB** - Almacenamiento local

## 📝 Notas de Desarrollo

### Validaciones Implementadas

- ✅ Validación de extensión de archivo (.xlsx)
- ✅ Verificación de hojas requeridas
- ✅ Validación de columnas obligatorias
- ✅ Manejo de errores con mensajes claros
- ✅ Sanitización de datos (eliminar filas inválidas)

### Cálculos Principales

```javascript
// Promedio semanal de ventas
Promedio_Semanal = Total_Vendido / num_semanas

// Estado del producto
Estado = Stock_Actual >= Promedio_Semanal
  ? 'Stock Adecuado'
  : 'Bajo Promedio'

// Semanas de stock disponible
Semanas_Stock = Stock_Actual / Promedio_Semanal

// Diferencia vs promedio
Diferencia = Stock_Actual - Promedio_Semanal
```

### Categorías de Stock

| Cantidad (kg) | Categoría |
|---------------|-----------|
| 0             | Sin Stock |
| ≤ 50          | Crítico   |
| ≤ 100         | Bajo      |
| > 100         | Normal    |

## 🐛 Solución de Problemas

### Los gráficos no se muestran /
- Verifica que tienes conexión a internet (CDN de Plotly)
- Revisa la consola del navegador (F12) para errores

### Los archivos no se cargan
- Asegúrate de que son archivos `.xlsx` válidos
- Verifica que tienen las hojas y columnas requeridas
- Comprueba que no están protegidos o encriptados

### IndexedDB no funciona
- Algunos navegadores bloquean IndexedDB en modo incógnito
- Verifica los permisos del navegador

## 📞 Soporte

Para reportar problemas o sugerencias, contacta al equipo de Data Science de Grupo Lom.

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**Desarrollado por el equipo de Data Science de Grupo Lom**
