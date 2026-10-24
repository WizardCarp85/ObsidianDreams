"""
ObsidianDreams Django models.
Schema mirrors the spec in the implementation plan §6.
"""
import uuid
from django.db import models


class UserProfile(models.Model):
    """Shadow table for Supabase auth.users."""

    class ThemeChoice(models.TextChoices):
        DARK = "dark", "Dark"
        LIGHT = "light", "Light"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supabase_id = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField()
    display_name = models.CharField(max_length=255)
    timezone = models.CharField(max_length=100, default="UTC")
    theme_preference = models.CharField(
        max_length=10,
        choices=ThemeChoice.choices,
        default=ThemeChoice.DARK,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_profiles"

    def __str__(self):
        return self.email


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "tags"

    def __str__(self):
        return self.name


class Dream(models.Model):
    """Central dream entry."""

    class DreamType(models.TextChoices):
        LUCID = "lucid", "Lucid"
        NIGHTMARE = "nightmare", "Nightmare"
        RECURRING = "recurring", "Recurring"
        NORMAL = "normal", "Normal"
        FRAGMENTED = "fragmented", "Fragmented"
        NAP = "nap", "Nap"

    class Mood(models.TextChoices):
        PEACEFUL = "peaceful", "Peaceful"
        ANXIOUS = "anxious", "Anxious"
        JOYFUL = "joyful", "Joyful"
        CONFUSING = "confusing", "Confusing"
        SCARY = "scary", "Scary"
        NEUTRAL = "neutral", "Neutral"

    class InputMethod(models.TextChoices):
        TEXT = "text", "Text"
        VOICE = "voice", "Voice"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="dreams",
        to_field="supabase_id",
        db_column="user_supabase_id",
    )
    title = models.CharField(max_length=500)
    body = models.TextField(blank=True)
    dream_date = models.DateField()
    dream_type = models.CharField(
        max_length=20,
        choices=DreamType.choices,
        default=DreamType.NORMAL,
    )
    mood = models.CharField(
        max_length=20,
        choices=Mood.choices,
        default=Mood.NEUTRAL,
    )
    sleep_quality = models.IntegerField(null=True, blank=True)  # 1–5
    is_lucid = models.BooleanField(default=False)
    is_recurring = models.BooleanField(default=False)
    input_method = models.CharField(
        max_length=10,
        choices=InputMethod.choices,
        default=InputMethod.TEXT,
    )
    tags = models.ManyToManyField(Tag, through="DreamTag", blank=True, related_name="dreams")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "dreams"
        ordering = ["-dream_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "-dream_date"]),
            models.Index(fields=["user", "dream_type"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.dream_date})"


class DreamTag(models.Model):
    dream = models.ForeignKey(Dream, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table = "dream_tags"
        unique_together = [("dream", "tag")]


class Insight(models.Model):
    """Cached AI-generated narrative insight for a user/period."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="insights",
        to_field="supabase_id",
        db_column="user_supabase_id",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    summary_text = models.TextField()
    stats_json = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "insights"
        ordering = ["-generated_at"]

    def __str__(self):
        return f"Insight for {self.user.email} ({self.period_start}–{self.period_end})"
