"""
Custom Supabase JWT authentication for Django REST Framework.
Validates Bearer tokens issued by Supabase Auth using the JWT secret.
"""
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
        return self.email


class SupabaseJWTAuthentication(BaseAuthentication):
    """
    Authenticate requests via a Supabase-issued JWT in the Authorization header.
    Falls back gracefully when SUPABASE_JWT_SECRET is not configured (dev mode).
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1]
        jwt_secret = settings.SUPABASE_JWT_SECRET

        if not jwt_secret:
            # Dev-mode fallback: decode without verification so the app still
            # runs when Supabase keys aren't configured yet.
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
            except jwt.DecodeError:
                raise AuthenticationFailed("Invalid token")
        else:
            try:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Token has expired")
            except jwt.InvalidTokenError as e:
                raise AuthenticationFailed(f"Invalid token: {e}")

        user = SupabaseUser(payload)

        # Ensure a UserProfile row exists for this Supabase user.
        UserProfile.objects.get_or_create(
            supabase_id=user.id,
            defaults={"email": user.email},
        )

        return (user, token)
