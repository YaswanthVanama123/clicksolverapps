import http from 'k6/http';
import { check, sleep } from 'k6';

// Load your CS token from environment variable or hardcode for testing
const CS_TOKEN =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE3NDM4MzE2NDMsImV4cCI6MjE3NTgzMTY0M30.7DhT5fbeUPbP8dbL8-Kzb7BW7UksooywbFb-aVQj4IY';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '30s',   // run the test for 30 seconds
};

export default function () {
  const url = 'http://52.66.232.77/api/user/track/details';
  const params = {
    headers: {
      Authorization: `Bearer ${CS_TOKEN}`,
    },
  };

  const res = http.get(url, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 800ms': (r) => r.timings.duration < 800,
  });

  sleep(1); // simulate user wait time before next request
}
