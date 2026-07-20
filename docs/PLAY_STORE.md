# ecco — Guía de publicación en Google Play

Todo lo que Google exige, con los textos y respuestas ya preparados. Sigue el
orden. Cosas entre `[corchetes]` = rellénalas tú.

## 0. Antes de empezar (bloqueos)
1. **Cuenta de desarrollador** de Google Play: pago único **25 $** en
   https://play.google.com/console.
2. **Política de privacidad publicada** (ya la tienes): edita el responsable y
   el email en `public/privacy.html` y `public/terminos.html`, sube los cambios
   y quedarán en:
   - Privacidad: `https://riiichiperezz-design.github.io/bookinghair/privacy.html`
   - Términos: `https://riiichiperezz-design.github.io/bookinghair/terminos.html`
3. **Build de producción (AAB):**
   ```
   npx eas-cli build --profile production --platform android
   ```

> ⚠️ **Requisito de cuentas personales nuevas** (creadas tras el 13/11/2023):
> antes de producción hay que hacer una **prueba cerrada con 12 testers
> durante 14 días seguidos**. Plan: subir el AAB a *Prueba cerrada* → invitar a
> 12 personas (amigos/familia con Android) → esperar 14 días → pedir acceso a
> producción.

---

## 1. Ficha de Play Store (Store listing)

**Nombre de la app** (máx. 30): `ecco — voces anónimas`

**Descripción corta** (máx. 80):
> Manda una voz. Recibe la de un desconocido del mundo. Anónimo, una al día.

**Descripción completa** (máx. 4000):
```
ecco es la red social de voces anónimas.

Cada día sueltas UNA nota de voz de máximo 30 segundos al mundo… y recibes la
de una persona totalmente desconocida, de cualquier país. Sin foto, sin
postureo: solo tu voz. Se entrega a una sola persona y se escucha una única
vez. Cuando pasa, desaparece.

🎙️ Una voz al día. Ni más, ni menos. Así cada mensaje importa.
🌍 De cualquier rincón del mundo. Elige tu zona en el mapa.
🔥 Reacciona con emojis únicos y sigue tu racha diaria.
🎧 Acompaña tu voz con una canción de Spotify para quien la reciba.
🔒 Anónimo de verdad. Tú decides cuánto cuentas.

Seguridad primero: TODAS las voces pasan una moderación automática antes de
entregarse, y puedes reportar o bloquear en un toque. ecco es para mayores de
17 años.

Manda tu voz. Descubre la de alguien que no conoces de nada. Bienvenido a ecco.
```

**Categoría:** Social · **Etiqueta de contenido:** contenido generado por usuarios.

**Gráficos que hay que subir:**
- Icono 512×512 (ya lo tienes en `assets`).
- Gráfico destacado (feature graphic) 1024×500.
- Al menos 2–8 capturas de teléfono (mín. 320px, máx. 3840px).

*(Versión EN de la descripción corta: "Send a voice. Get one from a stranger in
the world. Anonymous, one a day.")*

---

## 2. Seguridad de los datos (Data safety) — respuestas

Marca **"Sí, la app recopila/comparte datos"** y declara así (los datos se
tratan cifrados en tránsito; el usuario puede solicitar su borrado):

| Tipo de dato | ¿Recopila? | ¿Comparte? | Finalidad | Opcional |
|---|---|---|---|---|
| **Audio / grabaciones de voz** | Sí | Sí (se entrega a otro usuario y a proveedores de moderación) | Funcionalidad de la app; seguridad | No |
| **Ubicación aproximada** | Sí | No | Funcionalidad de la app (mapa) | Sí |
| **Fotos** (avatar) | Sí | No | Personalización | Sí |
| **Correo electrónico** | Sí | No | Gestión de cuenta (opcional) | Sí |
| **ID generado por la app** | Sí | No | Prevención de fraude/abuso | No |
| **Acciones en la app** (analítica) | Sí | No | Analítica | No |
| **Otros mensajes de audio del usuario** | Sí | Sí | Funcionalidad principal | No |

Prácticas de seguridad a marcar:
- ✅ Los datos se cifran en tránsito.
- ✅ Puedes solicitar que se eliminen tus datos (hay borrado en la app).
- ✅ Enlazo mi política de privacidad.

> Todo esto debe **coincidir** con `privacy.html`. Ya está alineado.

---

## 3. Clasificación de contenido (cuestionario IARC)

Responde con sinceridad (app social con UGC):
- ¿Los usuarios pueden **interactuar/comunicarse**? **Sí.**
- ¿Se **comparte contenido generado por usuarios**? **Sí** (audio).
- ¿**Compartir ubicación** con otros usuarios? Solo zona aproximada, opcional.
- Sexo/violencia/drogas en el contenido de la app en sí: **No** (lo prohíben las
  normas y la moderación).
- Resultado esperado: **PEGI 16–18 / Teen–Mature**. Es correcto para una app de
  voz anónima entre desconocidos.

**Público objetivo y contenido:** grupo de edad **18+** (o 17+). **No** marques
"apta para familias/niños".

---

## 4. Contenido generado por usuarios (UGC) — lo que Google mira

Google exige salvaguardas. En el formulario de UGC declara que tienes:
- **Moderación previa automática** de todo el audio antes de entregarse. ✅
- **Reportar** contenido y **bloquear** usuarios. ✅
- **Retirada** del contenido que incumpla y gestión de quejas. ✅
- **Términos** con normas de conducta publicadas. ✅ (`terminos.html`)

Esto es justo lo que pide la política de UGC de Google; ecco lo cumple.

---

## 5. Campos de la App content / Store settings
- **URL de política de privacidad:** el enlace de `privacy.html` de arriba.
- **Email de contacto:** perezantequerar@gmail.com.
- **Anuncios:** No (por ahora la app no tiene anuncios).
- **App de noticias / Gobierno / COVID / finanzas:** No.

---

## 6. Orden recomendado
1. Crear la app en Play Console (idioma por defecto: español – España).
2. Rellenar **Ficha principal** (textos + gráficos de §1).
3. Rellenar **Seguridad de los datos** (§2) y **Clasificación** (§3).
4. Rellenar **Contenido de la app**: privacidad, público 18+, UGC (§4–5).
5. Subir el **AAB** a **Prueba cerrada** e invitar a **12 testers**.
6. A los **14 días** con testers activos → solicitar **acceso a producción**.
7. Enviar a revisión. La primera revisión puede tardar varios días.

---

## Fuentes de los requisitos (verificado)
- Data safety (Play Console Help), Privacy policy requirements, UGC policy y el
  requisito de 12 testers/14 días para cuentas personales nuevas.
