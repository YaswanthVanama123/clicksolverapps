import http from 'k6/http';
import { check, sleep } from 'k6';

const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJpYXQiOjE3NDM4MzE2NDMsImV4cCI6MjE3NTgzMTY0M30.7DhT5fbeUPbP8dbL8-Kzb7BW7UksooywbFb-aVQj4IY'; // Replace with your actual JWT token

export const options = {
  vus: 50,           // 50 virtual users
  duration: '30s',   // run the test for 30 seconds
};

export default function () {
  const url = 'https://backend.clicksolver.com/api/workers-nearby';

  const payload = JSON.stringify({
    area: 'MG Road',
    city: 'Hyderabad',
    pincode: '500081',
    alternateName: 'John Doe',
    alternatePhoneNumber: '9876543210',
    serviceBooked: [
        {
          "url": "https://i.postimg.cc/KvvVMjkH/7188a8c8-4f4c-4f46-9665-5f83c3d7b77b.webp",
          "cost": 49,
          "quantity": 1,
          "description": "Restore the convenience of your kitchen with our Microwave Repairing service. Our skilled technicians will troubleshoot and repair any issues to get your microwave back in working order",
          "serviceName": "microwave technician Inspection",
          "originalCost": 49,
          "main_service_id": 25
        }
      ],
    discount: 10,
    tipAmount: 50,
    offer: {
      code: 'NEW100',
      amount: 100,
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response is not empty': (r) => !!r.body,
  });

  sleep(1); // simulate user wait
}
