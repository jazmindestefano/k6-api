# Documentación de Pruebas de Carga con K6

Análisis por IA

## Resumen Ejecutivo

Este documento describe la implementación de pruebas de carga y estrés utilizando K6 para evaluar el rendimiento, la escalabilidad y la resistencia de la API. El script de prueba simula diferentes patrones de tráfico y escenarios de usuario, recopilando métricas detalladas para identificar cuellos de botella y establecer umbrales de rendimiento.

## Características Implementadas

### Escenarios de Prueba

El script implementa múltiples escenarios de prueba para simular diferentes patrones de tráfico:

1. **Carga Constante (`constant_load`)**: 
   - 50 usuarios virtuales durante 1 minuto
   - Simula tráfico estable para evaluar el rendimiento base

2. **Carga Progresiva (`ramping_load`)**: 
   - Incremento gradual de 0 a 200 usuarios
   - Evalúa cómo responde el sistema al aumento gradual de carga

3. **Prueba de Picos (`spike_test`)**: 
   - Incremento súbito de 10 a 200 solicitudes por segundo
   - Evalúa la capacidad del sistema para manejar picos de tráfico inesperados

4. **Prueba de Resistencia (`endurance_test`)**: 
   - 30 usuarios virtuales durante 10 minutos
   - Evalúa la estabilidad del sistema bajo carga sostenida

5. **Prueba de Capacidad Máxima (`stress_capacity`)**: 
   - Incremento gradual hasta 1000 usuarios virtuales
   - Identifica los límites del sistema

6. **Prueba de Punto de Ruptura (`breaking_point`)**: 
   - Incremento de tasa de llegada hasta 500 solicitudes por segundo
   - Determina el punto en que el sistema comienza a fallar

7. **Prueba de Estabilidad (`stability_test`)**: 
   - 100 solicitudes por minuto durante 5 minutos
   - Evalúa la consistencia del rendimiento bajo carga constante

8. **Prueba Geodistribuida (`geo_distributed`)**: 
   - Simula usuarios de diferentes regiones geográficas
   - Evalúa el impacto de la latencia en diferentes ubicaciones

### Flujos de Usuario Simulados

El script simula un flujo de usuario completo que incluye:

1. **Visita a la Página Principal**: Carga inicial del sitio
2. **Inicio de Sesión**: Autenticación de usuario
3. **Búsqueda de Productos**: Consulta y filtrado de productos
4. **Proceso de Checkout**: Añadir productos al carrito y completar la compra
5. **Verificación de Orden**: Confirmación del pedido realizado

### Métricas Detalladas

#### Métricas de Tiempo de Respuesta
- **Time to First Byte (TTFB)**: Tiempo hasta recibir el primer byte de respuesta
- **Time to Last Byte**: Tiempo total de descarga de la respuesta
- **Connection Time**: Tiempo para establecer la conexión TCP
- **Processing Time**: Tiempo de procesamiento en el servidor
- **Waiting Time**: Tiempo de espera antes de recibir la respuesta
- **Outlier Requests**: Solicitudes con tiempos de respuesta anormalmente altos

#### Métricas de Errores
- **Client Errors**: Errores 4xx (problemas del cliente)
- **Server Errors**: Errores 5xx (problemas del servidor)
- **Timeout Errors**: Solicitudes que exceden el tiempo máximo de espera
- **Connection Errors**: Problemas al establecer conexión
- **Errores por Endpoint**: Distribución de errores por punto de acceso

#### Métricas de Rendimiento (Throughput)
- **Requests Per Second**: Número de solicitudes procesadas por segundo
- **Bytes Received Rate**: Tasa de bytes recibidos por segundo
- **Bytes Sent Rate**: Tasa de bytes enviados por segundo
- **Data Transfer Rate**: Tasa total de transferencia de datos
- **Rendimiento por Endpoint**: Métricas específicas para cada endpoint

#### Métricas de Recursos del Sistema
- **CPU Utilization**: Uso de CPU durante la prueba
- **Memory Usage**: Consumo de memoria durante la prueba
- **Network Latency**: Latencia de red simulada

### Validaciones Avanzadas

1. **Validación de Respuestas JSON**: Verificación de la estructura y campos esperados
2. **Verificación de Integridad de Datos**: Seguimiento de datos entre solicitudes (tokens, IDs)
3. **Validación de Flujo Completo**: Verificación de la coherencia en todo el proceso de usuario

### Configuraciones Avanzadas

1. **Hooks de Setup/Teardown**: Configuración inicial y limpieza al finalizar
2. **Exportación de Resultados**: Generación de informes en múltiples formatos (HTML, JSON, TXT)
3. **Simulación de Latencia Geográfica**: Retardos basados en la región del usuario
4. **Optimización de Rendimiento**: Configuración de batch requests y reutilización de conexiones

## Umbrales de Rendimiento (Thresholds)

Los umbrales establecidos definen los criterios de éxito/fracaso de las pruebas:

### Umbrales Generales
- Duración de solicitudes: p(95) < 500ms, p(99) < 1000ms
- Tasa de fallos: < 5%
- Tasa de éxito: > 95%

### Umbrales Específicos por Escenario
- Carga constante: p(95) < 400ms
- Carga progresiva: p(95) < 600ms
- Prueba de picos: p(99) < 2000ms
- Prueba de resistencia: p(95) < 500ms, max < 5000ms
- Prueba de capacidad: p(95) < 1000ms
- Prueba de punto de ruptura: p(95) < 3000ms
- Prueba de estabilidad: p(95) < 500ms, max < 2000ms
- Prueba geodistribuida: p(95) < 800ms

### Umbrales por Grupo de Acciones
- Sesión completa: p(95) < 5000ms
- Visita a página principal: p(95) < 1000ms
- Inicio de sesión: p(95) < 1500ms
- Búsqueda de productos: p(95) < 2000ms
- Proceso de checkout: p(95) < 3000ms
- Verificación de API: p(95) < 500ms
- Verificación de orden: p(95) < 1000ms

### Umbrales de Recursos del Sistema
- Utilización de CPU: promedio < 70%, máximo < 90%
- Uso de memoria: promedio < 1500MB, máximo < 1900MB
- Latencia de red: promedio < 50ms, p(95) < 80ms

## Interpretación de Resultados

### Análisis de Rendimiento

Para interpretar los resultados de las pruebas, considere los siguientes aspectos:

1. **Tiempos de Respuesta**:
   - Valores p(95) y p(99) dentro de los umbrales establecidos
   - Identificación de outliers y su frecuencia
   - Tendencias de degradación bajo carga creciente

2. **Tasas de Error**:
   - Distribución de errores por tipo (4xx vs 5xx)
   - Endpoints con mayor tasa de errores
   - Correlación entre carga y errores

3. **Throughput**:
   - Capacidad máxima sostenible (RPS)
   - Punto de saturación donde el throughput deja de crecer
   - Relación entre throughput y tiempos de respuesta

4. **Uso de Recursos**:
   - Correlación entre uso de CPU/memoria y degradación de rendimiento
   - Identificación de cuellos de botella en recursos

### Métricas Críticas a Monitorear

- **Tiempo de Respuesta p(95)**: Indica la experiencia de la mayoría de los usuarios
- **Tasa de Error**: Debe mantenerse por debajo del 1% en producción
- **Throughput Máximo Sostenible**: Establece la capacidad real del sistema
- **Punto de Ruptura**: Define límites para planificar escalamiento

## Recomendaciones

Basado en los resultados de las pruebas, considere las siguientes acciones:

1. **Optimización de Rendimiento**:
   - Identificar y optimizar endpoints lentos
   - Implementar caching para recursos estáticos
   - Optimizar consultas a bases de datos

2. **Escalabilidad**:
   - Establecer reglas de auto-escalado basadas en métricas clave
   - Planificar capacidad para picos de tráfico esperados
   - Implementar estrategias de degradación gradual

3. **Monitoreo Continuo**:
   - Integrar pruebas de carga en el pipeline de CI/CD
   - Establecer alertas basadas en los umbrales críticos
   - Realizar pruebas periódicas de capacidad máxima

4. **Mejoras de Resiliencia**:
   - Implementar circuit breakers para servicios dependientes
   - Mejorar manejo de errores y reintentos
   - Implementar throttling para proteger servicios críticos

## Ejecución de Pruebas

Para ejecutar las pruebas de carga:

```bash
# Ejecución básica
k6 run script.js

# Ejecución con variables de entorno
k6 run -e ENVIRONMENT=production -e REGION=global script.js

# Ejecución con límite de VUs
k6 run --vus 100 --duration 5m script.js

# Ejecución con salida a archivo
k6 run script.js --out json=results.json
```

## Conclusiones

Las pruebas de carga implementadas proporcionan una visión completa del rendimiento y la escalabilidad del sistema bajo diferentes condiciones de carga. Los resultados permiten establecer líneas base de rendimiento, identificar cuellos de botella y planificar la capacidad necesaria para manejar el tráfico esperado.

El script de prueba es altamente configurable y puede adaptarse a diferentes necesidades y escenarios, permitiendo evaluar continuamente el rendimiento del sistema a medida que evoluciona.

---
