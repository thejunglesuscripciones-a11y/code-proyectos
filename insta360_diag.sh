#!/bin/bash
# Diagnóstico SOLO LECTURA de Insta360 Studio en macOS. No borra ni modifica nada.
# Uso: bash insta360_diag.sh   -> genera ~/Desktop/insta360_diag.txt
OUT="$HOME/Desktop/insta360_diag.txt"
APP="/Applications/Insta360 Studio.app"
DATA="$HOME/Library/Application Support/insta360/Insta360 Studio"
exec > "$OUT" 2>&1

sec(){ echo; echo "=================== $1 ==================="; }

sec "1. SISTEMA"
sw_vers; uname -m
sysctl -n machdep.cpu.brand_string
system_profiler SPHardwareDataType SPDisplaysDataType | grep -E "Model Name|Model Identifier|Chip|Processor|Memory|Chipset|Metal|VRAM"
df -h / | tail -1
pgrep -lf oahd >/dev/null && echo "Rosetta (oahd) activo"

sec "2/3. APP: versión, arquitectura, estructura"
ls -ld "$APP"
defaults read "$APP/Contents/Info" CFBundleShortVersionString
defaults read "$APP/Contents/Info" CFBundleVersion
defaults read "$APP/Contents/Info" CFBundleExecutable
defaults read "$APP/Contents/Info" LSMinimumSystemVersion
EXE="$APP/Contents/MacOS/$(defaults read "$APP/Contents/Info" CFBundleExecutable 2>/dev/null)"
file "$EXE"; lipo -archs "$EXE"
du -sh "$APP"
ls "$APP/Contents" "$APP/Contents/MacOS" "$APP/Contents/Frameworks" 2>/dev/null | head -80

sec "4. FIRMA / GATEKEEPER / CUARENTENA / PERMISOS"
codesign --verify --deep --strict --verbose=2 "$APP"
codesign -dv --verbose=4 "$APP" 2>&1 | head -30
spctl --assess --type execute --verbose=4 "$APP"
xattr -lr "$APP" 2>/dev/null | head -20
ls -leO "$APP/Contents/MacOS"
echo "--- Dylibs faltantes/no resueltas:"
otool -L "$EXE" | head -40

sec "DATA: contenido de la carpeta de datos"
ls -laO "$DATA"
du -sh "$DATA"/* 2>/dev/null

sec "6. LOG MÁS RECIENTE (últimas 120 líneas)"
LATEST=$(ls -1t "$DATA"/log 2>/dev/null | head -1)
echo "Sesión: $LATEST"
LOGF=$(ls -1t "$DATA/log/$LATEST"/*.log 2>/dev/null | head -1)
echo "Archivo: $LOGF"
tail -n 120 "$LOGF"
sec "Palabras clave en ese log"
grep -inE "error|fail|fatal|crash|exception|permission|denied|library|framework|gpu|metal|opengl|qt|codec|database|sqlite|service|network|timeout|license|login|account" "$LOGF" | head -80
sec "Otros archivos de esa sesión"
ls -la "$DATA/log/$LATEST"

sec "7. CRASHES (carpeta de la app)"
ls -laR "$DATA/crashes" | head -40

sec "8. PROCESOS insta360 en ejecución"
ps -axo pid,ppid,stat,%cpu,etime,command | grep -i insta360 | grep -v grep
sec "Procesos bloqueados (estado U/D) relacionados"
ps -axo pid,stat,command | grep -i insta360 | grep -E " [UD]" | grep -v grep

sec "9. CRASH REPORTS macOS"
ls -lt ~/Library/Logs/DiagnosticReports 2>/dev/null | grep -i insta | head
ls -lt /Library/Logs/DiagnosticReports 2>/dev/null | grep -i insta | head
REP=$(ls -t ~/Library/Logs/DiagnosticReports/*nsta360* 2>/dev/null | head -1)
[ -n "$REP" ] && { echo "Reporte: $REP"; head -c 6000 "$REP"; }

sec "Console (unified log) últimos 15 min, proceso Insta360"
log show --last 15m --style compact --predicate 'process CONTAINS[c] "insta360" OR eventMessage CONTAINS[c] "insta360"' 2>/dev/null | grep -iE "error|fail|deny|crash|kill|sandbox|gatekeeper|xprotect|amfi|code sign|translocat" | tail -60

sec "Otros componentes Insta360"
ls -la /Library/LaunchDaemons /Library/LaunchAgents ~/Library/LaunchAgents 2>/dev/null | grep -i insta
ls -d /Library/Application\ Support/*nsta360* ~/Library/Preferences/*nsta360* ~/Library/Caches/*nsta360* ~/Library/Saved\ Application\ State/*nsta360* 2>/dev/null

echo; echo "FIN"
