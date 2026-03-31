# InstaSort

Локальное Android-приложение на Expo Router для сортировки сохраненных Instagram-постов по категориям.

## Что умеет

- добавлять посты по URL или вручную;
- импортировать `Saved` из JSON-экспорта Instagram;
- хранить посты, категории и связи в `expo-sqlite`;
- искать, фильтровать и сортировать коллекцию;
- подбирать категории полностью офлайн;
- экспортировать и импортировать базу JSON.

## Режимы запуска

### 1. Development build

Это основной режим для разработки:

```bash
npm install
npm run android
npm start
```

После любых изменений в `android/` нужно заново пересобрать и переустановить приложение:

```bash
npm run android
```

Если нужен tunnel:

```bash
npm run start:tunnel
```

Важно: development build использует dev server. Это удобно для разработки, но не является полностью автономным режимом.

### 2. Локальная офлайн-установка без сервера

Если нужна локальная Android-сборка, которая открывается без Metro/dev server:

```bash
npm run android:offline
```

Это собирает release-вариант через локальный Android toolchain.

На слабых машинах release-сборка в проекте уже настроена на более щадящий режим Gradle, уменьшенный heap для Metro, один bundler worker, отключенную JS-минификацию и `arm64-v8a` по умолчанию.
Если запускать Gradle вручную, лучше тоже держать `NODE_OPTIONS=--max-old-space-size=1536` и `NODE_ENV=production`.

### 3. Полностью автономная installable сборка

Если нужен APK/AAB для установки без сервера:

```bash
eas build --platform android --profile preview
```

или production:

```bash
eas build --platform android --profile production
```

`preview` дает APK, `production` собирает Android App Bundle.

## Импорт Saved JSON

На экране `Добавить` есть импорт из Instagram Saved export. Поддерживается JSON с блоком `saved_saved_media`, где внутри ищутся `href`, `title` и `timestamp` в `string_map_data` и `string_list_data`.

## Android Share Intent

В development build и release-сборке приложение умеет принимать `SEND`/`SEND_MULTIPLE` с текстом из Instagram и других приложений. Входящий share переадресуется в экран `Добавить`, где ссылка и текст подставляются автоматически.

## Конфигурация

Основные файлы:

- `app.json`
- `eas.json`
- `package.json`

## SQLite schema

- `posts`
- `categories`
- `post_categories`
