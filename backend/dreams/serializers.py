"""
DRF serializers for ObsidianDreams.
"""
from rest_framework import serializers
from dreams.models import Dream, Tag, Insight, UserProfile


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class DreamSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        write_only=True,
    )
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)
    excerpt = serializers.SerializerMethodField()

    class Meta:
        model = Dream
        fields = [
            "id",
            "title",
            "body",
            "dream_date",
            "dream_type",
            "mood",
            "sleep_quality",
            "is_lucid",
            "is_recurring",
            "input_method",
            "tags",
            "tags_detail",
            "excerpt",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "tags_detail", "excerpt"]

    def get_excerpt(self, obj):
        body = obj.body or ""
        return body[:200] + ("…" if len(body) > 200 else "")

    def create(self, validated_data):
        tags_data = validated_data.pop("tags", [])
        dream = Dream.objects.create(**validated_data)
        self._set_tags(dream, tags_data)
        return dream

    def update(self, instance, validated_data):
        tags_data = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags_data is not None:
            self._set_tags(instance, tags_data)
        return instance

    def _set_tags(self, dream, tag_names):
        dream.tags.clear()
        for name in tag_names:
            name = name.strip().lower()
            if name:
                tag, _ = Tag.objects.get_or_create(name=name)
                dream.tags.add(tag)


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = [
            "id",
            "period_start",
            "period_end",
            "summary_text",
            "stats_json",
            "generated_at",
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        trim_whitespace=True,
        error_messages={
            "blank": "Display name is required.",
            "required": "Display name is required.",
        },
    )

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "supabase_id",
            "email",
            "display_name",
            "timezone",
            "theme_preference",
            "created_at",
        ]
        read_only_fields = ["id", "supabase_id", "email", "created_at"]
