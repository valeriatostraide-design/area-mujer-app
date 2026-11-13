# Área Mujer App

Aplicación de prueba para gestión de situaciones del Área Mujer.

## Stack
- React
- Vite
- Electron para Windows
- Capacitor para Android
- IndexedDB para almacenamiento local

## Requisitos
- Node.js 20+
- npm

## Instalación

```bash
npm install
npm run dev
```

## Compilar para web

```bash
npm run build
```

## Ejecutar en Electron (Windows)

```bash
npm run electron:dev
npm run electron:start
```

## Ejecutar Android con Capacitor

```bash
npx cap init
npx cap add android
npm run android:sync
npm run android:open
```

## Funcionalidades base
- Crear, editar y eliminar situaciones
- Registrar denunciante/consultante y denunciado/a
- Historial de intervenciones, tareas y alertas
- Exportación en JSON
- Impresión a PDF
- Datos locales y sin sincronización
- Módulo de lectura de documentos para detectar medidas y vencimientos

## Nota
Esta versión es una prueba con datos ficticios. El sistema no está habilitado para expedientes reales.
