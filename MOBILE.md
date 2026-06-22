# Probar ecco en tu móvil (development build)

Expo Go no sirve con SDK 56, así que se crea un **development build**: una app
ecco propia que instalas en tu teléfono y que se conecta al servidor de desarrollo
(Metro) para ver los cambios al instante.

La forma más fácil desde **Windows** es **EAS Build** (compila en la nube de Expo,
no necesitas Android Studio). Para Android genera un **APK** que instalas directo.

## Requisitos
- Una cuenta de Expo gratuita: https://expo.dev/signup
- Un móvil **Android** (lo más fácil). Para iPhone hace falta cuenta de Apple
  Developer de pago — ver nota al final.

## Pasos (Android, recomendado)

En la carpeta del proyecto, en PowerShell:

```powershell
# 1. Instala las dependencias (si no lo has hecho)
npm install

# 2. Inicia sesión en Expo
npx eas-cli login

# 3. Vincula el proyecto a tu cuenta (crea el projectId la 1ª vez)
npx eas-cli init

# 4. Genera el development build (APK en la nube)
npx eas-cli build --profile development --platform android
```

Cuando termine (unos minutos), EAS te da:
- Un **enlace y un QR**. Ábrelo en el móvil y **descarga el APK**.
- Instálalo (Android pedirá permitir "instalar apps de orígenes desconocidos").

## Arrancar la app

```powershell
# Arranca el servidor de desarrollo para el dev build
npx expo start --dev-client
```

- Abre la app **ecco** que instalaste en el móvil.
- Escanea el QR de la terminal (o se conecta sola si estáis en la misma WiFi).
- A partir de aquí, cada cambio en el código se recarga en el móvil.

> El móvil y el PC deben estar en la **misma red WiFi**.

## Notas

- **Permiso de micrófono**: la primera vez que grabes, Android te pedirá permiso.
- **Supabase**: las claves públicas ya van embebidas en la build (`eas.json`).
  Recuerda tener ejecutadas las migraciones (`supabase/README.md`).
- **iPhone**: `npx eas-cli build --profile development --platform ios` requiere
  una cuenta de Apple Developer (99 $/año) para instalar en un dispositivo físico.
  En Android no hace falta nada de eso.
- **Build local (alternativa avanzada)**: si tienes Android Studio instalado,
  `npx expo run:android` compila en tu PC sin usar la nube.
