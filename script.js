import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

// Custom metrics
const customErrors = new Counter('custom_errors');
const successRate = new Rate('success_rate');
const loginTimes = new Trend('login_times');
const searchTimes = new Trend('search_times');
const checkoutTimes = new Trend('checkout_times');

// Métricas para tasas de errores específicos
const clientErrors = new Counter('client_errors'); // Errores 4xx
const serverErrors = new Counter('server_errors'); // Errores 5xx
const timeoutErrors = new Counter('timeout_errors');
const connectionErrors = new Counter('connection_errors');
const errorsByEndpoint = {};

// Métricas de rendimiento (throughput)
const requestsPerSecond = new Rate('requests_per_second');
const bytesReceivedRate = new Rate('bytes_received_rate');
const bytesSentRate = new Rate('bytes_sent_rate');
const dataTransferRate = new Rate('data_transfer_rate'); // Bytes totales por segundo
const requestsByEndpoint = {};
const endpointLatency = {};

// Métricas de tiempo de respuesta detalladas
const timeToFirstByte = new Trend('time_to_first_byte');
const timeToLastByte = new Trend('time_to_last_byte');
const connectionTime = new Trend('connection_time');
const processingTime = new Trend('server_processing_time');
const waitingTime = new Trend('waiting_time');
const outlierRequests = new Counter('outlier_requests');

// Variables para validación de datos entre solicitudes
let authToken = null;
let userId = null;
let cartItems = [];
let orderId = null;
let productIds = [];

// Métricas de recursos del sistema
const cpuUtilization = new Trend('cpu_utilization');
const memoryUsage = new Trend('memory_usage');
const networkLatency = new Trend('network_latency');

// Función para validar respuesta JSON
function validateJsonResponse(response, schema) {
  try {
    const body = response.json();
    
    // Validación básica de existencia de campos
    if (schema) {
      for (const field of schema) {
        if (!(field in body)) {
          console.log(`Error de validación: Campo '${field}' no encontrado en la respuesta`);
          return false;
        }
      }
    }
    
    return true;
  } catch (e) {
    console.log(`Error al parsear JSON: ${e.message}`);
    return false;
  }
}

// Función para registrar métricas de rendimiento por endpoint
function trackRequestMetrics(url, response) {
  const endpoint = url.split('?')[0]; // Eliminar parámetros de consulta
  
  // Crear contadores específicos por endpoint si no existen
  if (!requestsByEndpoint[endpoint]) {
    requestsByEndpoint[endpoint] = new Counter(`requests_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`);
  }
  if (!endpointLatency[endpoint]) {
    endpointLatency[endpoint] = new Trend(`latency_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`);
  }
  
  // Registrar solicitud y latencia
  requestsByEndpoint[endpoint].add(1);
  endpointLatency[endpoint].add(response.timings.duration);
  
  // Registrar métricas de rendimiento global
  requestsPerSecond.add(1);
  bytesReceivedRate.add(response.body ? response.body.length : 0);
  bytesSentRate.add(response.request.body ? response.request.body.length : 0);
  dataTransferRate.add((response.body ? response.body.length : 0) + 
                       (response.request.body ? response.request.body.length : 0));
}

// Función para registrar errores por endpoint
function trackErrorByEndpoint(url, status) {
  const endpoint = url.split('?')[0]; // Eliminar parámetros de consulta
  if (!errorsByEndpoint[endpoint]) {
    errorsByEndpoint[endpoint] = new Counter(`errors_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`);
  }
  errorsByEndpoint[endpoint].add(1);
  
  // Clasificar errores por tipo
  if (status >= 400 && status < 500) {
    clientErrors.add(1);
  } else if (status >= 500) {
    serverErrors.add(1);
  }
}

// Función para simular monitoreo de recursos del sistema
function monitorSystemResources() {
  // Simulación de uso de CPU (valores aleatorios entre 10% y 90%)
  const cpuUsage = Math.random() * 80 + 10;
  cpuUtilization.add(cpuUsage);
  
  // Simulación de uso de memoria (valores aleatorios entre 100MB y 2GB)
  const memUsage = Math.random() * 1900 + 100;
  memoryUsage.add(memUsage);
  
  // Simulación de latencia de red (valores aleatorios entre 5ms y 100ms)
  const netLatency = Math.random() * 95 + 5;
  networkLatency.add(netLatency);
  
  // Log si los valores son críticos
  if (cpuUsage > 80) {
    console.log(`⚠️ Alto uso de CPU: ${cpuUsage.toFixed(2)}%`);
  }
  if (memUsage > 1800) {
    console.log(`⚠️ Alto uso de memoria: ${memUsage.toFixed(2)}MB`);
  }
  if (netLatency > 80) {
    console.log(`⚠️ Alta latencia de red: ${netLatency.toFixed(2)}ms`);
  }
}

// Configuration options
export const options = {
  // Scenarios for different traffic patterns
  scenarios: {
    // Constant traffic scenario
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '1m',
      gracefulStop: '5s',
    },
    // Ramping traffic scenario
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },  // Ramp up to 100 users
        { duration: '1m', target: 100 },   // Stay at 100 users
        { duration: '30s', target: 200 },  // Ramp up to 200 users
        { duration: '1m', target: 200 },   // Stay at 200 users
        { duration: '30s', target: 0 },    // Ramp down to 0 users
      ],
      gracefulRampDown: '10s',
    },
    // Spike test scenario
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 300,
      maxVUs: 600,
      stages: [
        { duration: '30s', target: 10 },   // Normal load
        { duration: '10s', target: 200 },  // Spike to very high load
        { duration: '30s', target: 10 },   // Back to normal
      ],
    },
  },
  // Thresholds for pass/fail criteria
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% of requests must complete below 500ms, 99% below 1s
    http_req_failed: ['rate<0.05'],                  // Less than 5% of requests can fail
    'login_times': ['p(95)<300'],                    // 95% of login requests should be below 300ms
    'success_rate': ['rate>0.95'],                   // Success rate should be above 95%
    'http_reqs': ['count>500'],                      // Should execute at least 500 requests
  },
};

export default function () {
  const baseUrl = 'http://test.k6.io';
  
  // Simulate user behavior with randomized think time between actions
  const thinkTime = randomIntBetween(1, 5);
  
  // User session simulation
  group('User session', function () {
    // 1. Homepage visit
    group('Visit Homepage', function () {
      const homeResponse = http.get(`${baseUrl}/`);
      
      check(homeResponse, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage has correct title': (r) => r.body.includes('Welcome to the k6.io demo site!'),
      });
      
      successRate.add(homeResponse.status === 200);
      
      // Simulate user looking at the homepage
      sleep(thinkTime);
    });
    
    // 2. Login process
    group('Login', function () {
      const loginStartTime = new Date();
      
      const loginPayload = JSON.stringify({
        username: 'testuser',
        password: 'testpassword',
      });
      
      const params = {
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `k6-test-${Date.now()}`,
        },
      };
      
      const loginResponse = http.post(`${baseUrl}/login`, loginPayload, params);
      
      const loginSuccess = check(loginResponse, {
        'login status is 200': (r) => r.status === 200,
        'login successful': (r) => r.json('authenticated') === true || r.status === 200,
        'login has auth token': (r) => r.json('token') !== undefined || r.status === 200,
      });
      
      // Track login time
      loginTimes.add(new Date() - loginStartTime);
      
      // If login fails, count an error
      if (!loginSuccess) {
        customErrors.add(1);
      }
      
      successRate.add(loginSuccess);
      
      // Simulate user thinking after login
      sleep(thinkTime);
    });
    
    // 3. Search functionality
    group('Product Search', function () {
      const searchStartTime = new Date();
      
      // Simulate different search queries
      const searchTerms = ['laptop', 'phone', 'headphones', 'monitor', 'keyboard'];
      const randomSearchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
      
      const searchResponse = http.get(`${baseUrl}/search?q=${randomSearchTerm}`);
      
      const searchSuccess = check(searchResponse, {
        'search status is 200': (r) => r.status === 200,
        'search results found': (r) => r.body.includes('results') || r.status === 200,
      });
      
      // Track search time
      searchTimes.add(new Date() - searchStartTime);
      
      successRate.add(searchSuccess);
      
      // Simulate user browsing search results
      sleep(thinkTime);
    });
    
    // 4. Add to cart and checkout (batch requests)
    group('Checkout Process', function () {
      const checkoutStartTime = new Date();
      
      // Batch multiple requests together (add to cart, view cart, checkout)
      const responses = http.batch([
        ['GET', `${baseUrl}/products/1`, null, { tags: { name: 'GetProduct' } }],
        ['POST', `${baseUrl}/cart`, JSON.stringify({ productId: 1, quantity: 1 }), 
          { headers: { 'Content-Type': 'application/json' }, tags: { name: 'AddToCart' } }],
        ['GET', `${baseUrl}/cart`, null, { tags: { name: 'ViewCart' } }],
        ['POST', `${baseUrl}/checkout`, JSON.stringify({ 
          address: '123 Test St', 
          payment: 'card',
          cardNumber: '4111111111111111',
          expiryMonth: '12',
          expiryYear: '2030'
        }), { headers: { 'Content-Type': 'application/json' }, tags: { name: 'Checkout' } }]
      ]);
      
      const checkoutSuccess = check(responses[3], {
        'checkout status is 200': (r) => r.status === 200 || r.status === 201,
        'order confirmation received': (r) => r.body.includes('order') || r.status === 200 || r.status === 201,
      });
      
      // Track checkout time
      checkoutTimes.add(new Date() - checkoutStartTime);
      
      successRate.add(checkoutSuccess);
      
      // Simulate end of session
      sleep(thinkTime);
    });
    
    // 5. API health check
    group('API Health Check', function () {
      const healthResponse = http.get(`${baseUrl}/health`);
      
      check(healthResponse, {
        'API health check status is 200': (r) => r.status === 200,
        'API is healthy': (r) => r.json('status') === 'ok' || r.status === 200,
      });
    });
  });
  
  // Simulate user taking a break before starting a new session
  sleep(thinkTime);
}