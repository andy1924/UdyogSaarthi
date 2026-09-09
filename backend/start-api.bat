@echo off
REM Local dev launcher: WeasyPrint needs the GTK3 runtime DLL directory.
set "WEASYPRINT_DLL_DIRECTORIES=C:\Program Files\Gtk-Runtime\bin"
cd /d D:\Apps\projects\sih\backend
.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000
