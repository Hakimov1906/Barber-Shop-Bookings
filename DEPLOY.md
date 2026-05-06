# Инструкция по развертыванию на Render.com

## 📋 Обзор

Приложение состоит из двух частей:
1. **Backend API** - Node.js + Express + PostgreSQL (разворачивается on Render.com)
2. **Frontend** - React + Vite (разворачивается on Vercel или Netlify)

## 🚀 Развертывание Backend (Render.com)

### Шаг 1: Подготовьте репозиторий
Убедитесь, что ваш код загружен на GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Шаг 2: Создайте новый проект на Render.com

1. Войдите в [Render.com](https://render.com)
2. Нажмите "New +" → "Blueprint"
3. Подключите ваш GitHub репозиторий
4. Render автоматически обнаружит `render.yaml` и создаст:
   - Web Service (Backend API)
   - PostgreSQL базу данных
   - Cron Job (для обновления тестовых данных)

### Шаг 3: Настройте переменные окружения

После создания Blueprint:
1. Перейдите в раздел "Environment" вашего Web Service
2. Установите `JWT_SECRET` (любое безопасное значение, например, 32+ символа)
3. Сохраните изменения

### Шаг 4: Дождитесь деплоя

Render автоматически:
1. Собирает и развертывает backend
2. Создает PostgreSQL базу данных
3. Запускает миграции
4. Развертывает приложение

**URL вашего API:** `https://barbershop-booking-api.onrender.com`

### Шаг 5: Проверьте работоспособность

Откройте в браузере:
- Health check: `https://barbershop-booking-api.onrender.com/api/health`
- Ready check: `https://barbershop-booking-api.onrender.com/api/ready`
- Swagger docs: `https://barbershop-booking-api.onrender.com/api/docs`

## 📱 Обновление мобильного приложения

После деплоя backend на Render.com, мобильное приложение автоматически будет использовать новый API.

### Для Android:
```bash
npm run build
npm run android:sync
npm run android:open  # Откроет Android Studio
```

Затем соберите новый APK в Android Studio.

### Для iOS:
```bash
npm run build
npm run ios:sync
npx cap open ios  # Откроет Xcode (требуется macOS)
```

## 🌐 Развертывание Frontend (Vercel)

### Вариант 1: Автоматически (рекомендуется)

1. Войдите в [Vercel](https://vercel.com)
2. Импортируйте ваш репозиторий
3. Настройте сборку:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy!

### Вариант 2: Через CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 🔧 Настройка CORS

Если нужно ограничить доступ к API, обновите `render.yaml`:

```yaml
- key: CORS_ORIGIN
  value: https://your-domain.com,https://admin.your-domain.com
```

## 📊 Мониторинг

### Render Dashboard
- Логи: Render Dashboard → Your Service → Logs
- Метрики: Render Dashboard → Your Service → Metrics

### Health Checks
- `/api/health` - проверка работоспособности
- `/api/ready` - готовность к приему запросов

## 🔄 Обновление приложения

После любых изменений в коде:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render автоматически пересоберет и развернет обновленную версию.

## 💡 Важные заметки

1. **Бесплатный тариф Render**:
   - Backend "засыпает" после 15 минут бездействия
   - Первый запрос после простоя занимает ~30 секунд
   - Для продакшена рассмотрите платный тариф

2. **База данных**:
   - Бесплатная PostgreSQL на Render имеет лимит 1GB
   - Автоматические бэкапы не включены на бесплатном тарифе

3. **Безопасность**:
   - Никогда не коммитьте `.env` файлы
   - Используйте секреты Render для чувствительных данных
   - Включите HTTPS (автоматически на Render)

## 🆘 Решение проблем

### Backend не запускается
1. Проверьте логи в Render Dashboard
2. Убедитесь, что `DATABASE_URL` корректен
3. Проверьте `JWT_SECRET` установлен

### CORS ошибки
1. Проверьте `CORS_ORIGIN` в Render Dashboard
2. Убедитесь, что frontend отправляет запросы на правильный URL

### Миграции не применились
1. Проверьте логи на наличие ошибок миграции
2. Убедитесь, что база данных пуста или совместима

## 📞 Поддержка

- Документация Render: https://docs.render.com
- Документация Capacitor: https://capacitorjs.com/docs
- Swagger API docs: `https://barbershop-booking-api.onrender.com/api/docs`

---

**Готово!** Ваше приложение теперь работает на публичном сервере и доступно из любой точки мира! 🎉