import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 50,          // 50 virtual users
  duration: '30s',  // Run for 30 seconds
};

export default function () {
  const url = 'http://52.66.232.77/api/user/login';

  const payload = JSON.stringify({
    phone_number: '9392365494',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is not empty': (r) => !!r.body,
    'has token (if body is valid)': (r) => {
      try {
        const json = r.json();
        return json && json.token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
}
