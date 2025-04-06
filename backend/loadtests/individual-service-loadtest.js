import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '30s',   // run for 30 seconds
};

// Replace this with an actual CS token if authorization is required
const CS_TOKEN = 'your-auth-token-if-needed'; // Remove this line if no token needed

export default function () {
  const url = 'http://52.66.232.77/api/individual/service';

  const serviceObject = {
    // Replace these with actual fields your backend expects
    service_name: 'AC Repair',
    user_id: 1,
    location: 'Vijayawada',
    description: 'Need quick AC repair at home.',
    preferred_time: '2025-04-05T10:00:00',
  };

  const payload = JSON.stringify({ serviceObject: 'Electrician Services' });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      // Uncomment the line below if your endpoint needs authentication
      // Authorization: `Bearer ${CS_TOKEN}`,
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is not empty': (r) => r.body && r.body.length > 0,
  });

  sleep(1); // simulate user delay before next request
}
