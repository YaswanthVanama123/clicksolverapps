import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '30s',   // run for 30 seconds
};

export default function () {
  const url = 'http://52.66.232.77/api/single/service';

  const serviceName = 'Two-Door Fridge Repairing'; // Replace with the actual service name to test

  const payload = JSON.stringify({ serviceName });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body is not empty': (r) => !!r.body,
  });

  sleep(1); // simulate a small delay between user requests
}
