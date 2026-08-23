import os
import certifi

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set in .env")


client = MongoClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=20000,
    socketTimeoutMS=20000,
)


db = client["blueguard"]


# ============================================================
# COLLECTIONS
# ============================================================

organizations_collection = db["organizations"]

admins_collection = db["admins"]

projects_collection = db["projects"]

evidence_collection = db["evidence"]

verifications_collection = db["verifications"]

verification_collection = db["verification"]


# ============================================================
# DATABASE CONNECTION TEST
# ============================================================

try:
    client.admin.command("ping")
    print("[OK] MongoDB connected successfully!")
except Exception as e:
    print("[WARN] MongoDB connection notice:", str(e))