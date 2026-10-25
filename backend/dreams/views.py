"""
DRF views / viewsets for ObsidianDreams.
"""
import json
import datetime
from collections import Counter

from django.conf import settings
from django.db import models as db_models
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView

from dreams.models import Dream, Tag, Insight, UserProfile
from dreams.serializers import DreamSerializer, InsightSerializer, UserProfileSerializer


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "stardrift-backend"})


# ---------------------------------------------------------------------------
# Auth sync
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def auth_sync(request):
    """
    Called by the frontend after Supabase sign-in to ensure a UserProfile row
    exists in the local DB. Accepts a Supabase user object in the body.
    """
    data = request.data
    supabase_id = data.get("id")
    email = data.get("email", "")
    metadata = data.get("user_metadata", {}) or {}
    raw_name = metadata.get("full_name") or data.get("display_name") or ""
    display_name = raw_name.strip() if isinstance(raw_name, str) else ""

    if not supabase_id:
        return Response({"error": "id required"}, status=status.HTTP_400_BAD_REQUEST)

    # Fall back to email prefix or default if name is still empty
    if not display_name and email:
        display_name = email.split("@")[0].strip()
    if not display_name:
        display_name = "Dreamer"

    profile, created = UserProfile.objects.get_or_create(
        supabase_id=supabase_id,
        defaults={"email": email, "display_name": display_name},
    )
    updates = []
    if not profile.email and email:
        profile.email = email
        updates.append("email")
    if display_name and profile.display_name != display_name:
        profile.display_name = display_name
        updates.append("display_name")
    if updates:
        profile.save(update_fields=updates)

    return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Dreams CRUD
# ---------------------------------------------------------------------------

class DreamViewSet(viewsets.ModelViewSet):
    serializer_class = DreamSerializer

    def get_queryset(self):
        user_id = self.request.user.id  # Supabase UUID
        qs = Dream.objects.filter(user__supabase_id=user_id).prefetch_related("tags")

        # Filters
        dream_type = self.request.query_params.get("type")
        mood = self.request.query_params.get("mood")
        q = self.request.query_params.get("q")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if dream_type:
            qs = qs.filter(dream_type=dream_type)
        if mood:
            qs = qs.filter(mood=mood)
        if q:
            qs = qs.filter(
                db_models.Q(title__icontains=q) | db_models.Q(body__icontains=q)
            )
        if date_from:
            qs = qs.filter(dream_date__gte=date_from)
        if date_to:
            qs = qs.filter(dream_date__lte=date_to)

        return qs

    def perform_create(self, serializer):
        user_id = self.request.user.id
        profile = UserProfile.objects.get(supabase_id=user_id)
        serializer.save(user=profile)


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------

@api_view(["GET"])
def dashboard_summary(request):
    user_id = request.user.id
    try:
        profile = UserProfile.objects.get(supabase_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({})

    today = datetime.date.today()
    month_start = today.replace(day=1)
    dreams_this_month = Dream.objects.filter(
        user=profile, dream_date__gte=month_start
    )

    # Streak — count consecutive days with at least one dream (backwards from today)
    streak = 0
    check_date = today
    while True:
        exists = Dream.objects.filter(user=profile, dream_date=check_date).exists()
        if exists:
            streak += 1
            check_date -= datetime.timedelta(days=1)
        else:
            break

    # Total count
    total_dreams = Dream.objects.filter(user=profile).count()

    # Type breakdown this month
    type_counts = dict(
        dreams_this_month.values_list("dream_type").annotate(count=db_models.Count("id"))
    )

    # Mood trend — last 14 days
    two_weeks_ago = today - datetime.timedelta(days=14)
    mood_trend = list(
        Dream.objects.filter(user=profile, dream_date__gte=two_weeks_ago)
        .values("dream_date", "mood")
        .annotate(count=db_models.Count("id"))
        .order_by("dream_date")
    )

    # Most common type this month
    most_common_type = None
    if type_counts:
        most_common_type = max(type_counts, key=type_counts.get)

    # Last dream
    last_dream = Dream.objects.filter(user=profile).first()
    last_dream_data = DreamSerializer(last_dream).data if last_dream else None

    # Latest AI insight (short summary)
    latest_insight = Insight.objects.filter(user=profile).first()
    ai_snippet = None
    if latest_insight:
        text = latest_insight.summary_text
        ai_snippet = text[:200] + ("…" if len(text) > 200 else "")

    return Response(
        {
            "streak": streak,
            "total_dreams": total_dreams,
            "this_month_count": dreams_this_month.count(),
            "type_breakdown": type_counts,
            "most_common_type": most_common_type,
            "mood_trend": mood_trend,
            "last_dream": last_dream_data,
            "ai_snippet": ai_snippet,
        }
    )


# ---------------------------------------------------------------------------
# Patterns overview
# ---------------------------------------------------------------------------

@api_view(["GET"])
def patterns_overview(request):
    user_id = request.user.id
    try:
        profile = UserProfile.objects.get(supabase_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({})

    today = datetime.date.today()
    default_days = getattr(profile, "default_pattern_days", 90) or 90
    days = int(request.query_params.get("days", default_days))
    since = today - datetime.timedelta(days=days)

    dreams_qs = Dream.objects.filter(user=profile, dream_date__gte=since)

    # Type distribution
    type_dist = list(
        dreams_qs.values("dream_type").annotate(count=db_models.Count("id")).order_by("-count")
    )

    # Mood over time (daily)
    mood_over_time = list(
        dreams_qs.values("dream_date", "mood")
        .annotate(count=db_models.Count("id"))
        .order_by("dream_date")
    )

    # Lucidity rate (weekly)
    total = dreams_qs.count()
    lucid_count = dreams_qs.filter(is_lucid=True).count()
    lucidity_rate = round(lucid_count / total * 100, 1) if total else 0

    # Sleep quality vs mood correlation (avg sleep quality per mood)
    sleep_mood = list(
        dreams_qs.values("mood")
        .annotate(avg_sleep=db_models.Avg("sleep_quality"), count=db_models.Count("id"))
        .order_by("mood")
    )

    # Top tags
    from dreams.models import DreamTag
    tag_counts = (
        DreamTag.objects.filter(dream__user=profile, dream__dream_date__gte=since)
        .values("tag__name")
        .annotate(count=db_models.Count("id"))
        .order_by("-count")[:20]
    )
    top_tags = [{"tag": t["tag__name"], "count": t["count"]} for t in tag_counts]

    # All-time stats
    all_dreams = Dream.objects.filter(user=profile)
    all_time = {
        "total": all_dreams.count(),
        "lucid": all_dreams.filter(is_lucid=True).count(),
        "recurring": all_dreams.filter(is_recurring=True).count(),
        "avg_sleep_quality": all_dreams.aggregate(avg=db_models.Avg("sleep_quality"))["avg"],
    }

    return Response(
        {
            "type_distribution": type_dist,
            "mood_over_time": mood_over_time,
            "lucidity_rate": lucidity_rate,
            "sleep_mood_correlation": sleep_mood,
            "top_tags": top_tags,
            "all_time_stats": all_time,
            "period_days": days,
        }
    )


# ---------------------------------------------------------------------------
# AI Insight generation
# ---------------------------------------------------------------------------

@api_view(["POST"])
def generate_insight(request):
    """
    Calls OpenAI to produce a 2-4 sentence narrative insight about recent dreams.
    Caches the result in the Insight table.
    """
    user_id = request.user.id
    try:
        profile = UserProfile.objects.get(supabase_id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    today = datetime.date.today()
    period_start = today - datetime.timedelta(days=30)

    if not getattr(profile, "ai_insights_enabled", True):
        placeholder = "AI Insights are currently paused in your settings. You can re-enable them under Settings > AI & Patterns anytime."
        insight, _ = Insight.objects.update_or_create(
            user=profile,
            period_start=period_start,
            period_end=today,
            defaults={"summary_text": placeholder, "stats_json": {}},
        )
        return Response(InsightSerializer(insight).data)

    recent = Dream.objects.filter(user=profile, dream_date__gte=period_start)
    if not getattr(profile, "include_nightmares_in_ai", True):
        recent = recent.exclude(dream_type="nightmare")

    total = recent.count()

    if total == 0:
        placeholder = "You haven't logged any dreams in the last 30 days. Start by recording tonight's dream — even a few words help reveal patterns over time."
        insight, _ = Insight.objects.update_or_create(
            user=profile,
            period_start=period_start,
            period_end=today,
            defaults={"summary_text": placeholder, "stats_json": {}},
        )
        return Response(InsightSerializer(insight).data)

    # Build compact stats context
    type_counts = dict(recent.values_list("dream_type").annotate(c=db_models.Count("id")))
    mood_counts = dict(recent.values_list("mood").annotate(c=db_models.Count("id")))
    avg_sleep = recent.aggregate(avg=db_models.Avg("sleep_quality"))["avg"]
    lucid_count = recent.filter(is_lucid=True).count()
    recent_titles = list(recent.values_list("title", flat=True)[:5])

    stats = {
        "period": f"{period_start} to {today}",
        "total_dreams": total,
        "dream_types": type_counts,
        "moods": mood_counts,
        "avg_sleep_quality": round(avg_sleep, 1) if avg_sleep else None,
        "lucid_dreams": lucid_count,
        "recent_titles": recent_titles,
    }

    openai_key = settings.OPENAI_API_KEY
    if not openai_key or openai_key.startswith("__"):
        summary = (
            f"You've logged {total} dreams in the past 30 days. "
            f"Your most common dream type is {max(type_counts, key=type_counts.get, default='normal')}. "
            "Add your OpenAI API key to enable deeper AI-powered pattern analysis and personalized insights."
        )
    else:
        try:
            import openai
            openai.api_key = openai_key
            ai_style = getattr(profile, "ai_style", "symbolic")
            style_instruction = {
                "psychological": "Focus on emotional processing, subconscious motives, and internal reflections.",
                "concise": "Be very concise, direct, and punchy. Maximum 2 sentences. No fluff.",
                "symbolic": "Focus on dream symbolism, mythical motifs, and surreal imagery.",
            }.get(ai_style, "Focus on dream symbolism, mythical motifs, and surreal imagery.")

            prompt = f"""You are a thoughtful dream journal assistant. Analyze these dream statistics for a user and write 2-4 sentences of compassionate, insightful pattern observations. {style_instruction} Be specific about what you notice. Don't use clinical language.

Dream statistics (last 30 days):
{json.dumps(stats, indent=2)}

Write a warm, insightful narrative summary."""

            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200,
                temperature=0.7,
            )
            summary = response.choices[0].message.content.strip()
        except Exception as e:
            err_msg = str(e)[:100]
            summary = f"Unable to generate insight at this time ({err_msg}). Your dream data is safe and ready for analysis."

    insight, _ = Insight.objects.update_or_create(
        user=profile,
        period_start=period_start,
        period_end=today,
        defaults={"summary_text": summary, "stats_json": stats},
    )

    return Response(InsightSerializer(insight).data)


# ---------------------------------------------------------------------------
# Settings / Profile
# ---------------------------------------------------------------------------

class UserProfileView(APIView):
    def get(self, request):
        user_id = request.user.id
        try:
            profile = UserProfile.objects.get(supabase_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({}, status=404)
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        user_id = request.user.id
        try:
            profile = UserProfile.objects.get(supabase_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({}, status=404)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request):
        user_id = request.user.id
        try:
            profile = UserProfile.objects.get(supabase_id=user_id)
            profile.delete()
        except UserProfile.DoesNotExist:
            pass

        # Also remove user from Supabase Auth so they can't log in anymore
        supabase_url = getattr(settings, "SUPABASE_URL", "")
        service_role_key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        if supabase_url and service_role_key and user_id:
            try:
                import urllib.request
                import ssl
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                req = urllib.request.Request(
                    f"{supabase_url.rstrip('/')}/auth/v1/admin/users/{user_id}",
                    headers={
                        "apikey": service_role_key,
                        "Authorization": f"Bearer {service_role_key}",
                    },
                    method="DELETE",
                )
                urllib.request.urlopen(req, context=ctx)
            except Exception as e:
                print(f"[ACCOUNT DELETE] Supabase auth user delete warning: {e}")

        return Response(status=status.HTTP_204_NO_CONTENT)
