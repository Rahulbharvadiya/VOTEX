"""Idempotent seed script creating development users using native SQLite3."""

from argon2 import PasswordHasher
from votex_api.db import get_db_context, init_db
from votex_api.repositories import UserRepository

ph = PasswordHasher()

SEED_USERS = [
    {
        "email": "smoke_user@example.test",
        "password": "Password123!",
        "role": "user",
    },
    {
        "email": "other_user@example.test",
        "password": "Password123!",
        "role": "user",
    },
    {
        "email": "admin@example.test",
        "password": "AdminPassword123!",
        "role": "admin",
    },
]


def seed() -> None:
    init_db()
    with get_db_context() as db:
        user_repo = UserRepository(db)
        for u in SEED_USERS:
            existing = user_repo.get_by_email(u["email"])
            if not existing:
                pwd_hash = ph.hash(u["password"])
                user_repo.create(
                    email=u["email"],
                    password_hash=pwd_hash,
                    role=u["role"],
                )
                print(f"Created seed user: {u['email']} (role: {u['role']})")
            else:
                print(f"Seed user already exists: {u['email']}")
        db.commit()
    print("Database seeding completed.")


if __name__ == "__main__":
    seed()
