import os, hmac, hashlib, time, html, json, random, string, threading, urllib.request, urllib.parse
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.responses import Response, HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from .db import Base, engine, SessionLocal, Phrase, Setting, Order
from .seed import seed, slugify
from . import og

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
SECRET = os.getenv("SECRET_KEY", "dev-secret")
TG_TOKEN = os.getenv("TG_BOT_TOKEN", "")
TG_CHAT = os.getenv("TG_CHAT_ID", "")
STATIC = os.getenv("STATIC_DIR", os.path.join(os.path.dirname(__file__), "..", "static"))
BUILD = os.getenv("BUILD_ID", str(int(time.time())))

GARMENTS = ("majica", "duks", "hudi")
COLORS = ("ekru", "grafit", "zalfija", "pesak")
SIZES = ("XS", "S", "M", "L", "XL", "XXL")
TECH = ("stampa", "vez")
STATUSES = ("new", "confirmed", "production", "shipped", "delivered", "cancelled")

app = FastAPI(docs_url=None, redoc_url=None)


@app.on_event("startup")
def startup():
    for i in range(30):
        try:
            Base.metadata.create_all(engine)
            break
        except Exception:
            time.sleep(2)
    with SessionLocal() as db:
        seed(db)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def settings_dict(db):
    return {s.key: s.value["v"] for s in db.query(Setting).all()}


def phrase_out(p: Phrase):
    return {"id": p.id, "slug": p.slug, "lang": p.lang, "line1": p.line1, "line2": p.line2,
            "active": p.active, "featured": p.featured, "sort": p.sort, "shares": p.shares}


# ---------- public ----------
@app.get("/api/catalog")
def catalog(db=Depends(get_db)):
    rows = db.scalars(select(Phrase).where(Phrase.active == True).order_by(Phrase.sort, Phrase.id)).all()
    return {"phrases": [phrase_out(p) for p in rows], "settings": settings_dict(db), "build": BUILD}


@app.get("/api/phrase/{slug}")
def phrase(slug: str, db=Depends(get_db)):
    p = db.scalar(select(Phrase).where(Phrase.slug == slug, Phrase.active == True))
    if not p:
        raise HTTPException(404, "not_found")
    return phrase_out(p)


@app.post("/api/phrase/{slug}/share")
def share(slug: str, db=Depends(get_db)):
    p = db.scalar(select(Phrase).where(Phrase.slug == slug))
    if p:
        p.shares += 1
        db.commit()
    return {"ok": True}


class Item(BaseModel):
    slug: str
    garment: str
    color: str
    size: str
    tech: str
    qty: int = Field(ge=1, le=20)


class OrderIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=40)
    city: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=3, max_length=200)
    postal: str = Field(default="", max_length=12)
    note: str = Field(default="", max_length=1000)
    items: list[Item] = Field(min_length=1, max_length=30)


def price_items(db, items):
    s = settings_dict(db)
    out, subtotal = [], 0
    for it in items:
        p = db.scalar(select(Phrase).where(Phrase.slug == it.slug, Phrase.active == True))
        if not p or it.garment not in GARMENTS or it.color not in COLORS or it.size not in SIZES or it.tech not in TECH:
            raise HTTPException(400, "bad_item")
        unit = s["garments"][it.garment]["price"] + (s["embroidery_extra"] if it.tech == "vez" else 0)
        subtotal += unit * it.qty
        out.append({**it.model_dump(), "line1": p.line1, "line2": p.line2, "unit": unit})
    delivery = 0 if subtotal >= s["free_delivery_from"] else s["delivery"]
    return out, subtotal, delivery


def notify(text):
    if not (TG_TOKEN and TG_CHAT):
        return
    def go():
        try:
            data = urllib.parse.urlencode({"chat_id": TG_CHAT, "text": text, "parse_mode": "HTML"}).encode()
            urllib.request.urlopen(f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage", data=data, timeout=10)
        except Exception:
            pass
    threading.Thread(target=go, daemon=True).start()


@app.post("/api/orders")
def create_order(o: OrderIn, db=Depends(get_db)):
    items, subtotal, delivery = price_items(db, o.items)
    number = "PL-" + datetime.utcnow().strftime("%y%m") + "-" + "".join(random.choices(string.digits, k=4))
    order = Order(number=number, name=o.name.strip(), phone=o.phone.strip(), city=o.city.strip(),
                  address=o.address.strip(), postal=o.postal.strip(), note=o.note.strip(),
                  items=items, total=subtotal + delivery)
    db.add(order)
    db.commit()
    lines = "\n".join(f"• {html.escape(i['line1'])} {html.escape(i['line2'])} — {i['garment']}, {i['color']}, {i['size']}, {i['tech']} ×{i['qty']}" for i in items)
    notify(f"🟢 <b>Nova porudžbina {number}</b>\n{html.escape(order.name)}, {html.escape(order.phone)}\n{html.escape(order.city)}, {html.escape(order.address)}\n\n{lines}\n\nUkupno: <b>{order.total} RSD</b> (pouzećem)")
    return {"number": number, "total": order.total, "delivery": delivery}


# ---------- admin ----------
def make_token():
    exp = str(int(time.time()) + 7 * 86400)
    sig = hmac.new(SECRET.encode(), exp.encode(), hashlib.sha256).hexdigest()
    return f"{exp}.{sig}"


def admin(authorization: Optional[str] = Header(default=None)):
    try:
        exp, sig = (authorization or "").replace("Bearer ", "").split(".")
        good = hmac.new(SECRET.encode(), exp.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, good) and int(exp) > time.time():
            return True
    except Exception:
        pass
    raise HTTPException(401, "unauthorized")


class Login(BaseModel):
    password: str


@app.post("/api/admin/login")
def login(body: Login):
    if not hmac.compare_digest(body.password, ADMIN_PASSWORD):
        time.sleep(1)
        raise HTTPException(401, "wrong_password")
    return {"token": make_token()}


@app.get("/api/admin/phrases")
def a_phrases(_=Depends(admin), db=Depends(get_db)):
    return [phrase_out(p) for p in db.scalars(select(Phrase).order_by(Phrase.sort, Phrase.id)).all()]


class PhraseIn(BaseModel):
    lang: str = Field(pattern="^(sr|ru)$")
    line1: str = Field(min_length=1, max_length=60)
    line2: str = Field(default="", max_length=60)
    active: bool = True
    featured: bool = False
    sort: int = 0


def unique_slug(db, base, exclude_id=None):
    slug, n = base, 2
    while True:
        p = db.scalar(select(Phrase).where(Phrase.slug == slug))
        if not p or p.id == exclude_id:
            return slug
        slug = f"{base}-{n}"; n += 1


def set_featured(db, keep_id):
    for p in db.scalars(select(Phrase).where(Phrase.featured == True, Phrase.id != keep_id)).all():
        p.featured = False


@app.post("/api/admin/phrases")
def a_create(body: PhraseIn, _=Depends(admin), db=Depends(get_db)):
    p = Phrase(**body.model_dump(), slug=unique_slug(db, slugify(f"{body.line1} {body.line2}")))
    db.add(p); db.flush()
    if p.featured:
        set_featured(db, p.id)
    db.commit()
    return phrase_out(p)


@app.put("/api/admin/phrases/{pid}")
def a_update(pid: int, body: PhraseIn, _=Depends(admin), db=Depends(get_db)):
    p = db.get(Phrase, pid)
    if not p:
        raise HTTPException(404)
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    if p.featured:
        set_featured(db, p.id)
    db.commit()
    return phrase_out(p)


@app.delete("/api/admin/phrases/{pid}")
def a_delete(pid: int, _=Depends(admin), db=Depends(get_db)):
    p = db.get(Phrase, pid)
    if p:
        db.delete(p); db.commit()
    return {"ok": True}


@app.get("/api/admin/orders")
def a_orders(status: str = "", _=Depends(admin), db=Depends(get_db)):
    q = select(Order).order_by(Order.id.desc())
    if status:
        q = q.where(Order.status == status)
    return [{"id": o.id, "number": o.number, "name": o.name, "phone": o.phone, "city": o.city, "address": o.address,
             "postal": o.postal, "note": o.note, "items": o.items, "total": o.total, "status": o.status,
             "created_at": o.created_at.isoformat() + "Z"} for o in db.scalars(q.limit(500)).all()]


class StatusIn(BaseModel):
    status: str


@app.patch("/api/admin/orders/{oid}")
def a_status(oid: int, body: StatusIn, _=Depends(admin), db=Depends(get_db)):
    o = db.get(Order, oid)
    if not o or body.status not in STATUSES:
        raise HTTPException(400)
    o.status = body.status; db.commit()
    return {"ok": True}


@app.get("/api/admin/settings")
def a_settings(_=Depends(admin), db=Depends(get_db)):
    return settings_dict(db)


@app.put("/api/admin/settings")
def a_settings_put(body: dict, _=Depends(admin), db=Depends(get_db)):
    try:
        clean = {
            "garments": {g: {"price": int(body["garments"][g]["price"])} for g in GARMENTS},
            "embroidery_extra": int(body["embroidery_extra"]),
            "delivery": int(body["delivery"]),
            "free_delivery_from": int(body["free_delivery_from"]),
        }
    except Exception:
        raise HTTPException(400, "bad_settings")
    for k, v in clean.items():
        s = db.get(Setting, k)
        s.value = {"v": v}
    db.commit()
    return clean


# ---------- og + spa ----------
@app.get("/og/{slug}.png")
def og_image(slug: str, db=Depends(get_db)):
    p = db.scalar(select(Phrase).where(Phrase.slug == slug))
    if not p:
        raise HTTPException(404)
    return Response(og.render(p.line1, p.line2), media_type="image/png", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/health")
def health():
    return {"ok": True, "build": BUILD}


NO_CACHE = {"Cache-Control": "no-cache, no-store, must-revalidate"}


def index_html(meta: str = ""):
    path = os.path.join(STATIC, "index.html")
    if not os.path.exists(path):
        return HTMLResponse("<h1>build missing</h1>", status_code=500)
    with open(path, encoding="utf-8") as f:
        doc = f.read()
    if meta:
        doc = doc.replace("<!--META-->", meta)
    return HTMLResponse(doc, headers=NO_CACHE)


@app.get("/{full_path:path}")
def spa(full_path: str, request: Request, db=Depends(get_db)):
    if full_path.startswith("api/"):
        raise HTTPException(404)
    file = os.path.normpath(os.path.join(STATIC, full_path))
    if full_path and file.startswith(os.path.normpath(STATIC)) and os.path.isfile(file):
        immutable = full_path.startswith("assets/")
        return FileResponse(file, headers={"Cache-Control": "public, max-age=31536000, immutable"} if immutable else NO_CACHE)
    meta = ""
    if full_path.startswith("p/"):
        slug = full_path[2:].strip("/")
        p = db.scalar(select(Phrase).where(Phrase.slug == slug))
        if p:
            base = str(request.base_url).rstrip("/")
            title = html.escape(f"{p.line1} {p.line2}".strip())
            meta = (f'<meta property="og:title" content="{title}"><meta property="og:description" content="polako. — majice i duksevi sa frazama">'
                    f'<meta property="og:image" content="{base}/og/{p.slug}.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
                    f'<meta property="og:url" content="{base}/p/{p.slug}"><meta name="twitter:card" content="summary_large_image">')
    return index_html(meta)
