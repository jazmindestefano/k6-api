// Configuraciones de opciones disponibles
export const optionsConfig = {
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