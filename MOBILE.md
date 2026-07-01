# Llevar ecco a tu móvil (build real)

Expo Go no sirve con SDK 56, así que se compila una app **ecco** propia con
**EAS Build** (compila en la nube de Expo: no necesitas Android Studio ni Mac).

Hay dos tipos de build. Empieza por el **preview**.

| Build | Qué es | Cuándo |
|---|---|---|
| **preview** | APK **independiente** que instalas y funciona solo (contra tu Supabase). | Para usar/enseñar la app de verdad. **Empieza por aquí.** |
| **development** | Necesita el PC con `expo start` en la misma WiFi; recarga los cambios al instante. | Para programar y ver cambios en vivo. |

## Requisitos (una vez)
- Cuenta de Expo gratuita: https://expo.dev/signup
- Móvil **Android** (lo más fácil). iPhone requiere cuenta de Apple Developer de
  pago — ver nota al final.

---

## 🚀 Camino rápido: app instalable (preview APK)

En la carpeta del proyecto, en PowerShell:

```powershell
# 1. Dependencias (si no lo has hecho ya)
npm install

# 2. Inicia sesión en tu cuenta de Expo
npx eas-cli login

# 3. Vincula el proyecto a tu cuenta (crea el projectId la 1ª vez)
npx eas-cli init

# 4. Compila el APK independiente en la nube (~10-15 min la 1ª vez)
npx eas-cli build --profile preview --platform android
```

Cuando termine, EAS te da un **enlace + QR**:
1. Ábrelo en el móvil y **descarga el APK**.
2. Instálalo (Android pedirá permitir "instalar apps de orígenes desconocidos").
3. Abre **ecco**. Funciona sola, sin el PC: se conecta directa a tu Supabase.

> El paso 3 (`eas init`) escribe tu `projectId` y `owner` en `app.json` y hace un
> commit local. Súbelo luego con `git push` si quieres conservarlo.

---

## 🔧 Para programar con recarga en vivo (development build)

```powershell
# 1. Compila el dev build (una vez)
npx eas-cli build --profile development --platform android
# instala ese APK como antes

# 2. Arranca el servidor de desarrollo
npx expo start --dev-client
```

Abre la app **ecco** instalada y escanea el QR de la terminal. Cada cambio en el
código se recarga en el móvil. El móvil y el PC deben estar en la **misma WiFi**.

---

## Notas
- **Micrófono / ubicación**: la primera vez que grabes o uses "mi ubicación",
  Android pedirá permiso (los textos ya están en `app.json`).
- **Supabase**: las claves **públicas** ya van embebidas en la build (`eas.json`).
  Ten ejecutadas las migraciones (`supabase/migrations/`, incluida la `0010`).
- **iPhone**: `--platform ios` requiere cuenta de Apple Developer (99 $/año) para
  instalar en un dispositivo físico. En Android no hace falta nada de eso.
- **Publicar en Google Play** (más adelante): `--profile production` genera un
  `.aab` y `npx eas-cli submit --platform android` lo sube a la Play Console
  (cuenta de desarrollador de Google, pago único de 25 $).
- **Build local (avanzado)**: con Android Studio, `npx expo run:android` compila
  en tu PC sin usar la nube.
