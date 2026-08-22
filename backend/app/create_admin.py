import os
import sys
import uuid

from dotenv import load_dotenv
from passlib.context import CryptContext

from database import admins_collection


load_dotenv()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def create_admin():
    print("\n===================================")
    print("      BLUEGUARD ADMIN CREATOR")
    print("===================================\n")

    email = input("Admin email: ").strip().lower()
    password = input("Admin password: ").strip()
    name = input("Admin name: ").strip()

    if not email or not password or not name:
        print("\n❌ All fields are required.")
        return

    # Check whether admin already exists
    existing_admin = admins_collection.find_one({
        "email": email
    })

    if existing_admin:
        print("\n❌ An admin with this email already exists.")
        return

    # Generate unique admin ID
    admin_id = f"ADM-{uuid.uuid4().hex[:8].upper()}"

    # Hash password
    password_hash = pwd_context.hash(password)

    admin_document = {
        "admin_id": admin_id,
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": "admin",
        "status": "active",
        "created_at": __import__("datetime").datetime.utcnow(),
    }

    admins_collection.insert_one(admin_document)

    print("\n✅ Admin created successfully!")
    print("-----------------------------------")
    print(f"Admin ID : {admin_id}")
    print(f"Name     : {name}")
    print(f"Email    : {email}")
    print(f"Role     : admin")
    print(f"Status   : active")
    print("-----------------------------------")
    print("You can now use these credentials")
    print("on the BlueGuard Admin login.\n")


if __name__ == "__main__":
    create_admin()