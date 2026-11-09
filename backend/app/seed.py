import re, unicodedata
from .db import Phrase, Setting

SR = [
    ("Polako.", "Stići ćemo."), ("Kafa", "pa onda."), ("Ja bih,", "ali neću."),
    ("Sutra sigurno.", "Možda."), ("Nisam lenj,", "štedim energiju."), ("Ne žurim.", "Kasnim sa stilom."),
    ("Biće.", "Ne znam šta, ali biće."), ("Zatvori prozor,", "promaja!"), ("Nema veze.", "Ima, ali nema."),
    ("Radim na sebi.", "Od ponedeljka."), ("Samo da", "legnem malo."), ("Sve je pod kontrolom.", "Ničijom."),
]
RU = [
    ("Живу в режиме", "энергосбережения"), ("Переехал,", "но не успокоился"), ("Полако —", "моё второе имя"),
    ("Сербский учу.", "Кафу уже пью."), ("Не тороплюсь.", "Опаздываю красиво."), ("Всё под контролем.", "Под чьим — неясно."),
]

TRANSLIT = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюя", ["a","b","v","g","d","e","e","zh","z","i","y","k","l","m","n","o","p","r","s","t","u","f","h","c","ch","sh","sch","","y","","e","yu","ya"]))


def slugify(text: str) -> str:
    t = text.lower()
    t = "".join(TRANSLIT.get(c, c) for c in t)
    t = t.replace("đ", "dj")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:70] or "fraza"


DEFAULT_SETTINGS = {
    "garments": {
        "majica": {"price": 2490},
        "duks": {"price": 3990},
        "hudi": {"price": 4490},
    },
    "embroidery_extra": 600,
    "delivery": 450,
    "free_delivery_from": 6000,
}


def seed(db):
    if db.query(Phrase).count() == 0:
        i = 0
        for lang, rows in (("sr", SR), ("ru", RU)):
            for l1, l2 in rows:
                i += 1
                db.add(Phrase(slug=slugify(f"{l1} {l2}"), lang=lang, line1=l1, line2=l2, sort=i, featured=(i == 1)))
    for k, v in DEFAULT_SETTINGS.items():
        if not db.get(Setting, k):
            db.add(Setting(key=k, value={"v": v}))
    db.commit()
