# Passwort-Generator & Hack-Demo

Didaktische GitHub-Pages-App für digitale Sicherheit.

## Ziel

Die App zeigt:
- wie man merkbare Passphrasen erzeugen kann,
- warum schlechte Passwörter gefährlich sind,
- wie Wörterbuch- und Bruteforce-Angriffe grundsätzlich vorgehen,
- warum lange Passphrasen viel stärker sind als kurze Wörter mit einer Zahl.

## GitHub Pages

Dateien direkt ins Repository legen:

```text
/
├── index.html
├── style.css
├── app.js
├── data/
│   ├── adjectives.txt
│   ├── verbs.txt
│   └── nouns.txt
└── tools/
    └── bruteforce_demo.py
```

Dann in GitHub:
`Settings` → `Pages` → `Deploy from branch` → `main` → `/root`.

## Sicherheit

Die Hack-Demo ist absichtlich begrenzt. Sie knackt keine fremden Konten, sondern demonstriert nur typische schwache Muster und kurze Testpasswörter.
