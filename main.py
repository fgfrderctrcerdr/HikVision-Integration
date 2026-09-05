"""
Verifix — HikVision Integration (второй концепт, папка рядом с Mock-Stand).

Пока — одна страница "Устройства", визуально повторяющая реальный экран
Verifix (скриншот от Vladimir). Данные — НЕ настоящие (не тянем из живой
базы клиента, это отдельный статичный мок для наглядности), поэтому
названия/серийники — сознательно generic-примеры, а не копия реальных
записей со скриншота (там были реальные названия устройств клиентов
Verifix — воспроизводить их 1:1 не стал).

Дальше по плану — превратить это в пошаговую инструкцию по интеграции
(по аналогии с тем, как Mock-Stand вырос из статичных страниц в гид),
поэтому стек и структура зеркалят Mock-Stand: FastAPI + Jinja2, без SPA.
"""

from pathlib import Path
import os
import time

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Verifix HikVision Integration")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Версия ассетов для cache-busting — тот же фикс, что делал в Mock-Stand,
# когда браузер держал старый CSS/JS в кэше и правки не подхватывались
# без жёсткого рефреша (похоже, именно это и было первопричиной "кнопка
# ничего не делает" — гид рендерился без стилей из-за кэша). На Railway
# берём хэш коммита, локально — таймстамп старта процесса.
ASSET_VERSION = os.environ.get("RAILWAY_GIT_COMMIT_SHA") or str(int(time.time()))
templates.env.globals["v"] = ASSET_VERSION

# Мок-данные устройств — сознательно НЕ копия реальных записей со скриншота
# (там реальные названия устройств клиентов), а generic-примеры того же
# формата: тип, готовность, серийник, название, локация, часовой пояс,
# статус, время последней активности.
DEVICES = [
    {"kind": "HIK", "ready": True, "serial": "DS-K1T341-0001", "name": "Hikvision-Entrance-1", "location": "Головной офис", "tz": "Asia/Tashkent", "status": "online", "last_seen": "24.08.2026 09:12:03"},
    {"kind": "HIK", "ready": True, "serial": "DS-K1T341-0002", "name": "Hikvision-Warehouse-1", "location": "Склад №1", "tz": "Asia/Tashkent", "status": "online", "last_seen": "24.08.2026 09:10:47"},
    {"kind": "HIK", "ready": False, "serial": "DS-K1T341-0003", "name": "Hikvision-Backdoor-1", "location": "Головной офис", "tz": "Asia/Tashkent", "status": "offline", "last_seen": "20.08.2026 18:44:12"},
    {"kind": "ZK", "ready": True, "serial": "ZK-SC405-0001", "name": "ZKTeco-Reception-1", "location": "Головной офис", "tz": "Asia/Tashkent", "status": "online", "last_seen": "24.08.2026 08:55:31"},
    {"kind": "ZK", "ready": False, "serial": "ZK-SC405-0002", "name": "ZKTeco-Cafe-1", "location": "Кафе на Мустакиллик", "tz": "Asia/Tashkent", "status": "unknown", "last_seen": None},
    {"kind": "MOBILE", "ready": True, "serial": "SM-A536E-0187", "name": "Verifix ID — тест", "location": "Склад №1", "tz": "Asia/Tashkent", "status": "online", "last_seen": "24.08.2026 07:02:15"},
    {"kind": "HIK", "ready": True, "serial": "DS-K1T341-0004", "name": "Hikvision-Loading-Dock", "location": "Склад №2", "tz": "Asia/Tashkent", "status": "offline", "last_seen": "18.08.2026 12:30:00"},
    {"kind": "DAHUA", "ready": True, "serial": "DHI-ASA3213F-0001", "name": "Dahua-Reception-1", "location": "Головной офис", "tz": "Asia/Tashkent", "status": "online", "last_seen": "05.09.2026 14:14:04"},
]

STATUS_LABEL = {"online": "В сети", "offline": "Не в сети", "unknown": "Неизвестно"}


def devices_summary(devices):
    total = len(devices)
    counts = {"online": 0, "offline": 0, "unknown": 0}
    for d in devices:
        counts[d["status"]] = counts.get(d["status"], 0) + 1
    needs_attention = counts["offline"] + counts["unknown"]

    def pct(n):
        return round(n / total * 100, 1) if total else 0

    return {
        "total": total,
        "online": counts["online"], "online_pct": pct(counts["online"]),
        "offline": counts["offline"], "offline_pct": pct(counts["offline"]),
        "unknown": counts["unknown"], "unknown_pct": pct(counts["unknown"]),
        "needs_attention": needs_attention,
    }


@app.get("/")
def devices_page(request: Request):
    return templates.TemplateResponse(request, "devices.html", {
        "devices": DEVICES,
        "status_label": STATUS_LABEL,
        "summary": devices_summary(DEVICES),
    })


@app.get("/how-to-find-ip")
def how_to_find_ip_page(request: Request):
    return templates.TemplateResponse(request, "how_to_find_ip.html", {})


@app.get("/how-to-connect-isup")
def how_to_connect_isup_page(request: Request):
    return templates.TemplateResponse(request, "how_to_connect_isup.html", {})


@app.get("/how-to-connect-isup-browser")
def how_to_connect_isup_browser_page(request: Request):
    """Способ Б со страницы просмотра устройства — тот же результат,
    что через экран устройства (/how-to-connect-isup), но по браузеру
    самого устройства. Вынесена в отдельную страницу по фидбеку —
    раньше контент был встроен прямо в device_view.html, там теперь
    просто ссылка, как и на способ через экран."""
    return templates.TemplateResponse(request, "how_to_connect_isup_browser.html", {})


@app.get("/how-to-connect-dahua")
def how_to_connect_dahua_page(request: Request):
    """Инструкция подключения Dahua — своя механика (аккаунт с
    логином/паролем + Auto Registration), не ISUP. 3 шага: удалить
    локальных пользователей, создать аккаунт с данными из Verifix,
    перенести Домен/Порт/ИД устройства (см. how_to_connect_dahua.html)."""
    return templates.TemplateResponse(request, "how_to_connect_dahua.html", {})


@app.get("/device-create")
def device_create_page(request: Request):
    """Форма создания устройства — повторяет реальную форму Verifix
    (см. референс-скрины Vladimir). ?tour=1 запускает гид поверх
    настоящих полей формы (см. static/js/device-tour.js) — ссылку с
    этим параметром ставит devices.html после клика по кнопке
    "Создать" внутри гида на списке устройств."""
    return templates.TemplateResponse(request, "device_create.html", {})


@app.get("/device-view")
def device_view_page(request: Request):
    """Просмотр устройства — повторяет реальную страницу Verifix
    (device_view, см. референс-скрины + видео Vladimir). Показывает
    данные для подключения устройства с кнопками копирования — набор
    полей зависит от типа устройства (?type=hikvision|dahua): у
    HikVision это ISUP (адрес/порт/ID/ключ), у Dahua — Домен/Порт/ИД
    устройства Dahua (другая механика, см. how_to_connect_dahua).
    ?tour=1 запускает гид, подсвечивающий эти поля и раскрывающий блок
    "как настроить устройство этими же данными" (см.
    static/js/device-view-tour.js)."""
    device_type = "dahua" if request.query_params.get("type") == "dahua" else "hikvision"
    return templates.TemplateResponse(request, "device_view.html", {"device_type": device_type})


@app.middleware("http")
async def static_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/"):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return response


app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
