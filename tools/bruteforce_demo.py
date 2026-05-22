"""
bruteforce_demo.py

Lokale Unterrichts-Demo.
Zeigt stark vereinfacht, wie ein Wörterbuchangriff vorgehen kann.

Start:
python tools/bruteforce_demo.py
"""

from pathlib import Path
import itertools
import time

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

def load_words(filename):
    return [
        line.strip()
        for line in (DATA / filename).read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.startswith("#")
    ]

def demo_attack(target):
    adjectives = load_words("adjectives.txt")[:80]
    verbs = load_words("verbs.txt")[:80]
    nouns = load_words("nouns.txt")[:80]

    bad_passwords = [
        "passwort", "haus123", "sommer2026", "schule!", "qwertz",
        "hallo123", "admin", "geheim", "fussball1"
    ]

    attempts = 0

    print("Starte Wörterbuch-Demo …")
    print("Ziel:", "*" * len(target))

    for candidate in bad_passwords:
        attempts += 1
        print(f"{attempts:06d} -> {candidate}")
        time.sleep(0.01)
        if candidate == target:
            return attempts, candidate

    for noun in nouns:
        for suffix in ["", "1", "12", "123", "2026", "!"]:
            candidate = noun + suffix
            attempts += 1
            print(f"{attempts:06d} -> {candidate}")
            if candidate == target:
                return attempts, candidate

    for adjective, noun in itertools.product(adjectives, nouns):
        candidate = adjective + "-" + noun
        attempts += 1
        if attempts % 50 == 0:
            print(f"{attempts:06d} -> {candidate}")
        if candidate == target:
            return attempts, candidate

    return attempts, None

if __name__ == "__main__":
    target = input("Demo-Passwort eingeben: ").strip()
    attempts, found = demo_attack(target)

    if found:
        print(f"\nGEKNACKT nach {attempts} Versuchen: {found}")
    else:
        print(f"\nNicht geknackt nach {attempts} Demo-Versuchen.")
