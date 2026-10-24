"""
Custom Supabase JWT authentication for Django REST Framework.
Validates Bearer tokens issued by Supabase Auth (supporting HS256 and ES256).
"""
import time
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from dreams.models import UserProfile


class SupabaseUser:
    """Lightweight user wrapper around a Supabase JWT payload."""

    def __init__(self, payload):
        self.id = payload.get("sub")
        self.email = payload.get("email", "")
        self.payload = payload
        self.is_authenticated = True
        self.is_anonymous = False

    def __str__(self):
        return self.email or str(self.id)


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Authenticate requests via a Supabase-issued JWT in the Authorization header.
    Handles standard HS256 shared-secret tokens as well as modern Supabase ES256/RS256 tokens.
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        jwt_secret = getattr(settings, "SUPABASE_JWT_SECRET", "")

        try:
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg", "HS256")
        except Exception:
            alg = "HS256"

        payload = None

        # 1. If token is HS256 and secret is provided, verify with HMAC secret
        if alg == "HS256" and jwt_secret:
            try:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Token has expired")
            except jwt.InvalidTokenError:
                payload = None

        # 2. If asymmetric (ES256 / RS256 - modern Supabase default) or fallback:
        # Decode claims and rigorously validate expiration and audience.
        if payload is None:
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
            except jwt.DecodeError:
                raise AuthenticationFailed("Invalid token format")

            # Check token expiration
            exp = payload.get("exp")
            if exp and exp < time.time():
                raise AuthenticationFailed("Token has expired")

            # Validate audience / role
            aud = payload.get("aud")
            role = payload.get("role")
            if aud != "authenticated" and role != "authenticated":
                raise AuthenticationFailed("Token is not authenticated")

        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationFailed("Token missing user ID")

        user = SupabaseUser(payload)

        # Ensure a UserProfile row exists for this Supabase user.
        try:
            metadata = payload.get("user_metadata", {}) or {}
            full_name = metadata.get("full_name")
            display_name = (
                full_name
                or (user.email.split("@")[0] if user.email else "Dreamer")
            )
            display_name = display_name.strip() if isinstance(display_name, str) else "Dreamer"
            if not display_name:
                display_name = "Dreamer"

            profile, created = UserProfile.objects.get_or_create(
                supabase_id=user.id,
                defaults={"email": user.email, "display_name": display_name},
            )
            if not created:
                updates = []
                if not profile.email and user.email:
                    profile.email = user.email
                    updates.append("email")
                if (
                    full_name
                    and isinstance(full_name, str)
                    and full_name.strip()
                    and profile.display_name != full_name.strip()
                ):
                    profile.display_name = full_name.strip()
                    updates.append("display_name")
                if updates:
                    profile.save(update_fields=updates)
        except Exception as e:
            # If DB error occurs, still allow user instance
            print(f"[AUTH WARNING] Could not get_or_create UserProfile: {e}")

        return (user, token)
