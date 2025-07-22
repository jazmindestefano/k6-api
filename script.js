import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Métricas básicas personalizadas
const responseTime = new Trend('response_time');
const successRate = new Rate('success_rate');
const errorCount = new Counter('errors');

// Importa las configuraciones
import { optionsConfig } from './configOptions.js';

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