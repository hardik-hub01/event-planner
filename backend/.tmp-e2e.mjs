import 'dotenv/config';

const baseUrl = 'http://localhost:5000/api';
const email = 'qa_e2e_1775903655776@example.com';
const password = 'TestPass123!';

async function callApi(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  return {
    path,
    status: response.status,
    body: text
  };
}

const results = [];

results.push(await callApi('/health'));

const signin = await callApi('/auth/signin', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
results.push(signin);

let token;
try {
  token = JSON.parse(signin.body).token;
} catch {
  token = undefined;
}

const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
results.push(await callApi('/auth/me', { headers: authHeaders }));
results.push(await callApi('/bookings', {
  method: 'POST',
  body: JSON.stringify({
    eventCategory: 'Wedding',
    packageName: 'Gold',
    venue: 'Hall A',
    guests: 100,
    eventDate: '2026-12-10',
    totalAmount: 50000
  })
}));
results.push(await callApi('/bookings', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    eventCategory: 'Wedding',
    packageName: 'Gold',
    venue: '',
    guests: -5,
    eventDate: '',
    totalAmount: 0
  })
}));

const booking = await callApi('/bookings', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    eventCategory: 'Wedding',
    packageName: 'Gold',
    venue: 'Hall A',
    guests: 100,
    eventDate: '2026-12-10',
    totalAmount: 50000
  })
});
results.push(booking);

let bookingId;
try {
  bookingId = JSON.parse(booking.body).booking._id;
} catch {
  bookingId = undefined;
}

if (bookingId) {
  results.push(await callApi('/payments/create-intent', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bookingId, amount: 1 })
  }));
  results.push(await callApi('/payments/create-intent', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bookingId, amount: 50000 })
  }));
}

for (const result of results) {
  console.log(`STATUS ${result.status} ${result.path}`);
  console.log(result.body);
  console.log('---');
}
