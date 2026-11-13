# Deine Welten

Eine kleine, persönliche iOS-Web-App aus HTML, CSS und JavaScript. Kein Build, kein Framework, keine externen Laufzeitabhängigkeiten.

## Lokal ansehen

Im Projektordner starten:

```powershell
node tools/preview.mjs
```

Danach [die lokale Vorschau öffnen](http://127.0.0.1:4174/). Mit `Strg+C` beenden. Alternativer Port: `$env:WELTEN_PORT = '4175'`.

## Auf dem iPhone

Die Website auf einem statischen HTTPS-Host bereitstellen, in Safari öffnen und über „Teilen → Zum Home-Bildschirm“ hinzufügen. Auf dem iPhone ist der localhost-Link des Computers nicht erreichbar; die bereitgestellte HTTPS-Adresse verwenden.

Nach dem ersten vollständigen Laden werden alle Welten für die Offline-Nutzung gespeichert, sofern der Browser dies zulässt. iOS kann Website-Daten bei Speichermangel entfernen. Es gibt keine Anmeldung, Berechtigungen oder Tonwiedergabe.

Die Bewegung lässt sich oben rechts pausieren. Die iOS-Einstellung „Bewegung reduzieren“ wird automatisch berücksichtigt und hat Vorrang.

## Welten

- `index.html`: Weltenauswahl.
- `under_quiet_stars/index.html`: Blumenwelt; „Was ist das?“ öffnet die Blumen, Kiwi führt zum Katzenversteck. „Zurück“ schließt erst die Blumen, dann die Welt.
- `under_quiet_stars/cats.html`: Kiwis Geheimversteck.
- `nights_embrace/index.html`: Cassiopeia.
- `northern_lights/index.html`: Nordlicht; den See berühren oder „Ein kleines Licht“ auswählen.

## Hinweis zum Update

Beim ersten Öffnen dieser Version erscheint ein Hinweis auf den Feinschliff aller Welten und die neue Welt „Nordlicht“. Er funktioniert auf der Auswahlseite und beim direkten Einstieg in eine Welt. „Weiter entdecken“ schließt ihn; „Nordlicht entdecken“ führt direkt zur neuen Welt. Escape schließt das Modal ebenfalls.

Das Cookie `welten_update_seen` speichert die angezeigte Update-Version für ein Jahr im Pfad der App. Es wird erst nach dem Anzeigen gesetzt, gilt pro Browser/App-Installation und verwendet `SameSite=Lax`, unter HTTPS zusätzlich `Secure`. Nach dem Löschen oder Ablaufen des Cookies erscheint der Hinweis erneut. Sind Cookies blockiert, bleibt die Website bedienbar; der Hinweis kann beim nächsten Öffnen wieder erscheinen. Für die lokale Prüfung den HTTP-Vorschau-Server verwenden.

Für einen neuen Update-Hinweis die Variable `version` in `assets/update.js` ändern und die Service-Worker-Version erhöhen.

## Bereitstellen und ändern

`index.html`, `manifest.webmanifest`, `sw.js`, `assets/`, `images/`, `under_quiet_stars/`, `nights_embrace/` und `northern_lights/` gemeinsam hochladen. Relative Pfade erlauben auch ein Unterverzeichnis. `backups/`, `docs/`, `tests/` und `tools/` müssen nicht veröffentlicht werden. Beim Abgleich mit einem vorhandenen Host entfernte Dateien ebenfalls löschen.

Bei einer Veröffentlichung nach Quelländerungen die Versionskennung `CACHE` in `sw.js` erhöhen. Sobald der neue Stand vollständig gespeichert wurde, aktiviert er sich und lädt bereits geöffnete Seiten dieser App einmal neu. Alte App-Caches werden entfernt.

## Icons

`images/flowers-icon.ico` ist das bereitgestellte Favicon mit mehreren Auflösungen. Das iOS-Icon `images/apple-touch-icon.png` verwendet die bereits enthaltene quadratische 256 × 256 px PNG-Version aus dieser ICO-Datei ohne Pixeländerungen. Es ist auf allen Seiten und im Web-App-Manifest verknüpft und wird offline gespeichert. Das bereitgestellte Original-PNG liegt unverändert unter `images/flowers-icon.png`.

## Prüfen

```powershell
node --test tests/*.test.mjs
node tools/check.mjs
```

Designanalyse und Plan: `docs/superpowers/`. Originalstand: `backups/before-design-2026-11-13.zip`.
