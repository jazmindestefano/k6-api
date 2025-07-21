import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Métricas básicas personalizadas
const responseTime = new Trend('response_time');
const successRate = new Rate('success_rate');
const errorCount = new Counter('errors');

// Configuraciones de opciones disponibles
const optionsConfig = {
  basic: {
    vus: 10,
    duration: '30s',
    thresholds: {
      success_rate: ['rate>0.95'],
      response_time: ['p(95)<800'],
    },
  },
  stages: {
    stages: [
      { duration: '10s', target: 10 }, // sube a 10 VUs en 10 segundos
      { duration: '10s', target: 20 }, // sube de 10 a 20 VUs (pico en el segundo 20)
      { duration: '10s', target: 5 },  // baja a 5 VUs en los últimos 10 segundos
    ],
    thresholds: {
      success_rate: ['rate>0.95'],
      response_time: ['p(95)<800'],
    },
  },
  stress: {
    stages: [
      { duration: '5s', target: 50 },  // ramp up rápido
      { duration: '20s', target: 100 }, // mantiene carga alta
      { duration: '5s', target: 0 },   // ramp down
    ],
    thresholds: {
      success_rate: ['rate>0.90'], // menos estricto para stress test
      response_time: ['p(95)<1500'],
    },
  },
};

// Selecciona la configuración basada en la variable de entorno TEST_TYPE
const testType = __ENV.TEST_TYPE || 'basic';
export const options = optionsConfig[testType] || optionsConfig.basic;

// Reemplazá esto con tu token real
const TOKEN = `Bearer ${__ENV.TOKEN}`;

export default function () {
  const url = 'https://api-gateway-dev.travelagentadmin.net/v1/search/destinations?location=Cancun';

  const headers = {
    Authorization: TOKEN,
    'Content-Type': 'application/json',
  };

  const res = http.get(url, { headers });

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'response is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
  });

  // Registrar métricas
  responseTime.add(res.timings.duration);
  successRate.add(ok);
  
  if (!ok) {
    errorCount.add(1);
    console.log(`❌ Status: ${res.status}, Body: ${res.body}`);
  }

  sleep(10); // Simula tiempo de espera entre requests
}