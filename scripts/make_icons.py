"""Render public/icons/icon.svg to the PNG sizes the PWA manifest needs.

    pip install PySide6
    python scripts/make_icons.py
"""
from pathlib import Path

from PySide6.QtCore import QRectF, Qt
from PySide6.QtGui import QColor, QGuiApplication, QImage, QPainter
from PySide6.QtSvg import QSvgRenderer

ICONS = Path(__file__).resolve().parent.parent / "public" / "icons"


def render(size: int, out: str, maskable: bool = False) -> None:
    img = QImage(size, size, QImage.Format_ARGB32)
    img.fill(QColor("#FF9A40") if maskable else Qt.transparent)
    p = QPainter(img)
    p.setRenderHint(QPainter.Antialiasing)
    r = QSvgRenderer(str(ICONS / "icon.svg"))
    # maskable icons keep content inside the 80% safe zone
    pad = size * 0.1 if maskable else 0
    r.render(p, QRectF(pad, pad, size - 2 * pad, size - 2 * pad))
    p.end()
    img.save(str(ICONS / out))
    print("wrote", out)


if __name__ == "__main__":
    app = QGuiApplication([])
    render(192, "icon-192.png")
    render(512, "icon-512.png")
    render(512, "maskable-512.png", maskable=True)
    render(180, "apple-touch-icon.png")
