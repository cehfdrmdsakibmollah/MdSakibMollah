#!/usr/bin/env python3
"""Configures private, gitignored API and web environments from existing credential files.
Usage: python setup-private-config.py /abs/path/atlas-credentials.env /abs/path/firebase-adminsdk.json ceh.fdr.mdsakibmollah@gmail.com
Never commit your output .env files or service account key to GitHub.
"""
import argparse
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
API = ROOT / "apps/api"
WEB = ROOT / "apps/web"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("atlas_file", type=pathlib.Path)
    parser.add_argument("firebase_file", type=pathlib.Path)
    parser.add_argument("owner_email", type=str, nargs="?", default="ceh.fdr.mdsakibmollah@gmail.com")
    parser.add_argument("--database", default="sakib_portfolio")
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_-]+", args.database):
        parser.error("Invalid database name")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", args.owner_email):
        parser.error("Invalid owner email")
    atlas = {}
    for raw_line in args.atlas_file.expanduser().resolve().read_text().splitlines():
        match = re.fullmatch(r"\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*", raw_line)
        if match:
            atlas[match.group(1)] = match.group(2).strip().strip("\"'")
    uri = atlas.get("MONGODB_URI", "")
    match = re.fullmatch(r"(mongodb(?:\+srv)?://[^/?\s]+)(?:/[^?\s]*)?(\?[^\s]*)?", uri)
    if not match or "<db_password>" in uri:
        parser.error("Atlas file must contain a valid MONGODB_URI (not a placeholder)")
    uri = match.group(1) + "/" + args.database + (match.group(2) or "")
    credential_path = args.firebase_file.expanduser().resolve()
    service = json.loads(credential_path.read_text())
    if not (service.get("type") == "service_account" and service.get("project_id") == "mdsakibmollahportfolio"
            and service.get("client_email") and service.get("private_key")):
        parser.error("Invalid Firebase service-account JSON for this portfolio")
    api = (API / ".env.example").read_text()
    for key, value in {
        "MONGODB_URI": json.dumps(uri),
        "GOOGLE_APPLICATION_CREDENTIALS": json.dumps(str(credential_path)),
        "ADMIN_EMAILS": args.owner_email.lower(),
        "OWNER_NOTIFICATION_EMAIL": args.owner_email.lower(),
    }.items():
        api, count = re.subn(rf"(?m)^{key}=.*$", lambda _: f"{key}={value}", api)
        if count != 1:
            parser.error(f"Missing {key} in API template")
    (API / ".env").write_text(api, encoding="utf-8")
    web_env = WEB / ".env.local"
    if not web_env.exists():
        web_env.write_text((WEB / ".env.example").read_text(), encoding="utf-8")
    else:
        current = web_env.read_text(encoding="utf-8")
        # Migrate existing older browser-direct API configs to same-origin Next proxy.
        current = re.sub(r"(?m)^NEXT_PUBLIC_API_URL=.*\n?", "", current)
        if "API_INTERNAL_URL=" not in current:
            current += "\nAPI_INTERNAL_URL=http://127.0.0.1:4000/api/v1\n"
        web_env.write_text(current, encoding="utf-8")
    print("SUCCESS: MongoDB Atlas URI, Firebase private JSON path and owner email set locally.")
    print("NEXT: Enable Google + Email/Password in Firebase Console; npm install; npm run dev.")
    print("IMPORTANT: Rotate credentials that were shared before production deployment.")


if __name__ == "__main__":
    main()
