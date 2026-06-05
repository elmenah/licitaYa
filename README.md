# 🔔 Alertas de Licitaciones - Mercado Público

MVP de búsqueda y monitoreo de licitaciones públicas de Chile.

## 📋 Requisitos

- Node.js 16+ ([descargar](https://nodejs.org/))
- npm (incluido con Node.js)
- VS Code (recomendado)

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
# Si tienes Git instalado:
git clone <tu-repositorio>
cd licitaciones-alerts

# O simplemente copia todos los archivos en una carpeta
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará React y Vite en la carpeta `node_modules/`

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Verás algo como:

```
  VITE v5.0.0  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 4. Abrir en el navegador

Abre [http://localhost:5173](http://localhost:5173) o presiona click en el link que aparece en la terminal.

## 📁 Estructura del proyecto

```
licitaciones-alerts/
├── src/
│   ├── App.jsx          (Componente principal)
│   ├── App.css          (Estilos)
│   ├── main.jsx         (Punto de entrada)
│   └── index.css        (Estilos globales)
├── index.html           (HTML principal)
├── package.json         (Dependencias)
├── vite.config.js       (Configuración Vite)
└── README.md            (Este archivo)
```

## 🎯 Características

### ✅ Implementadas
- 🔍 Búsqueda de licitaciones por palabra clave y estado
- 📌 Guardar búsquedas como alertas
- 💾 Almacenamiento local (localStorage)
- 🔔 Ver todas las alertas guardadas
- ⚡ Ejecutar alertas para ver nuevos resultados
- 🗑️ Eliminar alertas

### 🔄 Próximas mejoras
- 📧 Notificaciones por email
- ⏰ Verificación automática cada X horas
- 📊 Análisis y estadísticas
- 🔐 Autenticación y sincronización en la nube
- 📱 Aplicación móvil

## 🛠️ Personalización

### Cambiar el ticket de la API

En `src/App.jsx`, busca esta línea:

```javascript
const ticket = '284E47CA-E918-42F2-A657-DAE35F97A536';
```

Reemplázalo con tu propio ticket de ChileCompra.

### Modificar colores y estilos

Los colores están definidos en `src/App.css` en la sección `:root`:

```css
:root {
  --primary: #378add;      /* Azul principal */
  --secondary: #0f6e56;    /* Verde secundario */
  --danger: #a32d2d;       /* Rojo para peligro */
  /* ... más variables */
}
```

### Cambiar el puerto de desarrollo

En `vite.config.js`:

```javascript
server: {
  port: 3000,  // Cambia 5173 por el puerto que desees
  open: true
}
```

## 📦 Crear build para producción

```bash
npm run build
```

Esto genera la carpeta `dist/` lista para desplegar en un servidor.

## 🐛 Solución de problemas

### "Command not found: npm"

Node.js no está instalado. Descárgalo desde https://nodejs.org/

### "ENOENT: no such file or directory, open 'package.json'"

Asegúrate de estar en la carpeta correcta:

```bash
cd licitaciones-alerts
npm install
```

### "Port 5173 is in use"

Cambia el puerto en `vite.config.js` o mata el proceso que usa ese puerto.

### Los datos no se guardan

Verifica que el almacenamiento local del navegador esté habilitado (no está en modo incógnito).

## 📚 Recursos útiles

- [Documentación API Mercado Público](https://www.chilecompra.cl/api/)
- [Documentación React](https://react.dev/)
- [Documentación Vite](https://vitejs.dev/)

## 📝 Licencia

Libre para usar y modificar.

## ✉️ Soporte

Si tienes dudas o quieres reportar errores, contacta a través de GitHub Issues.

---

**Hecho con ❤️ para facilitar la búsqueda de licitaciones públicas**
