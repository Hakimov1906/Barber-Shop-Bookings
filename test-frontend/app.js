const DEFAULT_BASE = 'https://test-2ugi.onrender.com';
const fallbackBarbers = [
  { id: 1, name: 'Azamat' },
  { id: 2, name: 'Beksultan' },
  { id: 3, name: 'Daniyar' }
];
const fallbackServices = [
  { id: 1, name: 'Classic haircut', duration: 30, price: 500 },
  { id: 2, name: 'Fade haircut', duration: 45, price: 700 },
  { id: 3, name: 'Beard trim', duration: 20, price: 400 }
];
const fallbackTimes = ['10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '15:00'];

const state = {
  apiOnline: false,
  user: null,
  barbers: [...fallbackBarbers],
  services: [...fallbackServices],
  slots: [],
  selectedBarber: null,
  selectedService: null,
  selectedTime: ''
};

const apiStatus = document.getElementById('apiStatus');
const authMessage = document.getElementById('authMessage');
const bookingNote = document.getElementById('bookingNote');
const bookingBtn = document.getElementById('bookingBtn');

function normalizeBase(url) {
  return url.replace(/\/+$/, '');
}

function getBase() {
  return normalizeBase(document.getElementById('apiBase').value.trim());
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
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
    error.data = data;
    throw error;
  }

  return data;
}

function setApiStatus(message, ok = false) {
  apiStatus.textContent = `API: ${message}`;
  apiStatus.style.color = ok ? 'var(--success)' : 'var(--muted)';
}

function setAuthMessage(message, ok = false) {
  authMessage.textContent = message;
  authMessage.className = `auth-message ${ok ? 'ok' : 'error'}`;
}

function setToday() {
  const dateEl = document.getElementById('bookingDate');
  if (!dateEl.value) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    dateEl.value = `${yyyy}-${mm}-${dd}`;
  }
}

function updateBookingState() {
  const enabled = Boolean(state.user);
  bookingBtn.disabled = !enabled;
  bookingNote.textContent = enabled
    ? 'Выберите параметры и подтвердите запись.'
    : 'Сначала зарегистрируйтесь или войдите.';
}

function renderBarbers() {
  const select = document.getElementById('barberSelect');
  select.innerHTML = '';
  state.barbers.forEach((barber) => {
    const opt = document.createElement('option');
    opt.value = barber.id;
    opt.textContent = barber.name;
    select.appendChild(opt);
  });
  state.selectedBarber = Number(select.value);
}

function renderServices() {
  const select = document.getElementById('serviceSelect');
  select.innerHTML = '';
  state.services.forEach((service) => {
    const opt = document.createElement('option');
    opt.value = service.id;
    opt.textContent = `${service.name} · ${service.duration} мин · ${service.price} KGS`;
    select.appendChild(opt);
  });
  state.selectedService = Number(select.value);
}

function renderTimes() {
  const container = document.getElementById('timeList');
  container.innerHTML = '';
  const times = state.slots.length
    ? state.slots.map((slot) => slot.time)
    : fallbackTimes;

  times.forEach((time) => {
    const chip = document.createElement('div');
    chip.className = `time-chip ${state.selectedTime === time ? 'active' : ''}`;
    chip.textContent = time;
    chip.addEventListener('click', () => {
      state.selectedTime = time;
      renderTimes();
    });
    container.appendChild(chip);
  });
}

async function checkApi() {
  try {
    await apiRequest('/api/health');
    state.apiOnline = true;
    setApiStatus('подключен', true);
  } catch (err) {
    state.apiOnline = false;
    setApiStatus('недоступен', false);
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
    state.barbers = data.map((b) => ({ id: b.id, name: b.name }));
  } catch (err) {
    state.barbers = [...fallbackBarbers];
  }
  renderBarbers();
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
      duration: s.duration_minutes,
      price: s.price
    }));
  } catch (err) {
    state.services = [...fallbackServices];
  }
  renderServices();
}

async function loadSlots() {
  const date = document.getElementById('bookingDate').value;
  const barberId = state.selectedBarber;
  if (!date || !barberId || !state.apiOnline) {
    state.slots = [];
    renderTimes();
    return;
  }

  try {
    const params = new URLSearchParams({ date, barberId: String(barberId) });
    const data = await apiRequest(`/api/slots?${params.toString()}`);
    state.slots = data;
  } catch (err) {
    state.slots = [];
  }
  renderTimes();
}

function setAuthTab(tab) {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const tabRegister = document.getElementById('tabRegister');
  const tabLogin = document.getElementById('tabLogin');
  const authTitle = document.getElementById('authTitle');

  if (tab === 'login') {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    tabRegister.classList.remove('active');
    tabLogin.classList.add('active');
    authTitle.textContent = 'Вход';
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    authTitle.textContent = 'Регистрация';
  }
  setAuthMessage('');
}

async function registerUser() {
  const fullName = document.getElementById('regName').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!fullName || !phone || !email || !password) {
    setAuthMessage('Заполните все поля регистрации.');
    return;
  }

  if (!state.apiOnline) {
    setAuthMessage('API недоступен. Подключение не выполнено.');
    return;
  }

  try {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, phone, email, password })
    });

    state.user = data.user;
    setAuthMessage(`Аккаунт создан: ${data.user.email}`, true);
    updateBookingState();
  } catch (err) {
    const message = err.data?.error || 'Ошибка регистрации';
    setAuthMessage(message);
  }
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    setAuthMessage('Введите email и пароль.');
    return;
  }

  if (!state.apiOnline) {
    setAuthMessage('API недоступен. Подключение не выполнено.');
    return;
  }

  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    state.user = data.user;
    setAuthMessage(`Добро пожаловать, ${data.user.fullName}`, true);
    updateBookingState();
  } catch (err) {
    const message = err.data?.error || 'Ошибка входа';
    setAuthMessage(message);
  }
}

async function submitBooking() {
  if (!state.user) {
    setAuthMessage('Сначала войдите или зарегистрируйтесь.');
    return;
  }

  const date = document.getElementById('bookingDate').value;
  const time = state.selectedTime;

  if (!date || !time || !state.selectedBarber || !state.selectedService) {
    setAuthMessage('Заполните все поля бронирования.');
    return;
  }

  if (!state.apiOnline) {
    setAuthMessage('API недоступен.');
    return;
  }

  try {
    const data = await apiRequest('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        clientName: state.user.fullName || state.user.full_name || 'Client',
        clientPhone: state.user.phone || state.user.phone_number || state.user.phone,
        serviceId: state.selectedService,
        barberId: state.selectedBarber,
        date,
        time
      })
    });

    setAuthMessage(`Бронирование создано (#${data.id})`, true);
  } catch (err) {
    const message = err.data?.error || 'Ошибка бронирования';
    setAuthMessage(message);
  }
}

async function init() {
  const savedBase = localStorage.getItem('apiBase');
  document.getElementById('apiBase').value = savedBase || DEFAULT_BASE;

  setToday();
  await checkApi();
  await loadBarbers();
  await loadServices();
  await loadSlots();
  renderTimes();
  updateBookingState();

  document.getElementById('tabRegister').addEventListener('click', () => setAuthTab('register'));
  document.getElementById('tabLogin').addEventListener('click', () => setAuthTab('login'));
  document.getElementById('registerBtn').addEventListener('click', registerUser);
  document.getElementById('loginBtn').addEventListener('click', loginUser);
  document.getElementById('bookingBtn').addEventListener('click', submitBooking);

  document.getElementById('saveBase').addEventListener('click', async () => {
    const base = normalizeBase(getBase());
    if (!base) {
      setApiStatus('не указан', false);
      return;
    }
    localStorage.setItem('apiBase', base);
    await checkApi();
    await loadBarbers();
    await loadServices();
    await loadSlots();
  });

  document.getElementById('barberSelect').addEventListener('change', (e) => {
    state.selectedBarber = Number(e.target.value);
    loadSlots();
  });

  document.getElementById('serviceSelect').addEventListener('change', (e) => {
    state.selectedService = Number(e.target.value);
  });

  document.getElementById('bookingDate').addEventListener('change', () => {
    loadSlots();
  });
}

init();

