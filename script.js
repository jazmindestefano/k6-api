import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Métricas
const responseTime = new Trend('response_time');
const successRate = new Rate('success_rate');
const errorCount = new Counter('errors');

// 10 usuarios virtuales durante 30 segundos
// export const options = {
//   vus: 10,
//   duration: '30s',
//   thresholds: {
//     success_rate: ['rate>0.95'],
//     response_time: ['p(95)<800'],
//   },
// };

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // sube a 10 VUs en 10 segundos
    { duration: '10s', target: 20 }, // sube de 10 a 20 VUs (pico en el segundo 20)
    { duration: '10s', target: 5 },  // baja a 5 VUs en los últimos 10 segundos
  ],
};

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
    'response is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
  });

  responseTime.add(res.timings.duration);
  successRate.add(ok);
  if (!ok) {
    errorCount.add(1);
    console.log(`❌ Status: ${res.status}, Body: ${res.body}`);
  }

  sleep(10); // Simula tiempo de espera entre requests
}