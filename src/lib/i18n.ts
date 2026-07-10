/**
 * i18n mínimo de ecco (sin dependencias): español + inglés.
 * - Detecta el idioma del dispositivo (expo-localization); español si es "es",
 *   inglés para el resto (visión global).
 * - t('clave', { n: 2 }) interpola {n} y resuelve plurales con sufijos
 *   `_one` / `_other` cuando se pasa `n`.
 */

const es: Record<string, string> = {
  // Home
  'home.title': 'Alguien te ha mandado algo',
  'home.subtitle': 'No sabes quién. Solo le das al play.',
  'home.waiting_one': '🌍 {n} voz dando vueltas por el mundo',
  'home.waiting_other': '🌍 {n} voces dando vueltas por el mundo',
  'home.open': 'Abrir mis voces',
  'home.record': 'soltar una voz',
  'home.seeYours': 'ver tus voces ({n})',
  'home.news': 'Novedades',
  'home.editProfile': 'Editar perfil',

  // Intro
  'intro.how': 'Así funciona',
  'intro.s1t': 'Una voz al día',
  'intro.s1x': 'Cada día grabas un audio (máx. 30 s) y lo sueltas al mundo, sin decir quién eres.',
  'intro.s2t': 'Recibes otra a cambio',
  'intro.s2x': 'Te llega la voz de un desconocido de cualquier parte del mundo. Solo para ti.',
  'intro.s3t': 'Solo se escucha una vez',
  'intro.s3x': 'Cada voz se entrega a una persona y desaparece al oírla. Reacciona con un emoji.',
  'intro.s4t': 'Con banda sonora',
  'intro.s4x': 'Si quieres, acompaña tu voz con una canción para quien la reciba.',
  'intro.start': 'Empezar',

  // Setup
  'setup.title': '¿Cómo te llaman?',
  'setup.subtitle': 'Tu @usuario solo aparece cuando alguien abre tu voz.',
  'setup.placeholder': 'tu_nombre',
  'setup.helper': 'minúsculas, números y _ · 3 a 20 caracteres',
  'setup.where': '¿de dónde eres?',
  'setup.mapHint': 'Toca el mundo para situarte. Solo se comparte tu zona, nunca tu ubicación exacta.',
  'setup.none': 'Sin elegir todavía',
  'setup.locating': 'Buscando…',
  'setup.useLocation': '📍 usar mi ubicación',
  'setup.locError': 'No pudimos acceder a tu ubicación. Elígela en el mapa.',
  'setup.age': 'Tengo 17 años o más y entiendo que recibiré voces de desconocidos.',
  'setup.optional': 'Opcional. ',
  'setup.consentAi': 'Permito que mis voces, de forma anónima, ayuden a mejorar tecnología de voz. Puedo retirarlo cuando quiera.',
  'setup.enter': 'Entrar a ecco',
  'setup.saving': 'Guardando…',
  'setup.legalPre': 'Al entrar aceptas la ',
  'setup.legalLink': 'privacidad y términos',
  'setup.saveError': 'No se pudo guardar. Inténtalo otra vez.',
  'setup.taken': 'Ese nombre ya está cogido. Prueba con otro.',

  // Grabar
  'record.kicker': 'una al día · para alguien, sin decir quién',
  'record.title': 'Suelta tu voz de hoy',
  'record.stopHint': 'toca para parar · máx 30s',
  'record.startHint': 'toca para empezar a grabar',
  'record.ready': 'tu voz, lista',
  'record.dropIt': '¿La sueltas?',
  'record.tooShort': 'Muy corta. Graba algo un poco más largo.',
  'record.send': 'Enviar voz',
  'record.sending': 'Enviando…',
  'record.retry': 'regrabar',
  'record.sentTitle': 'Va de camino. Un segundo y sale.',
  'record.sentSubtitle': 'Revisamos rápido que todo esté bien y la soltamos al mundo, sin tu nombre. Que la descubran.',
  'record.home': 'Volver al inicio',
  'record.invite': 'Invitar a un amigo',
  'record.doneTitle': 'Tu voz de hoy ya está fuera',
  'record.doneSubtitle_one': 'Una al día: así cada voz vale. Podrás soltar otra en ~{n} hora.',
  'record.doneSubtitle_other': 'Una al día: así cada voz vale. Podrás soltar otra en ~{n} horas.',
  'record.openVoices': 'Abrir mis voces',
  'record.backHome': 'volver al inicio',
  'record.micTitle': 'Micrófono bloqueado',
  'record.micBody': 'Activa el permiso de micrófono para grabar tu voz.',
  'record.sendFail': 'No se pudo enviar',
  'record.tryAgain': 'Inténtalo de nuevo.',

  // Voz recibida
  'voice.back': 'Volver',
  'voice.kicker': 'una voz acaba de llegar · solo se escucha una vez',
  'voice.titleUser': '@{u} tiene algo que decirte',
  'voice.titleAnon': 'Alguien tiene algo que decirte',
  'voice.from': 'desde {c}',
  'voice.noPlace': 'anónima · sin lugar',
  'voice.needSendTitle': 'Suelta tu voz de hoy',
  'voice.needSendSub': 'El ritual es diario: mandas una voz al mundo y recibes la de un desconocido. Hoy aún no has soltado la tuya.',
  'voice.errorTitle': 'Algo salió mal',
  'voice.errorSub': 'Revisa tu conexión e inténtalo otra vez.',
  'voice.drop': 'Soltar una voz',
  'voice.invite': 'Invitar a amigos',
  'voice.songKicker': 'canción recomendada',
  'voice.listen': 'Escuchar',
  'voice.report': 'reportar',
  'voice.block': 'bloquear',
  'voice.reportA11y': 'Reportar voz',
  'voice.blockA11y': 'Bloquear a esta persona',
  'voice.sheetTitle': '¿Qué pasa con esta voz?',
  'voice.sheetSub': 'La revisamos y no volverás a escucharla.',
  'voice.r1': 'Contenido sexual',
  'voice.r2': 'Odio, amenazas o acoso',
  'voice.r3': 'Spam o estafa',
  'voice.r4': 'Otro motivo',
  'voice.alsoBlock': 'Bloquear también a esta persona',
  'voice.thanksTitle': 'Gracias por avisar',
  'voice.thanks': 'Nuestro equipo la revisará. No volverás a escuchar esta voz.',
  'voice.thanksBlock': 'Nuestro equipo la revisará. No volverás a escuchar esta voz ni nada de esta persona.',
  'voice.home': 'Volver al inicio',

  // Retención
  'ret.streak_one': 'racha de {n} día',
  'ret.streak_other': 'racha de {n} días',
  'ret.title': 'Ya lo has oído todo por hoy',
  'ret.subtitle': 'Cada voz se entrega a una sola persona. Mañana habrá voces nuevas dando vueltas por el mundo — y alguien estará esperando la tuya.',
  'ret.back_one': '🌙 Vuelven en ~{n} hora',
  'ret.back_other': '🌙 Vuelven en ~{n} horas',
  'ret.remindOn': '✓ Te avisaré mañana para que no pierdas la racha',
  'ret.remindWeb': 'Los avisos están disponibles en la app del móvil',
  'ret.remindCta': '🔔 avísame mañana',

  // Canción
  'song.add': 'Añadir una canción',
  'song.addSub': 'recomienda un tema a quien reciba tu voz',
  'song.search': 'busca una canción o artista…',
  'song.remove': 'quitar',
  'song.close': 'cerrar',
  'song.previewA11y': 'Escuchar un adelanto',

  // País
  'country.search': 'o escribe tu país…',

  // Tus voces
  'rcv.header': 'tus voces',
  'rcv.tabIn': 'Recibidas',
  'rcv.tabOut': 'Enviadas',
  'rcv.emptyInT': 'Aún no has recibido voces',
  'rcv.emptyInS': 'Manda una al mundo y reclama la de un desconocido.',
  'rcv.emptyOutT': 'Aún no has enviado nada',
  'rcv.emptyOutS': 'Suelta tu primera voz al mundo.',
  'rcv.anon': 'anónima',
  'rcv.heard': '🔒 ya escuchada · ',
  'rcv.yourVoice': 'Tu voz',
  'rcv.stHeard': 'escuchada',
  'rcv.stWaiting': 'esperando',
  'rcv.stRejected': 'no aprobada',
  'rcv.stReview': 'en revisión',

  // Compartir / avisos
  'share.msg': 'Te mando una voz en ecco 🔥 Mandas un audio y recibes el de un desconocido del mundo. Entra con mi enlace y los dos ganamos una voz extra 👉 {link}',
  'notif.title': '🔥 Tu racha te espera',
  'notif.body': 'Alguien del mundo quiere oírte. Suelta una voz en ecco.',

  // Perfil
  'prof.header': 'editar perfil',
  'prof.invite': 'invita y gana',
  'prof.inviteText': 'Cada persona que entre con tu enlace os da una ',
  'prof.bonusWord': 'voz extra',
  'prof.bonusCount_one': ' Tienes {n} voz extra.',
  'prof.bonusCount_other': ' Tienes {n} voces extra.',
  'prof.share': 'Compartir mi enlace 🔗',
  'prof.copied': 'Enlace copiado ✓ Pégalo donde quieras.',
  'prof.shareFail': 'No se pudo compartir. Inténtalo otra vez.',
  'prof.account': 'tu cuenta',
  'prof.accountSaved': 'Guardada como {e} ✓',
  'prof.accountInfo': 'Solo en este dispositivo. Vincula un email para no perder tu @usuario, racha y voces si reinstalas.',
  'prof.email': 'email',
  'prof.password': 'contraseña (mín. 6)',
  'prof.saveAccount': 'Guardar mi cuenta',
  'prof.linkFail': 'No se pudo vincular.',
  'prof.privacy': 'privacidad de tu voz',
  'prof.more': 'más',
  'prof.reminder': 'Activar recordatorio diario 🔥',
  'prof.reminderOn': 'Recordatorio diario activado ✓',
  'prof.reminderWeb': 'El recordatorio solo está disponible en la app móvil.',
  'prof.legal': 'Privacidad y términos',
  'prof.deleteConfirm': 'Toca otra vez para borrar',
  'prof.delete': 'Borrar mis datos',
  'prof.save': 'Guardar cambios',
  'prof.saving': 'Guardando…',
  'prof.admin': 'Panel de moderación 🛡️',
  'prof.metrics': 'Métricas de retención 📊',
};

const en: Record<string, string> = {
  'home.title': 'Someone sent you something',
  'home.subtitle': "You don't know who. Just press play.",
  'home.waiting_one': '🌍 {n} voice drifting around the world',
  'home.waiting_other': '🌍 {n} voices drifting around the world',
  'home.open': 'Open my voices',
  'home.record': 'drop a voice',
  'home.seeYours': 'see your voices ({n})',
  'home.news': "What's new",
  'home.editProfile': 'Edit profile',

  'intro.how': 'How it works',
  'intro.s1t': 'One voice a day',
  'intro.s1x': 'Every day you record one audio (30s max) and drop it into the world, without saying who you are.',
  'intro.s2t': 'You get one back',
  'intro.s2x': "A stranger's voice arrives from anywhere in the world. Just for you.",
  'intro.s3t': 'It plays only once',
  'intro.s3x': 'Each voice is delivered to one person and disappears once heard. React with an emoji.',
  'intro.s4t': 'With a soundtrack',
  'intro.s4x': 'If you like, attach a song for whoever receives your voice.',
  'intro.start': 'Start',

  'setup.title': 'What do they call you?',
  'setup.subtitle': 'Your @username only shows when someone opens your voice.',
  'setup.placeholder': 'your_name',
  'setup.helper': 'lowercase, numbers and _ · 3–20 characters',
  'setup.where': 'where are you from?',
  'setup.mapHint': 'Tap the world to place yourself. Only your area is shared, never your exact location.',
  'setup.none': 'Not chosen yet',
  'setup.locating': 'Locating…',
  'setup.useLocation': '📍 use my location',
  'setup.locError': "We couldn't access your location. Pick it on the map.",
  'setup.age': 'I am 17 or older and understand I will receive voices from strangers.',
  'setup.optional': 'Optional. ',
  'setup.consentAi': 'I allow my voices, anonymously, to help improve voice technology. I can withdraw this anytime.',
  'setup.enter': 'Enter ecco',
  'setup.saving': 'Saving…',
  'setup.legalPre': 'By entering you accept the ',
  'setup.legalLink': 'privacy & terms',
  'setup.saveError': "Couldn't save. Try again.",
  'setup.taken': 'That name is taken. Try another one.',

  'record.kicker': 'one a day · for someone, without saying who',
  'record.title': "Drop today's voice",
  'record.stopHint': 'tap to stop · 30s max',
  'record.startHint': 'tap to start recording',
  'record.ready': 'your voice, ready',
  'record.dropIt': 'Let it go?',
  'record.tooShort': 'Too short. Record something a bit longer.',
  'record.send': 'Send voice',
  'record.sending': 'Sending…',
  'record.retry': 're-record',
  'record.sentTitle': "It's on its way. One second and it's out.",
  'record.sentSubtitle': "We quickly check everything's fine and release it into the world, without your name. Let them find it.",
  'record.home': 'Back home',
  'record.invite': 'Invite a friend',
  'record.doneTitle': "Today's voice is already out",
  'record.doneSubtitle_one': "One a day: that's what makes each voice count. You can drop another in ~{n} hour.",
  'record.doneSubtitle_other': "One a day: that's what makes each voice count. You can drop another in ~{n} hours.",
  'record.openVoices': 'Open my voices',
  'record.backHome': 'back home',
  'record.micTitle': 'Microphone blocked',
  'record.micBody': 'Enable the microphone permission to record your voice.',
  'record.sendFail': "Couldn't send",
  'record.tryAgain': 'Try again.',

  'voice.back': 'Back',
  'voice.kicker': 'a voice just arrived · it plays only once',
  'voice.titleUser': '@{u} has something to tell you',
  'voice.titleAnon': 'Someone has something to tell you',
  'voice.from': 'from {c}',
  'voice.noPlace': 'anonymous · no place',
  'voice.needSendTitle': "Drop today's voice",
  'voice.needSendSub': "The ritual is daily: you send one voice into the world and receive a stranger's. You haven't dropped yours today.",
  'voice.errorTitle': 'Something went wrong',
  'voice.errorSub': 'Check your connection and try again.',
  'voice.drop': 'Drop a voice',
  'voice.invite': 'Invite friends',
  'voice.songKicker': 'recommended song',
  'voice.listen': 'Listen',
  'voice.report': 'report',
  'voice.block': 'block',
  'voice.reportA11y': 'Report voice',
  'voice.blockA11y': 'Block this person',
  'voice.sheetTitle': "What's wrong with this voice?",
  'voice.sheetSub': "We'll review it and you won't hear it again.",
  'voice.r1': 'Sexual content',
  'voice.r2': 'Hate, threats or harassment',
  'voice.r3': 'Spam or scam',
  'voice.r4': 'Other reason',
  'voice.alsoBlock': 'Also block this person',
  'voice.thanksTitle': 'Thanks for letting us know',
  'voice.thanks': "Our team will review it. You won't hear this voice again.",
  'voice.thanksBlock': "Our team will review it. You won't hear this voice or anything from this person again.",
  'voice.home': 'Back home',

  'ret.streak_one': '{n}-day streak',
  'ret.streak_other': '{n}-day streak',
  'ret.title': "You've heard it all for today",
  'ret.subtitle': 'Each voice is delivered to just one person. Tomorrow there will be new voices drifting around the world — and someone will be waiting for yours.',
  'ret.back_one': '🌙 They return in ~{n} hour',
  'ret.back_other': '🌙 They return in ~{n} hours',
  'ret.remindOn': "✓ I'll remind you tomorrow so you don't lose your streak",
  'ret.remindWeb': 'Reminders are available in the mobile app',
  'ret.remindCta': '🔔 remind me tomorrow',

  'song.add': 'Add a song',
  'song.addSub': 'recommend a track to whoever gets your voice',
  'song.search': 'search a song or artist…',
  'song.remove': 'remove',
  'song.close': 'close',
  'song.previewA11y': 'Play a preview',

  'country.search': 'or type your country…',

  'rcv.header': 'your voices',
  'rcv.tabIn': 'Received',
  'rcv.tabOut': 'Sent',
  'rcv.emptyInT': 'No voices received yet',
  'rcv.emptyInS': "Send one into the world and claim a stranger's.",
  'rcv.emptyOutT': "You haven't sent anything yet",
  'rcv.emptyOutS': 'Drop your first voice into the world.',
  'rcv.anon': 'anonymous',
  'rcv.heard': '🔒 already heard · ',
  'rcv.yourVoice': 'Your voice',
  'rcv.stHeard': 'heard',
  'rcv.stWaiting': 'waiting',
  'rcv.stRejected': 'not approved',
  'rcv.stReview': 'in review',

  'share.msg': 'Sending you a voice on ecco 🔥 You drop an audio and get one from a stranger somewhere in the world. Join with my link and we both earn an extra voice 👉 {link}',
  'notif.title': '🔥 Your streak is waiting',
  'notif.body': 'Someone out there wants to hear you. Drop a voice on ecco.',

  'prof.header': 'edit profile',
  'prof.invite': 'invite & earn',
  'prof.inviteText': 'Everyone who joins with your link earns you both an ',
  'prof.bonusWord': 'extra voice',
  'prof.bonusCount_one': ' You have {n} extra voice.',
  'prof.bonusCount_other': ' You have {n} extra voices.',
  'prof.share': 'Share my link 🔗',
  'prof.copied': 'Link copied ✓ Paste it anywhere.',
  'prof.shareFail': "Couldn't share. Try again.",
  'prof.account': 'your account',
  'prof.accountSaved': 'Saved as {e} ✓',
  'prof.accountInfo': "Only on this device. Link an email so you don't lose your @username, streak and voices if you reinstall.",
  'prof.email': 'email',
  'prof.password': 'password (min. 6)',
  'prof.saveAccount': 'Save my account',
  'prof.linkFail': "Couldn't link.",
  'prof.privacy': 'your voice privacy',
  'prof.more': 'more',
  'prof.reminder': 'Enable daily reminder 🔥',
  'prof.reminderOn': 'Daily reminder on ✓',
  'prof.reminderWeb': 'Reminders are only available in the mobile app.',
  'prof.legal': 'Privacy & terms',
  'prof.deleteConfirm': 'Tap again to delete',
  'prof.delete': 'Delete my data',
  'prof.save': 'Save changes',
  'prof.saving': 'Saving…',
  'prof.admin': 'Moderation panel 🛡️',
  'prof.metrics': 'Retention metrics 📊',
};

const DICTS = { es, en } as const;
export type Lang = keyof typeof DICTS;

function deviceLang(): Lang {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Localization = require('expo-localization');
    const code: string | undefined =
      Localization.getLocales?.()[0]?.languageCode ?? undefined;
    return code === 'es' ? 'es' : 'en';
  } catch {
    return 'es';
  }
}

export const lang: Lang = deviceLang();

/** Traduce una clave, interpolando {vars} y resolviendo plural con `n`. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[lang];
  let k = key;
  if (vars && typeof vars.n === 'number') {
    const suffixed = `${key}_${vars.n === 1 ? 'one' : 'other'}`;
    if (dict[suffixed] || DICTS.es[suffixed]) k = suffixed;
  }
  let out = dict[k] ?? DICTS.es[k] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replaceAll(`{${name}}`, String(value));
    }
  }
  return out;
}
