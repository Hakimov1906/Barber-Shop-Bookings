import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

export type Lang = "kg" | "ru" | "en";

type TranslationEntry = Record<Lang, string>;
type Translations = Record<string, TranslationEntry>;
type ValueGroup = "role" | "location" | "specialty" | "productType" | "service";

const translations: Translations = {
  "nav.home": { kg: "Башкы бет", ru: "Главная", en: "Home" },
  "nav.masters": { kg: "Мастерлер", ru: "Мастера", en: "Masters" },
  "nav.shop": { kg: "Дүкөн", ru: "Магазин", en: "Shop" },
  "nav.login": { kg: "Кирүү", ru: "Войти", en: "Sign in" },
  "nav.profile": { kg: "Профиль", ru: "Профиль", en: "Profile" },
  "nav.logout": { kg: "Чыгуу", ru: "Выйти", en: "Sign out" },

  "lang.switch": { kg: "Тилди алмаштыруу", ru: "Сменить язык", en: "Change language" },

  "hero.subtitle": { kg: "Премиум салон тармагы", ru: "Сеть премиум-салонов", en: "Premium salon network" },
  "hero.title": { kg: "Ар бир сызык так", ru: "Точность в каждой линии", en: "Precision in every line" },
  "hero.desc": {
    kg: "Тажрыйбалуу мастерлер, премиум продукттар жана ишенимдүү онлайн жазылуу.",
    ru: "Опытные мастера, премиальные продукты и удобная онлайн-запись.",
    en: "Experienced masters, premium products and reliable booking.",
  },
  "hero.book": { kg: "Жазылуу", ru: "Записаться", en: "Book now" },
  "hero.shop": { kg: "Дүкөнгө өтүү", ru: "Перейти в магазин", en: "Shop" },
  "hero.locations": { kg: "3 филиал", ru: "3 филиала", en: "3 locations" },
  "hero.hours": { kg: "09:00 - 21:00", ru: "09:00 - 21:00", en: "9:00 - 21:00" },

  "masters.title": { kg: "Биздин мастерлер", ru: "Наши мастера", en: "Our masters" },
  "masters.subtitle": {
    kg: "Тажрыйбасы далилденген адистер",
    ru: "Профессионалы с подтвержденным опытом",
    en: "Professionals with proven experience",
  },
  "masters.all": { kg: "Баары", ru: "Все мастера", en: "All masters" },
  "masters.page.title": { kg: "Мастерлер", ru: "Мастера", en: "Masters" },
  "masters.page.subtitle": {
    kg: "Мастер тандап, ыңгайлуу убакытка жазылыңыз",
    ru: "Выберите мастера и удобное время",
    en: "Choose a master and book a convenient time",
  },
  "masters.specialty": { kg: "Адистик", ru: "Специализация", en: "Specialty" },
  "masters.location": { kg: "Дарек", ru: "Локация", en: "Location" },
  "masters.notfound": {
    kg: "Тандалган фильтрлер боюнча мастер табылган жок",
    ru: "По выбранным фильтрам мастера не найдены",
    en: "No masters found for the selected filters",
  },
  "masters.back": { kg: "Бардык мастерлер", ru: "Все мастера", en: "All masters" },
  "masters.notfound.single": { kg: "Мастер табылган жок", ru: "Мастер не найден", en: "Master not found" },
  "masters.backlink": { kg: "Мастерлерге кайтуу", ru: "Назад к мастерам", en: "Back to masters" },

  "filter.all": { kg: "Баары", ru: "Все", en: "All" },
  "filter.barber": { kg: "Барбер", ru: "Барбер", en: "Barber" },
  "filter.stylist": { kg: "Стилист", ru: "Стилист", en: "Stylist" },
  "filter.colorist": { kg: "Колорист", ru: "Колорист", en: "Colorist" },
  "filter.center": { kg: "Борбор", ru: "Центр", en: "Center" },
  "filter.north": { kg: "Түндүк", ru: "Север", en: "North" },
  "filter.south": { kg: "Түштүк", ru: "Юг", en: "South" },

  "master.available": { kg: "Бош", ru: "Свободен", en: "Available" },
  "master.book": { kg: "Жазылуу", ru: "Записаться", en: "Book" },
  "master.nobook": { kg: "Жеткиликсиз", ru: "Недоступен", en: "Unavailable" },
  "master.reviews": { kg: "пикир", ru: "отзывов", en: "reviews" },
  "master.portfolio": { kg: "Портфолио", ru: "Портфолио", en: "Portfolio" },
  "master.portfolio.desc": {
    kg: "Мастердин иштеринин мисалдары",
    ru: "Примеры работ мастера",
    en: "Examples of the master's work",
  },
  "master.clientreviews": { kg: "Кардарлардын пикирлери", ru: "Отзывы клиентов", en: "Client reviews" },
  "master.loading": { kg: "Жүктөлүүдө...", ru: "Загрузка...", en: "Loading..." },
  "master.reviews.loading": { kg: "Пикирлер жүктөлүүдө...", ru: "Отзывы загружаются...", en: "Loading reviews..." },
  "master.reviews.empty": { kg: "Азырынча пикир жок.", ru: "Пока нет отзывов.", en: "No reviews yet." },
  "master.review.form.title": { kg: "Пикир калтырыңыз", ru: "Оставить отзыв", en: "Leave a review" },
  "master.review.form.desc": {
    kg: "Кызматты 1ден 5ке чейин баалап, комментарий жазыңыз.",
    ru: "Оцените услугу от 1 до 5 и добавьте комментарий.",
    en: "Rate service from 1 to 5 and add your comment.",
  },
  "master.review.form.placeholder": {
    kg: "Пикириңизди жазыңыз",
    ru: "Напишите ваш отзыв",
    en: "Write your review",
  },
  "master.review.form.submit": { kg: "Пикир жөнөтүү", ru: "Отправить отзыв", en: "Submit review" },
  "master.review.signin.required": {
    kg: "Пикир калтыруу үчүн кириңиз.",
    ru: "Войдите, чтобы оставить отзыв.",
    en: "Sign in to leave a review.",
  },
  "master.review.success.title": { kg: "Пикир сакталды", ru: "Отзыв сохранен", en: "Review saved" },
  "master.review.success.desc": {
    kg: "Пикириңиз үчүн рахмат.",
    ru: "Спасибо за отзыв.",
    en: "Thanks for your feedback.",
  },
  "master.review.error.title": {
    kg: "Пикирди сактоо мүмкүн болгон жок",
    ru: "Не удалось сохранить отзыв",
    en: "Failed to save review",
  },
  "master.review.error.desc": {
    kg: "Пикирди сактоо мүмкүн болгон жок. Кайра аракет кылыңыз.",
    ru: "Не удалось сохранить отзыв. Попробуйте снова.",
    en: "Could not save your review. Please try again.",
  },

  "products.title": { kg: "Продукттар", ru: "Продукты", en: "Products" },
  "products.subtitle": {
    kg: "Чачка профессионалдык кам көрүү",
    ru: "Профессиональный уход за волосами",
    en: "Professional care for your hair",
  },
  "products.all": { kg: "Толук каталог", ru: "Полный каталог", en: "Full catalog" },
  "products.addtocart": { kg: "Себетке кошуу", ru: "В корзину", en: "Add to cart" },

  "shop.title": { kg: "Дүкөн", ru: "Магазин", en: "Shop" },
  "shop.subtitle": {
    kg: "Үй шартында кам көрүү үчүн продукттар",
    ru: "Профессиональные продукты для домашнего ухода",
    en: "Professional products for home care",
  },
  "shop.all": { kg: "Баары", ru: "Все", en: "All" },
  "shop.men": { kg: "Эркектер үчүн", ru: "Для мужчин", en: "For men" },
  "shop.women": { kg: "Аялдар үчүн", ru: "Для женщин", en: "For women" },

  "salons.title": { kg: "Биздин филиалдар", ru: "Наши салоны", en: "Our salons" },
  "salons.subtitle": {
    kg: "Ар бир райондо ыңгайлуу дарек",
    ru: "Удобные локации в разных районах",
    en: "Convenient locations in every district",
  },
  "salon.center.name": { kg: "HairLine Борбор", ru: "HairLine Центр", en: "HairLine Center" },
  "salon.north.name": { kg: "HairLine Түндүк", ru: "HairLine North", en: "HairLine North" },
  "salon.south.name": { kg: "HairLine Түштүк", ru: "HairLine South", en: "HairLine South" },
  "salon.center.address": { kg: "Чүй пр., 150", ru: "пр. Чуй, 150", en: "Chui Ave, 150" },
  "salon.north.address": { kg: "Жибек-Жолу, 42", ru: "Жибек-Жолу, 42", en: "Jibek Jolu, 42" },
  "salon.south.address": { kg: "Ахунбаев к., 98", ru: "ул. Ахунбаева, 98", en: "Akhunbaev St, 98" },

  "booking.title": { kg: "Мастерге жазылуу", ru: "Запись к мастеру", en: "Book a master" },
  "booking.selectservice": { kg: "Кызматты тандаңыз", ru: "Выберите услугу", en: "Select a service" },
  "booking.selectdate": { kg: "Күндү тандаңыз", ru: "Выберите дату", en: "Select a date" },
  "booking.selecttime": { kg: "Убакытты тандаңыз", ru: "Выберите время", en: "Select a time" },
  "booking.confirm": { kg: "Ырастоо", ru: "Подтвердить", en: "Confirm" },
  "booking.back": { kg: "Артка", ru: "Назад", en: "Back" },
  "booking.success": { kg: "Сиз ийгиликтүү жазылдыңыз", ru: "Вы успешно записаны", en: "You are booked!" },
  "booking.successtoast": { kg: "Жазылуу ырасталды", ru: "Запись подтверждена", en: "Booking confirmed" },
  "booking.close": { kg: "Жабуу", ru: "Закрыть", en: "Close" },
  "booking.pickdate": { kg: "Күндү тандаңыз", ru: "Выберите дату", en: "Pick a date" },
  "booking.signin.required.title": { kg: "Кирүү талап кылынат", ru: "Требуется вход", en: "Sign in required" },
  "booking.signin.required.desc": {
    kg: "Жазылууну аяктоо үчүн аккаунтка кириңиз.",
    ru: "Войдите, чтобы завершить запись.",
    en: "Please sign in to complete a booking.",
  },
  "booking.loading.services": { kg: "Кызматтар жүктөлүүдө...", ru: "Загрузка услуг...", en: "Loading services..." },
  "booking.loading.slots": { kg: "Убакыттар жүктөлүүдө...", ru: "Загрузка слотов...", en: "Loading slots..." },
  "booking.error.services": {
    kg: "Кызматтарды жүктөө мүмкүн болбоду.",
    ru: "Не удалось загрузить услуги. Попробуйте позже.",
    en: "Could not load services. Please try again.",
  },
  "booking.error.slots": {
    kg: "Тандалган күн үчүн убакыттарды жүктөө мүмкүн болбоду.",
    ru: "Не удалось загрузить слоты на выбранную дату.",
    en: "Failed to load slots for the selected date.",
  },
  "booking.error.create": {
    kg: "Жазылууну түзүү мүмкүн болбоду.",
    ru: "Не удалось создать запись.",
    en: "Failed to create booking.",
  },
  "booking.error.title": { kg: "Ката", ru: "Ошибка", en: "Booking failed" },
  "booking.noslots": { kg: "Бул күнгө бош убакыт жок.", ru: "На эту дату свободных слотов нет.", en: "No available slots for this date." },

  "footer.desc": {
    kg: "Ар бир сызык так. Заманбап стиль үчүн премиум сервис.",
    ru: "Точность в каждой линии. Премиальный сервис для современного стиля.",
    en: "Precision in every line. Premium service for modern style.",
  },
  "footer.nav": { kg: "Навигация", ru: "Навигация", en: "Navigation" },
  "footer.locations": { kg: "Даректер", ru: "Локации", en: "Locations" },
  "footer.contacts": { kg: "Байланыш", ru: "Контакты", en: "Contacts" },
  "footer.rights": { kg: "Бардык укуктар корголгон.", ru: "Все права защищены.", en: "All rights reserved." },

  "auth.login.title": { kg: "Кирүү", ru: "Вход", en: "Sign in" },
  "auth.register.title": { kg: "Аккаунт түзүү", ru: "Создать аккаунт", en: "Create account" },
  "auth.login.subtitle": {
    kg: "Жазылууларыңызды башкаруу үчүн аккаунтка кириңиз.",
    ru: "Войдите, чтобы управлять записями.",
    en: "Sign in to manage bookings.",
  },
  "auth.register.subtitle": {
    kg: "Мастерге жазылуу үчүн аккаунт түзүңүз.",
    ru: "Создайте аккаунт, чтобы записываться к мастеру.",
    en: "Create an account to book your appointment.",
  },
  "auth.field.fullName": { kg: "Аты-жөнү", ru: "Имя и фамилия", en: "Full name" },
  "auth.field.phone": { kg: "Телефон", ru: "Телефон", en: "Phone" },
  "auth.field.email": { kg: "Email", ru: "Email", en: "Email" },
  "auth.field.password": { kg: "Сырсөз", ru: "Пароль", en: "Password" },
  "auth.submit.wait": { kg: "Күтүңүз...", ru: "Подождите...", en: "Please wait..." },
  "auth.submit.login": { kg: "Кирүү", ru: "Войти", en: "Sign in" },
  "auth.submit.register": { kg: "Аккаунт түзүү", ru: "Создать аккаунт", en: "Create account" },
  "auth.toggle.noAccount": { kg: "Аккаунт жокпу?", ru: "Нет аккаунта?", en: "No account yet?" },
  "auth.toggle.haveAccount": { kg: "Аккаунт барбы?", ru: "Уже есть аккаунт?", en: "Already have an account?" },
  "auth.toggle.create": { kg: "Түзүү", ru: "Создать", en: "Create one" },
  "auth.toggle.login": { kg: "Кирүү", ru: "Войти", en: "Sign in" },
  "auth.toast.login.title": { kg: "Кирдиңиз", ru: "Вход выполнен", en: "Signed in" },
  "auth.toast.register.title": { kg: "Аккаунт түзүлдү", ru: "Аккаунт создан", en: "Account created" },
  "auth.toast.success.desc": { kg: "HairLine'га кош келиңиз.", ru: "Добро пожаловать в HairLine.", en: "Welcome to HairLine." },
  "auth.toast.error.title": { kg: "Кирүү катасы", ru: "Ошибка авторизации", en: "Authentication error" },
  "auth.toast.error.desc": { kg: "Авторизация ишке ашкан жок.", ru: "Не удалось выполнить авторизацию.", en: "Authentication failed." },

  "profile.title": { kg: "Профиль", ru: "Профиль", en: "Profile" },
  "profile.subtitle": {
    kg: "Аккаунт маалыматыңыз API менен синхрондоштурулган.",
    ru: "Данные вашего аккаунта синхронизированы с API записи.",
    en: "Your account information is synced with the booking API.",
  },
  "profile.guest.desc": {
    kg: "Профилди жана жазылууларды көрүү үчүн кириңиз.",
    ru: "Войдите, чтобы открыть профиль и записи.",
    en: "Sign in to access your profile and bookings.",
  },
  "profile.field.fullName": { kg: "Аты-жөнү", ru: "Имя и фамилия", en: "Full name" },
  "profile.field.email": { kg: "Email", ru: "Email", en: "Email" },
  "profile.field.phone": { kg: "Телефон", ru: "Телефон", en: "Phone" },
  "profile.back": { kg: "Профилге кайтуу", ru: "Назад в профиль", en: "Back to profile" },
  "profile.orders.title": { kg: "Жазылууларым", ru: "Мои записи", en: "My bookings" },
  "profile.orders.subtitle": {
    kg: "Келе жаткан жазылууларды көрүп, керек болсо жокко чыгара аласыз.",
    ru: "Смотрите будущие записи и при необходимости отменяйте.",
    en: "View upcoming bookings and cancel if needed.",
  },
  "profile.orders.loading": { kg: "Жазылуулар жүктөлүүдө...", ru: "Загрузка записей...", en: "Loading bookings..." },
  "profile.orders.error": { kg: "Жазылууларды жүктөө мүмкүн болбоду.", ru: "Не удалось загрузить записи.", en: "Could not load bookings." },
  "profile.orders.empty": { kg: "Азырынча жазылуулар жок.", ru: "Пока записей нет.", en: "No bookings yet." },
  "profile.orders.cancel.action": { kg: "Жокко чыгаруу", ru: "Отменить", en: "Cancel" },
  "profile.orders.cancel.success.title": { kg: "Жазылуу жокко чыгарылды", ru: "Запись отменена", en: "Booking cancelled" },
  "profile.orders.cancel.success.desc": {
    kg: "Бул убакыт кайра жеткиликтүү болду.",
    ru: "Этот слот снова стал доступен.",
    en: "The slot is now available again.",
  },
  "profile.orders.cancel.error.title": { kg: "Жокко чыгаруу катасы", ru: "Ошибка отмены", en: "Cancel failed" },
  "profile.orders.cancel.error.desc": {
    kg: "Жазылууну жокко чыгаруу мүмкүн болбоду. Кайра аракет кылыңыз.",
    ru: "Не удалось отменить запись. Попробуйте снова.",
    en: "Could not cancel booking. Please try again.",
  },
  "profile.settings.title": { kg: "Профиль жөндөөлөрү", ru: "Настройки профиля", en: "Profile settings" },
  "profile.settings.subtitle": {
    kg: "Жазылуу үчүн жеке маалыматыңызды жаңыртыңыз.",
    ru: "Обновите личные данные для записи.",
    en: "Update your personal data for booking.",
  },
  "profile.settings.save.action": { kg: "Өзгөртүүлөрдү сактоо", ru: "Сохранить изменения", en: "Save changes" },
  "profile.settings.save.success.title": { kg: "Профиль жаңыртылды", ru: "Профиль обновлен", en: "Profile updated" },
  "profile.settings.save.success.desc": {
    kg: "Аккаунт маалыматыңыз сакталды.",
    ru: "Данные аккаунта сохранены.",
    en: "Your account data has been saved.",
  },
  "profile.settings.save.error.title": { kg: "Жаңыртуу катасы", ru: "Ошибка обновления", en: "Update failed" },
  "profile.settings.save.error.desc": {
    kg: "Профиль өзгөртүүлөрүн сактоо мүмкүн болбоду.",
    ru: "Не удалось сохранить изменения профиля.",
    en: "Could not save profile changes.",
  },

  "notfound.desc": { kg: "Кечиресиз, бул барак табылган жок", ru: "Страница не найдена", en: "Oops! Page not found" },
  "notfound.home": { kg: "Башкы бетке кайтуу", ru: "Вернуться на главную", en: "Return to Home" },

  "common.years": { kg: "жыл", ru: "лет", en: "years" },
  "common.min": { kg: "мүн", ru: "мин", en: "min" },
  "common.copyright": { kg: "Copyright", ru: "Copyright", en: "Copyright" },

  "role.barber": { kg: "Барбер", ru: "Барбер", en: "Barber" },
  "role.stylist": { kg: "Стилист", ru: "Стилист", en: "Stylist" },
  "role.colorist": { kg: "Колорист", ru: "Колорист", en: "Colorist" },

  "location.center": { kg: "Борбор", ru: "Центр", en: "Center" },
  "location.north": { kg: "Түндүк", ru: "Север", en: "North" },
  "location.south": { kg: "Түштүк", ru: "Юг", en: "South" },

  "specialty.men_haircut": { kg: "Эркектер чач кыркуу", ru: "Мужская стрижка", en: "Men haircut" },
  "specialty.shave": { kg: "Сакал алуу", ru: "Бритье", en: "Shave" },
  "specialty.styling": { kg: "Укладка", ru: "Укладка", en: "Styling" },
  "specialty.women_haircut": { kg: "Аялдар чач кыркуу", ru: "Женская стрижка", en: "Women haircut" },
  "specialty.care": { kg: "Кам көрүү", ru: "Уход", en: "Care" },
  "specialty.beard_design": { kg: "Сакалды формага келтирүү", ru: "Оформление бороды", en: "Beard design" },
  "specialty.coloring": { kg: "Боёо", ru: "Окрашивание", en: "Coloring" },
  "specialty.highlights": { kg: "Мелирование", ru: "Мелирование", en: "Highlights" },
  "specialty.balayage": { kg: "Балаяж", ru: "Балаяж", en: "Balayage" },

  "productType.care": { kg: "Кам көрүү", ru: "Уход", en: "Care" },
  "productType.styling": { kg: "Стайлинг", ru: "Стайлинг", en: "Styling" },
  "productType.protection": { kg: "Коргоо", ru: "Защита", en: "Protection" },

  "service.classic_haircut": { kg: "Классикалык чач кыркуу", ru: "Классическая стрижка", en: "Classic haircut" },
  "service.fade_haircut": { kg: "Fade чач кыркуу", ru: "Fade стрижка", en: "Fade haircut" },
  "service.beard_trim": { kg: "Сакалды оңдоо", ru: "Подравнивание бороды", en: "Beard trim" },
  "service.hair_coloring": { kg: "Чач боёо", ru: "Окрашивание волос", en: "Hair coloring" },
  "service.hair_styling": { kg: "Чач укладка", ru: "Укладка волос", en: "Hair styling" },
  "service.haircut_and_styling": { kg: "Чач кыркуу жана укладка", ru: "Стрижка и укладка", en: "Haircut and styling" },
  "service.straight_razor_shave": { kg: "Устара менен сакал алуу", ru: "Бритье опасной бритвой", en: "Straight razor shave" },
  "service.women_haircut": { kg: "Аялдар чач кыркуу", ru: "Женская стрижка", en: "Women haircut" },
  "service.styling": { kg: "Укладка", ru: "Укладка", en: "Styling" },
  "service.coloring": { kg: "Боёо", ru: "Окрашивание", en: "Coloring" },
  "service.highlights": { kg: "Мелирование", ru: "Мелирование", en: "Highlights" },
  "service.balayage": { kg: "Балаяж", ru: "Балаяж", en: "Balayage" },
  "service.hair_treatment": { kg: "Чачка кам көрүү", ru: "Уход за волосами", en: "Hair treatment" },

  currency: { kg: "сом", ru: "сом", en: "KGS" },
};

function getInitialLang(): Lang {
  const saved = localStorage.getItem("hairline-lang") as Lang | null;
  if (saved === "kg" || saved === "ru" || saved === "en") {
    return saved;
  }

  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("ru")) return "ru";
  if (browser.startsWith("ky") || browser.startsWith("kg")) return "kg";
  return "en";
}

function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function languageTag(lang: Lang) {
  if (lang === "ru") return "ru-RU";
  if (lang === "kg") return "ky-KG";
  return "en-US";
}

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (key: string) => string;
  tv: (group: ValueGroup, value: string) => string;
  price: (amount: number) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatYears: (value: number | string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  const changeLang = useCallback((newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("hairline-lang", newLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = languageTag(lang);
  }, [lang]);

  const tr = useCallback(
    (key: string) => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry.en || key;
    },
    [lang],
  );

  const tv = useCallback(
    (group: ValueGroup, value: string) => {
      if (!value) return value;
      const key = `${group}.${normalizeValue(value)}`;
      const entry = translations[key];
      if (!entry) return value;
      return entry[lang] || entry.en || value;
    },
    [lang],
  );

  const price = useCallback(
    (amount: number) => `${amount} ${translations.currency[lang]}`,
    [lang],
  );

  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(languageTag(lang), options).format(date),
    [lang],
  );

  const formatYears = useCallback(
    (value: number | string) => {
      const numeric =
        typeof value === "number"
          ? value
          : Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);

      if (Number.isNaN(numeric)) {
        return String(value);
      }

      return `${numeric} ${tr("common.years")}`;
    },
    [tr],
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({
      lang,
      setLang: changeLang,
      tr,
      tv,
      price,
      formatDate,
      formatYears,
    }),
    [lang, changeLang, tr, tv, price, formatDate, formatYears],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
