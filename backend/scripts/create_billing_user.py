#!/usr/bin/env python3
"""
Create a billing user (for local/dev or first-time setup).
Run from backend dir: python -m scripts.create_billing_user [email] [password] [name] [role]

Example:
  python -m scripts.create_billing_user admin@example.com secret123 "Admin User" admin
  python -m scripts.create_billing_user user@example.com secret123
"""
import asyncio
import sys
from pathlib import Path

# Ensure backend app is on path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import get_billing_db
from app.core.exceptions import ConflictError
from app.billing.services.auth import auth_service


async def main() -> None:
    email = (sys.argv[1] if len(sys.argv) > 1 else "").strip()
    password = (sys.argv[2] if len(sys.argv) > 2 else "").strip()
    name = (sys.argv[3] if len(sys.argv) > 3 else None) or None
    role = (sys.argv[4] if len(sys.argv) > 4 else "user").strip() or "user"

    if not email or not password:
        print("Usage: python -m scripts.create_billing_user <email> <password> [name] [role]")
        print("  role: user (default) or admin")
        sys.exit(1)

    if role not in ("user", "admin"):
        print("role must be 'user' or 'admin'")
        sys.exit(1)

    async with get_billing_db() as db:
        try:
            user = await auth_service.register(db, email, password, name=name, role=role)
            print(f"Created billing user: id={user.id} email={user.email} role={user.role}")
        except ConflictError:
            print(f"User already exists: {email}")
            sys.exit(2)


if __name__ == "__main__":
    asyncio.run(main())
