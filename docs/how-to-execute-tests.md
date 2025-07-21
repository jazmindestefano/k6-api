# 🚀 Cómo Ejecutar Tests de K6

Este documento explica cómo ejecutar los diferentes tipos de tests de performance usando K6 con nuestro sistema de configuración dinámico.

## 📋 Requisitos Previos

1. **K6 instalado**: Asegúrate de tener K6 instalado en tu sistema
2. **Dependencias instaladas**: Ejecuta `npm install` para instalar `dotenv-cli`
3. **Archivo .env configurado**: Crea tu archivo `.env` con el token de autenticación

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y agrega tu token real
TOKEN=tu_token_real_aqui
```

## 🎯 Tipos de Tests Disponibles

### 1. **Basic Test** (Por defecto)
- **VUs**: 10 usuarios virtuales
- **Duración**: 30 segundos
- **Uso**: Tests básicos de funcionalidad

### 2. **Stages Test**
- **Escalado**: 10 → 20 → 5 VUs
- **Duración**: 30 segundos total (3 etapas de 10s)
- **Uso**: Tests de carga gradual

### 3. **Stress Test**
- **Escalado**: 0 → 50 → 100 → 0 VUs
- **Duración**: 30 segundos total
- **Uso**: Tests de estrés y límites

## 🛠️ Métodos de Ejecución

### Opción 1: Usando NPM Scripts (Recomendado)

> ✅ **¡Ahora es súper fácil!** Solo necesitas tener tu `.env` configurado y ejecutar:

```bash
# Test básico
npm run test:basic

# Test con escalado
npm run test:stages

# Test de estrés
npm run test:stress

# Test básico (usa configuración por defecto)
npm run test:with-token
```

#### Ejecutar con Reportes:
```bash
# Genera results.json con métricas detalladas
npm run test:report         # Test básico + reporte
npm run test:report:stages  # Test escalado + reporte
npm run test:report:stress  # Test estrés + reporte
```

### Opción 2: Comando K6 Directo

```bash
# Test básico
dotenv k6 run -e TEST_TYPE=basic script.js

# Test con escalado
dotenv k6 run -e TEST_TYPE=stages script.js

# Test de estrés
dotenv k6 run -e TEST_TYPE=stress script.js

# Sin especificar tipo (usa 'basic' por defecto)
dotenv k6 run script.js
```

### ~~Opción 3: Una Sola Línea (Windows)~~ ❌ Ya no necesario

> 🎉 **¡Ya no necesitas configurar variables manualmente!** El archivo `.env` se carga automáticamente.

## 📊 Interpretando los Resultados

### Métricas Principales:
- **`success_rate`**: Porcentaje de requests exitosos
- **`response_time`**: Tiempo de respuesta (p95)
- **`errors`**: Contador de errores

### Thresholds (Umbrales):
- **Basic/Stages**: `success_rate > 95%`, `p95 < 800ms`
- **Stress**: `success_rate > 90%`, `p95 < 1500ms` (más permisivo)

### Ejemplo de Output:
```
🚀 Ejecutando test tipo: basic
📊 Configuración: {
  "vus": 10,
  "duration": "30s",
  "thresholds": {
    "success_rate": ["rate>0.95"],
    "response_time": ["p(95)<800"]
  }
}
```

## 🔧 Personalización

### Agregar Nuevos Tipos de Test:

1. Edita `script.js` y agrega una nueva configuración en `optionsConfig`:
```javascript
smoke: {
  vus: 1,
  duration: '10s',
  thresholds: {
    success_rate: ['rate>0.99'],
    response_time: ['p(95)<500'],
  },
}
```

2. Agrega el comando correspondiente en `package.json`:
```json
"test:smoke": "k6 run -e TEST_TYPE=smoke -e TOKEN=%TOKEN% script.js"
```

## ❗ Troubleshooting

### Error: "TOKEN is not defined"
**Solución**: 
1. Verifica que existe el archivo `.env` en la raíz del proyecto
2. Asegúrate de que contiene `TOKEN=tu_token_aqui`
3. Ejecuta `npm install` para instalar `dotenv-cli`

### Error: "dotenv command not found"
**Solución**: Ejecuta `npm install` para instalar las dependencias.

### Error: "Unknown test type"
**Solución**: Verifica que el `TEST_TYPE` sea uno de: `basic`, `stages`, `stress`.

### Error: "k6 command not found"
**Solución**: Instala K6 desde [k6.io](https://k6.io/docs/getting-started/installation/)

## 🔒 Seguridad

- ✅ **El archivo `.env` está en `.gitignore`** - No se subirá al repositorio
- ✅ **Usa `.env.example`** como template para otros desarrolladores
- ✅ **Nunca hardcodees tokens** en el código

## 📁 Archivos Generados

- **`results.json`**: Reporte detallado de métricas (cuando usas comandos con `:report`)
- **Console output**: Métricas en tiempo real durante la ejecución

## 🎯 Casos de Uso Recomendados

| Tipo de Test | Cuándo Usar |
|-------------|-------------|
| **Basic** | Verificación rápida de funcionalidad |
| **Stages** | Tests de carga progresiva |
| **Stress** | Encontrar límites del sistema |
| **Con Reporte** | Análisis detallado post-ejecución |