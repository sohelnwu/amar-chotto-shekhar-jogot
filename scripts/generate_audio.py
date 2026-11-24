"""
Generate the app's voice audio (Bengali + English, female + male) from the
content JSON files, using Microsoft neural voices through the `edge-tts`
package.  Run once whenever content text changes; only new or changed
clips are regenerated.

    pip install edge-tts
    python scripts/generate_audio.py            # generate missing/changed
    python scripts/generate_audio.py --force    # regenerate everything
    python scripts/generate_audio.py --only animals,fruits

Output:
    public/audio/<lang>/<voice>/<category>/<id>.mp3        (name)
    public/audio/<lang>/<voice>/<category>/<id>.desc.mp3   (description)
    public/audio/bn/<voice>/phrases/<key>.mp3              (app phrases)
    src/content/audio-manifest.json                        (path -> bytes)

To use your own recordings instead, drop MP3 files at the same paths and run
`python scripts/generate_audio.py --scan` to rebuild the manifest without
calling any TTS service.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content"
PUBLIC = ROOT / "public"
AUDIO = PUBLIC / "audio"
MANIFEST = CONTENT / "audio-manifest.json"
CACHE = ROOT / "scripts" / ".audio-cache.json"

VOICES = {
    ("bn", "female"): "bn-BD-NabanitaNeural",
    ("bn", "male"): "bn-BD-PradeepNeural",
    ("en", "female"): "en-US-AnaNeural",
    ("en", "male"): "en-US-GuyNeural",
}
RATE = {"bn": "-12%", "en": "-15%"}


def load_content():
    cats = json.loads((CONTENT / "categories.json").read_text(encoding="utf-8"))["categories"]
    cat_by_id = {c["id"]: c for c in cats}
    items: dict[str, list] = {}
    for f in sorted((CONTENT / "items").glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        for cat_id, arr in data.items():
            if cat_id not in cat_by_id:
                sys.exit(f"Unknown category '{cat_id}' in {f.name}")
            items[cat_id] = arr
    phrases = json.loads((CONTENT / "phrases.json").read_text(encoding="utf-8"))
    return cat_by_id, items, phrases


def has_english_audio(cat: dict) -> bool:
    if cat.get("kind") == "story":
        return False
    if cat.get("kind") == "letters" and cat.get("primaryLang") != "en":
        return False
    return True


def build_jobs(cat_by_id, items, phrases, only: set[str] | None):
    jobs = []  # (relpath, lang, gender, text)
    for cat_id, arr in items.items():
        if only and cat_id not in only:
            continue
        cat = cat_by_id[cat_id]
        for it in arr:
            base = f"{cat_id}/{it['id']}"
            for gender in ("female", "male"):
                jobs.append((f"bn/{gender}/{base}.mp3", "bn", gender, it.get("sayBn") or it["bn"]))
                jobs.append((f"bn/{gender}/{base}.desc.mp3", "bn", gender, it["desc"]))
                if has_english_audio(cat):
                    jobs.append((f"en/{gender}/{base}.mp3", "en", gender, it.get("sayEn") or it["en"]))
                    if it.get("descEn"):
                        jobs.append((f"en/{gender}/{base}.desc.mp3", "en", gender, it["descEn"]))
    if not only or "phrases" in only:
        for key, text in phrases.items():
            for gender in ("female", "male"):
                jobs.append((f"bn/{gender}/phrases/{key}.mp3", "bn", gender, text))
    return jobs


def job_hash(lang, gender, text):
    return hashlib.sha1(f"{VOICES[(lang, gender)]}|{RATE[lang]}|{text}".encode("utf-8")).hexdigest()[:16]


async def synth(job, sem, retries=4):
    import edge_tts  # imported lazily so --scan works without the package

    rel, lang, gender, text = job
    out = AUDIO / rel
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp")
    for attempt in range(retries):
        try:
            async with sem:
                comm = edge_tts.Communicate(text, VOICES[(lang, gender)], rate=RATE[lang])
                await comm.save(str(tmp))
            if tmp.stat().st_size < 500:
                raise RuntimeError("audio too small")
            tmp.replace(out)
            return True
        except Exception as exc:  # noqa: BLE001
            if attempt == retries - 1:
                print(f"  FAILED {rel}: {exc}")
                return False
            await asyncio.sleep(1.5 * (attempt + 1))
    return False


def write_manifest():
    files = {}
    for p in sorted(AUDIO.rglob("*.mp3")):
        files[p.relative_to(PUBLIC).as_posix()] = p.stat().st_size
    for p in sorted((PUBLIC / "sounds").rglob("*.mp3")) if (PUBLIC / "sounds").exists() else []:
        files[p.relative_to(PUBLIC).as_posix()] = p.stat().st_size
    MANIFEST.write_text(json.dumps({"files": files}, ensure_ascii=False, indent=0), encoding="utf-8")
    total = sum(files.values())
    print(f"Manifest: {len(files)} files, {total / 1024 / 1024:.1f} MB")


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--scan", action="store_true", help="only rebuild manifest from files on disk")
    ap.add_argument("--only", default="", help="comma-separated category ids (or 'phrases')")
    ap.add_argument("--concurrency", type=int, default=8)
    args = ap.parse_args()

    if args.scan:
        write_manifest()
        return

    cat_by_id, items, phrases = load_content()
    only = {s.strip() for s in args.only.split(",") if s.strip()} or None
    jobs = build_jobs(cat_by_id, items, phrases, only)
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

    todo = []
    for job in jobs:
        rel, lang, gender, text = job
        h = job_hash(lang, gender, text)
        if args.force or cache.get(rel) != h or not (AUDIO / rel).exists():
            todo.append((job, h))
    print(f"{len(jobs)} clips in content, {len(todo)} to generate")

    sem = asyncio.Semaphore(args.concurrency)
    done = 0
    failed = 0
    batch = 64
    for i in range(0, len(todo), batch):
        chunk = todo[i : i + batch]
        results = await asyncio.gather(*(synth(job, sem) for job, _ in chunk))
        for (job, h), ok in zip(chunk, results):
            if ok:
                cache[job[0]] = h
                done += 1
            else:
                failed += 1
        CACHE.write_text(json.dumps(cache, indent=0), encoding="utf-8")
        print(f"  {done + failed}/{len(todo)}")

    # Remove clips whose content no longer exists (only on full runs).
    if not only:
        wanted = {j[0] for j in jobs}
        for p in AUDIO.rglob("*.mp3"):
            rel = p.relative_to(AUDIO).as_posix()
            if rel not in wanted:
                p.unlink()
                cache.pop(rel, None)
        CACHE.write_text(json.dumps(cache, indent=0), encoding="utf-8")

    write_manifest()
    print(f"Generated {done}, failed {failed}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
