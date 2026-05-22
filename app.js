const state = {
  adjectives: [],
  verbs: [],
  nouns: [],
  currentPassword: "",
  attackTimer: null,
  attackRunning: false
};

const $ = (id) => document.getElementById(id);

const badExamples = [
  "haus123",
  "sommer2026",
  "passwort",
  "schule!",
  "qwertz",
  "hallo123",
  "admin",
  "liebe2026",
  "fussball1",
  "geheim"
];

function secureRandom(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function choice(list) {
  return list[secureRandom(list.length)];
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

async function loadWordList(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(path + " konnte nicht geladen werden");
  const text = await response.text();
  return text
    .split(/\r?\n/)
    .map(w => w.trim())
    .filter(w => w && !w.startsWith("#"));
}

async function init() {
  try {
    const [adjectives, verbs, nouns] = await Promise.all([
      loadWordList("data/adjectives.txt"),
      loadWordList("data/verbs.txt"),
      loadWordList("data/nouns.txt")
    ]);

    state.adjectives = adjectives;
    state.verbs = verbs;
    state.nouns = nouns;

    $("listStatus").textContent =
      `Geladen: ${adjectives.length} Adjektive, ${verbs.length} Verben, ${nouns.length} Nomen`;

    buildBadPasswordButtons();
    generatePassword();
  } catch (error) {
    $("listStatus").textContent = "Fehler beim Laden der Wortlisten.";
    $("attackLog").textContent = error.message;
  }
}

function buildBadPasswordButtons() {
  const box = $("badPasswordButtons");
  box.innerHTML = "";
  badExamples.forEach(pw => {
    const btn = document.createElement("button");
    btn.textContent = pw;
    btn.addEventListener("click", () => {
      $("testPassword").value = pw;
    });
    box.appendChild(btn);
  });
}

function generatePassword() {
  const count = Number($("wordCount").value);
  const includeNumber = $("includeNumber").checked;
  const includeSpecial = $("includeSpecial").checked;
  const capitalize = $("capitalize").checked;

  const specials = ["!", "?", "#", "%", "+", "-", "_", "*"];
  const separators = ["-", "_", ".", ""];
  const sep = choice(separators);

  let words = [];

  if (count === 2) {
    words = [choice(state.adjectives), choice(state.nouns)];
  } else if (count === 3) {
    words = [choice(state.adjectives), choice(state.nouns), choice(state.verbs)];
  } else if (count === 4) {
    words = [choice(state.adjectives), choice(state.nouns), choice(state.verbs), choice(state.nouns)];
  } else {
    words = [choice(state.adjectives), choice(state.nouns), choice(state.verbs), choice(state.adjectives), choice(state.nouns)];
  }

  if (capitalize) {
    words = words.map(titleCase);
  }

  let password = words.join(sep);

  if (includeNumber) {
    password += String(secureRandom(90) + 10);
  }

  if (includeSpecial) {
    password += choice(specials);
  }

  state.currentPassword = password;
  $("passwordOutput").textContent = password;
  $("testPassword").value = password;

  updateStrength(password, count, includeNumber, includeSpecial);
}

function updateStrength(password, wordCount, hasNumber, hasSpecial) {
  let score = 0;
  score += Math.min(40, password.length * 3);
  score += wordCount * 10;
  if (hasNumber) score += 12;
  if (hasSpecial) score += 15;
  if (/[a-z]/.test(password) && /[A-ZÄÖÜ]/.test(password)) score += 8;

  score = Math.min(100, score);
  $("strengthBar").style.width = score + "%";

  let text = "schwach";
  let hint = "Zu kurz oder zu vorhersehbar. Mehr Wörter helfen mehr als ein einzelnes kompliziertes Zeichen.";

  if (score >= 45) {
    text = "mittel";
    hint = "Für eine Übung okay. Für echte Konten lieber länger und mit Passwortmanager.";
  }
  if (score >= 75) {
    text = "stark";
    hint = "Lange Passphrasen sind viel schwerer zu erraten als kurze Wörter mit einer Zahl.";
  }

  $("strengthText").textContent = text;
  $("strengthHint").textContent = hint;
}

function copyPassword() {
  if (!state.currentPassword) return;
  navigator.clipboard.writeText(state.currentPassword);
  $("copyBtn").textContent = "Kopiert!";
  setTimeout(() => $("copyBtn").textContent = "Kopieren", 900);
}

function estimateSearchSpace(password) {
  let alphabet = 0;
  if (/[a-zäöü]/.test(password)) alphabet += 30;
  if (/[A-ZÄÖÜ]/.test(password)) alphabet += 30;
  if (/[0-9]/.test(password)) alphabet += 10;
  if (/[^a-zA-ZäöüÄÖÜ0-9]/.test(password)) alphabet += 20;
  alphabet = Math.max(alphabet, 10);
  return Math.pow(alphabet, password.length);
}

function classifyPassword(password) {
  const lower = password.toLowerCase();

  if (badExamples.includes(lower)) {
    return {
      weak: true,
      method: "Treffer in Liste sehr häufiger schlechter Passwörter",
      seconds: 0.1
    };
  }

  if (/^[a-zäöü]+[0-9]{1,4}[!?._-]?$/.test(lower)) {
    return {
      weak: true,
      method: "Wörterbuchwort + Zahl/Sonderzeichen",
      seconds: 0.8
    };
  }

  if (password.length <= 4) {
    return {
      weak: true,
      method: "kurzes Bruteforce-Testpasswort",
      seconds: 1.2
    };
  }

  if (state.currentPassword && password === state.currentPassword && Number($("wordCount").value) <= 3) {
    return {
      weak: true,
      method: "Passphrase aus bekannter kleiner Wortliste rekonstruiert",
      seconds: 2.0
    };
  }

  return {
    weak: false,
    method: "Suchraum zu gross für diese Unterrichts-Demo",
    seconds: 3.0
  };
}

function randomCandidate(target) {
  const pools = [
    badExamples,
    state.adjectives,
    state.verbs,
    state.nouns
  ];

  const mode = secureRandom(6);

  if (mode === 0) return choice(badExamples);
  if (mode === 1) return choice(state.nouns) + String(secureRandom(9999));
  if (mode === 2) return choice(state.adjectives) + choice(state.nouns);
  if (mode === 3) return choice(state.adjectives) + "-" + choice(state.nouns) + "!";
  if (mode === 4) return choice(state.nouns) + "2026";
  return Array.from({length: Math.max(3, Math.min(12, target.length))}, () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789!?-_";
    return chars[secureRandom(chars.length)];
  }).join("");
}

function startAttackDemo() {
  stopAttackDemo();

  const target = $("testPassword").value.trim();
  if (!target) return;

  const result = classifyPassword(target);
  const totalSpace = estimateSearchSpace(target);
  const log = $("attackLog");

  state.attackRunning = true;
  let attempts = 0;
  let lines = [];

  const intro = [
    "Ziel: " + "*".repeat(target.length),
    "Methode: " + result.method,
    "Geschätzter Suchraum: ca. " + totalSpace.toExponential(2) + " Möglichkeiten",
    "Starte Demo-Angriff …",
    ""
  ];

  log.textContent = intro.join("\n");

  const started = performance.now();
  state.attackTimer = setInterval(() => {
    for (let i = 0; i < 35; i++) {
      attempts++;
      const candidate = randomCandidate(target);
      lines.push("Versuch " + String(attempts).padStart(6, "0") + "  →  " + candidate);
    }

    lines = lines.slice(-13);
    log.textContent = intro.join("\n") + lines.join("\n");

    const elapsed = (performance.now() - started) / 1000;

    if (elapsed >= result.seconds) {
      clearInterval(state.attackTimer);
      state.attackRunning = false;

      if (result.weak) {
        log.textContent =
          intro.join("\n") +
          lines.join("\n") +
          "\n\nGEKNACKT nach " + attempts.toLocaleString("de-CH") + " Versuchen" +
          "\nPasswort: " + target +
          "\n\nLerneffekt: Vorhersehbare Muster sind gefährlich.";
      } else {
        log.textContent =
          intro.join("\n") +
          lines.join("\n") +
          "\n\nABGEBROCHEN: In dieser sicheren Demo nicht geknackt." +
          "\nLerneffekt: Länge und Zufall vergrössern den Suchraum massiv.";
      }
    }
  }, 45);
}

function stopAttackDemo() {
  if (state.attackTimer) clearInterval(state.attackTimer);
  state.attackRunning = false;
}

$("generateBtn").addEventListener("click", generatePassword);
$("copyBtn").addEventListener("click", copyPassword);
$("attackBtn").addEventListener("click", startAttackDemo);
$("stopBtn").addEventListener("click", stopAttackDemo);

init();
