import base64
import hashlib

from cryptography.fernet import Fernet


def _fernet_key(secret_key: str) -> bytes:
    digest = hashlib.sha256(secret_key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_secret(secret_key: str, value: str) -> str:
    return Fernet(_fernet_key(secret_key)).encrypt(value.encode()).decode()


def decrypt_secret(secret_key: str, encrypted: str) -> str:
    return Fernet(_fernet_key(secret_key)).decrypt(encrypted.encode()).decode()
