# K6 - Modern Load Testing Tool

## Qué es K6

K6 es una herramienta de código abierto para pruebas de carga y rendimiento, diseñada para ser fácil de usar y orientada a desarrolladores. Permite crear, ejecutar y analizar pruebas de rendimiento de manera eficiente.

## Beneficios de K6

- **Basado en JavaScript**: Escribe pruebas en JavaScript/ES6, lo que facilita la adopción para desarrolladores.
- **Ligero y eficiente**: Consume pocos recursos y puede generar alta carga desde una sola máquina.
- **Orientado a desarrolladores**: Se integra con flujos de trabajo de desarrollo y CI/CD.
- **Extensible**: Permite crear módulos personalizados y extensiones.
- **Métricas avanzadas**: Proporciona análisis detallado del rendimiento.
- **Código abierto**: Gratuito y con una comunidad activa.
- **Soporte para pruebas locales y en la nube**: Flexibilidad para diferentes entornos.

## Instalación

### Windows

```powershell
# Usando Chocolatey
choco install k6

# Usando winget
winget install k6
```

### macOS

```bash
# Usando Homebrew
brew install k6
```

### Linux

```bash
# Usando apt para Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Usando yum para CentOS/RHEL
sudo yum install https://dl.k6.io/rpm/repo.rpm
sudo yum install k6
```

### Docker

```bash
docker pull grafana/k6
docker run --rm -i grafana/k6 run - <script.js
```

## Conceptos Básicos

### Estructura de un script K6

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba
export const options = {
  vus: 10,           // 10 usuarios virtuales
  duration: '30s',   // duración de 30 segundos
};

// Función principal que se ejecuta para cada usuario virtual
export default function() {
  const res = http.get('https://test.k6.io');
  
  // Verificar que la respuesta sea correcta
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

### Ejecutar una prueba

```bash
k6 run script.js
```

## Configuración de Pruebas

### Escenarios de Carga

K6 permite definir diferentes escenarios de carga:

```javascript
export const options = {
  scenarios: {
    // Carga constante
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
    },
    // Carga en rampa
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
    },
  },
};
```

### Umbrales (Thresholds)

Los umbrales permiten definir criterios de éxito/fracaso para las pruebas:

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% de solicitudes < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.05'],                  // Menos del 5% de fallos
  },
};
```

## Características Avanzadas

### Grupos

Organiza las pruebas en grupos lógicos:

```javascript
group('Homepage', function() {
  const res = http.get('https://test.k6.io/');
  check(res, { 'status is 200': (r) => r.status === 200 });
});
```

### Checks

Verifica las respuestas:

```javascript
check(response, {
  'status is 200': (r) => r.status === 200,
  'body contains welcome': (r) => r.body.includes('Welcome'),
});
```

### Métricas Personalizadas

Crea y registra métricas específicas:

```javascript
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

const myCounter = new Counter('my_counter');
const myGauge = new Gauge('my_gauge');
const myRate = new Rate('my_rate');
const myTrend = new Trend('my_trend');

export default function() {
  myCounter.add(1);
  myGauge.add(100);
  myRate.add(true);  // Éxito
  myTrend.add(42);   // Registra un valor para analizar tendencias
}
```

### Solicitudes HTTP

K6 soporta diferentes métodos HTTP:

```javascript
// GET
http.get('https://test.k6.io/');

// POST con payload
http.post('https://test.k6.io/login', JSON.stringify({
  username: 'user',
  password: 'pass'
}), {
  headers: { 'Content-Type': 'application/json' },
});

// Batch (múltiples solicitudes en paralelo)
http.batch([
  ['GET', 'https://test.k6.io/'],
  ['POST', 'https://test.k6.io/login', JSON.stringify({ username: 'user', password: 'pass' })],
]);
```

## Integración con CI/CD

### GitHub Actions

```yaml
name: Performance Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  k6_test:
    name: K6 Load Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      
      - name: Run k6 test
        uses: grafana/k6-action@v0.2.0
        with:
          filename: performance-tests/script.js
```

### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Performance Testing') {
            steps {
                sh 'docker run --rm -i grafana/k6 run - <performance-tests/script.js'
            }
        }
    }
}
```

## Visualización de Resultados

### Exportar a Prometheus + Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6 script.js
```

### Exportar a JSON

```bash
k6 run --out json=results.json script.js
```

## Buenas Prácticas

1. **Separar la configuración de la lógica**: Mantén los parámetros de configuración separados del código de prueba.
2. **Usar módulos**: Divide las pruebas en módulos reutilizables.
3. **Simular comportamiento real**: Incluye tiempos de espera y variaciones aleatorias.
4. **Monitorear recursos**: Observa el uso de CPU y memoria durante las pruebas.
5. **Incrementar gradualmente**: Comienza con cargas pequeñas y aumenta progresivamente.
6. **Probar en un entorno similar a producción**: Para obtener resultados más precisos.

## Recursos Adicionales

- [Documentación oficial de K6](https://k6.io/docs/)
- [Ejemplos de scripts](https://github.com/grafana/k6/tree/master/examples)
- [Foro de la comunidad](https://community.k6.io/)
- [Blog de K6](https://k6.io/blog/)

## Comparación con Otras Herramientas

| Característica | K6 | JMeter | Gatling | Locust |
|----------------|-----|--------|---------|--------|
| Lenguaje | JavaScript | XML/Java | Scala | Python |
| Curva de aprendizaje | Baja | Alta | Media | Baja |
| Consumo de recursos | Bajo | Alto | Medio | Medio |
| Interfaz gráfica | No (CLI) | Sí | No (CLI) | Sí (Web) |
| Extensibilidad | Alta | Alta | Media | Alta |
| Integración CI/CD | Excelente | Buena | Buena | Buena |
| Comunidad | Creciente | Grande | Mediana | Mediana |
# k6-api
