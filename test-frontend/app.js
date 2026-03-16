const DEFAULT_BASE = 'https://test-2ugi.onrender.com';

const steps = [
  { title: 'Регистрация' },
  { title: 'Барбер' },
  { title: 'Услуга' },
  { title: 'Дата и время' },
  { title: 'Подтверждение' }
];

const fallbackBarbers = [
  { id: 1, name: 'Azamat', note: 'Classic cuts • 4.9' },
  { id: 2, name: 'Beksultan', note: 'Fade master • 4.8' },
  { id: 3, name: 'Daniyar', note: 'Beard expert • 4.7' }
];

const fallbackServices = [
  { id: 1, name: 'Classic haircut', note: '30 min • 500 KGS' },
  { id: 2, name: 'Fade haircut', note: '45 min • 700 KGS' },
  { id: 3, name: 'Beard trim', note: '20 min • 400 KGS' }
];

const fallbackTimes = ['10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '15:00'];

const state = {
  step: 0,
  registration: {
    name: '',
    phone: '',
    email: ''
  },
  barber: null,
  service: null,
  date: '',
  time: '',
  barbers: [...fallbackBarbers],
  services: [...fallbackServices],
  slots: [],
  apiOnline: false
};

const stepper = document.getElementById('stepper');
const stepElements = Array.from(document.querySelectorAll('[data-step]'));
const logEl = document.getElementById('log');
const apiBaseInput = document.getElementById('apiBase');
const apiStatus = document.getElementById('apiStatus');
const adminStatus = document.getElementById('adminStatus');
const adminOutput = document.getElementById('adminOutput');
const regError = document.getElementById('regError');

function normalizeBase(url) {
  return url.replace(/\/+$/, '');
}

function getBase() {
  return normalizeBase(apiBaseInput.value.trim());
}

function setApiStatus(message, ok = false) {
  apiStatus.textContent = message;
  apiStatus.style.color = ok ? 'var(--accent)' : 'var(--muted)';
}

function setToday(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.value) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    el.value = `${yyyy}-${mm}-${dd}`;
  }
}

async function apiRequest(path, options = {}) {
  const base = getBase();
  if (!base) throw new Error('Base URL is empty');

  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
    err.data = data;
    throw err;
  }

  return data;
}

function log(message, data) {
  const time = new Date().toLocaleTimeString();
  const payload = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  logEl.textContent = `[${time}] ${message}${payload}`;
}

function append(message, data) {
  const time = new Date().toLocaleTimeString();
  const payload = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  logEl.textContent += `\n\n[${time}] ${message}${payload}`;
}

function renderStepper() {
  stepper.innerHTML = '';
  steps.forEach((step, index) => {
    const el = document.createElement('div');
    el.className = `step ${index === state.step ? 'active' : ''}`;
    el.textContent = `${index + 1}. ${step.title}`;
    stepper.appendChild(el);
  });
}

function renderBarbers() {
  const container = document.getElementById('barberList');
  container.innerHTML = '';
  state.barbers.forEach((barber) => {
    const card = document.createElement('div');
    card.className = `select-card ${state.barber?.id === barber.id ? 'active' : ''}`;
    card.innerHTML = `<h4>${barber.name}</h4><p>${barber.note || ''}</p>`;
    card.addEventListener('click', () => {
      state.barber = barber;
      state.time = '';
      renderBarbers();
      renderTimes();
      log(`Выбран барбер: ${barber.name}`);
      if (state.date) {
        loadSlots(state.date, barber.id);
      }
    });
    container.appendChild(card);
  });
}

function renderServices() {
  const container = document.getElementById('serviceList');
  container.innerHTML = '';
  state.services.forEach((service) => {
    const card = document.createElement('div');
    card.className = `select-card ${state.service?.id === service.id ? 'active' : ''}`;
    card.innerHTML = `<h4>${service.name}</h4><p>${service.note || ''}</p>`;
    card.addEventListener('click', () => {
      state.service = service;
      renderServices();
      log(`Выбрана услуга: ${service.name}`);
    });
    container.appendChild(card);
  });
}

function renderTimes() {
  const container = document.getElementById('timeList');
  container.innerHTML = '';

  const list = state.slots.length ? state.slots.map((slot) => slot.time) : fallbackTimes;

  if (state.apiOnline && state.slots.length === 0) {
    container.innerHTML = '<div class="hint">Нет свободных слотов на выбранную дату.</div>';
    return;
  }

  list.forEach((time) => {
    const chip = document.createElement('div');
    chip.className = `time-chip ${state.time === time ? 'active' : ''}`;
    chip.textContent = time;
    chip.addEventListener('click', () => {
      state.time = time;
      renderTimes();
      log(`Выбрано время: ${time}`);
    });
    container.appendChild(chip);
  });
}

function setStep(nextStep) {
  state.step = Math.max(0, Math.min(steps.length - 1, nextStep));
  stepElements.forEach((el) => {
    const isActive = Number(el.dataset.step) === state.step;
    el.classList.toggle('hidden', !isActive);
  });
  renderStepper();
  updateSummary();
}

function updateSummary() {
  const summary = document.getElementById('summary');
  if (!summary) return;
  const lines = [
    `Имя: ${state.registration.name || '—'}`,
    `Телефон: ${state.registration.phone || '—'}`,
    `Email: ${state.registration.email || '—'}`,
    `Барбер: ${state.barber?.name || '—'}`,
    `Услуга: ${state.service?.name || '—'}`,
    `Дата: ${state.date || '—'}`,
    `Время: ${state.time || '—'}`
  ];
  summary.textContent = lines.join('\n');
}

function validateRegistration() {
  const name = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();

  state.registration = { name, phone, email };

  const phoneRegex = /^[0-9+()\-\s]{7,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let error = '';
  if (name.length < 2) {
    error = 'Имя должно быть минимум 2 символа.';
  } else if (!phoneRegex.test(phone)) {
    error = 'Неверный формат телефона.';
  } else if (email && !emailRegex.test(email)) {
    error = 'Неверный формат email.';
  }

  regError.textContent = error;
  return !error;
}

function validateStep() {
  if (state.step === 0) {
    return validateRegistration();
  }

  if (state.step === 1 && !state.barber) {
    log('Выбери барбера.');
    return false;
  }

  if (state.step === 2 && !state.service) {
    log('Выбери услугу.');
    return false;
  }

  if (state.step === 3) {
    const date = document.getElementById('bookDate').value;
    state.date = date;
    if (!date || !state.time) {
      log('Выбери дату и время.');
      return false;
    }
    if (state.apiOnline && state.slots.length > 0) {
      const slotTimes = state.slots.map((slot) => slot.time);
      if (!slotTimes.includes(state.time)) {
        log('Выбранное время отсутствует в доступных слотах.');
        return false;
      }
    }
  }

  return true;
}

async function checkApi() {
  try {
    const data = await apiRequest('/api/health');
    state.apiOnline = true;
    setApiStatus('API подключен', true);
    append('Health OK', data);
  } catch (err) {
    state.apiOnline = false;
    setApiStatus('API недоступен, используется fallback', false);
    append(err.message, err.data || err);
  }
}

async function loadBarbers() {
  if (!state.apiOnline) {
    state.barbers = [...fallbackBarbers];
    renderBarbers();
    return;
  }

  try {
    const data = await apiRequest('/api/barbers');
    state.barbers = data.map((b) => ({
      id: b.id,
      name: b.name,
      note: 'Available'
    }));
    renderBarbers();
    log('Барберы загружены из API', data);
  } catch (err) {
    state.barbers = [...fallbackBarbers];
    renderBarbers();
    append('Ошибка загрузки барберов, fallback', err.data || err);
  }
}

async function loadServices() {
  if (!state.apiOnline) {
    state.services = [...fallbackServices];
    renderServices();
    return;
  }

  try {
    const data = await apiRequest('/api/services');
    state.services = data.map((s) => ({
      id: s.id,
      name: s.name,
      note: `${s.duration_minutes || s.durationMinutes} мин • ${s.price} KGS`
    }));
    renderServices();
    log('Услуги загружены из API', data);
  } catch (err) {
    state.services = [...fallbackServices];
    renderServices();
    append('Ошибка загрузки услуг, fallback', err.data || err);
  }
}

async function loadSlots(date, barberId) {
  state.slots = [];
  if (!date || !barberId) {
    renderTimes();
    return;
  }

  if (!state.apiOnline) {
    renderTimes();
    return;
  }

  try {
    const params = new URLSearchParams({ date, barberId: String(barberId) });
    const data = await apiRequest(`/api/slots?${params.toString()}`);
    state.slots = data;
    renderTimes();
    log('Слоты загружены', data);
  } catch (err) {
    state.slots = [];
    renderTimes();
    append('Ошибка загрузки слотов', err.data || err);
  }
}

function getToken() {
  return localStorage.getItem('adminToken');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('adminToken', token);
  } else {
    localStorage.removeItem('adminToken');
  }
  updateAdminStatus();
}

function updateAdminStatus() {
  const token = getToken();
  adminStatus.textContent = token ? 'Токен установлен' : 'Токен не установлен';
}

function tokenHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminLogin() {
  const username = document.getElementById('adminUser').value.trim();
  const password = document.getElementById('adminPass').value;
  if (!username || !password) {
    append('Введите логин и пароль админа');
    return;
  }

  try {
    const data = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setToken(data.token);
    adminOutput.textContent = JSON.stringify(data, null, 2);
    log('Админ вошёл');
  } catch (err) {
    adminOutput.textContent = JSON.stringify(err.data || err, null, 2);
    append('Ошибка логина', err.data || err);
  }
}

async function adminCreateSlots() {
  const barberId = Number(document.getElementById('adminSlotBarber').value);
  const date = document.getElementById('adminSlotDate').value;
  const timesRaw = document.getElementById('adminSlotTimes').value;

  if (!barberId || !date || !timesRaw) {
    append('Заполни barberId, дату и время');
    return;
  }

  const times = timesRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const data = await apiRequest('/api/admin/slots', {
      method: 'POST',
      headers: tokenHeader(),
      body: JSON.stringify({ barberId, date, times, status: 'available' })
    });
    adminOutput.textContent = JSON.stringify(data, null, 2);
    log('Слоты созданы');
  } catch (err) {
    adminOutput.textContent = JSON.stringify(err.data || err, null, 2);
    append('Ошибка создания слотов', err.data || err);
  }
}

async function adminLoadBookings() {
  const date = document.getElementById('adminBookingsDate').value;
  const barberId = document.getElementById('adminBookingsBarber').value.trim();

  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (barberId) params.set('barberId', barberId);

  try {
    const data = await apiRequest(`/api/admin/bookings?${params.toString()}`, {
      headers: tokenHeader()
    });
    adminOutput.textContent = JSON.stringify(data, null, 2);
    log('Брони загружены');
  } catch (err) {
    adminOutput.textContent = JSON.stringify(err.data || err, null, 2);
    append('Ошибка загрузки бронирований', err.data || err);
  }
}

async function submitBooking() {
  if (!validateStep()) return;

  if (!state.apiOnline) {
    log('API недоступен. Это только прототип.');
    return;
  }

  try {
    const data = await apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        clientName: state.registration.name,
        clientPhone: state.registration.phone,
        serviceId: state.service?.id,
        barberId: state.barber?.id,
        date: state.date,
        time: state.time
      })
    });
    log('Бронирование создано', data);
  } catch (err) {
    append('Ошибка бронирования', err.data || err);
  }
}

function setView(view) {
  const clientView = document.getElementById('clientView');
  const adminView = document.getElementById('adminView');
  const clientTab = document.getElementById('clientTab');
  const adminTab = document.getElementById('adminTab');

  if (view === 'admin') {
    clientView.classList.add('hidden');
    adminView.classList.remove('hidden');
    clientTab.classList.remove('active');
    adminTab.classList.add('active');
  } else {
    adminView.classList.add('hidden');
    clientView.classList.remove('hidden');
    adminTab.classList.remove('active');
    clientTab.classList.add('active');
  }
}

async function init() {
  const savedBase = localStorage.getItem('apiBase');
  apiBaseInput.value = savedBase || DEFAULT_BASE;

  setToday('bookDate');
  setToday('adminSlotDate');
  setToday('adminBookingsDate');

  renderStepper();
  renderBarbers();
  renderServices();
  renderTimes();
  setStep(0);
  updateAdminStatus();

  await checkApi();
  await loadBarbers();
  await loadServices();

  log('Готово. Начни с регистрации.');

  document.getElementById('saveBase').addEventListener('click', async () => {
    const base = normalizeBase(apiBaseInput.value.trim());
    if (!base) {
      setApiStatus('Введите базовый URL');
      return;
    }
    localStorage.setItem('apiBase', base);
    await checkApi();
    await loadBarbers();
    await loadServices();
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (!validateStep()) return;
    setStep(state.step + 1);
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    setStep(state.step - 1);
  });

  document.getElementById('confirmBtn').addEventListener('click', submitBooking);

  document.getElementById('bookDate').addEventListener('change', (e) => {
    state.date = e.target.value;
    updateSummary();
    if (state.barber?.id) {
      loadSlots(state.date, state.barber.id);
    }
  });

  document.getElementById('clientTab').addEventListener('click', () => setView('client'));
  document.getElementById('adminTab').addEventListener('click', () => setView('admin'));

  document.getElementById('loginBtn').addEventListener('click', adminLogin);
  document.getElementById('createSlots').addEventListener('click', adminCreateSlots);
  document.getElementById('loadBookings').addEventListener('click', adminLoadBookings);
}

init();
