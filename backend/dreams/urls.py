from django.urls import path, include
from rest_framework.routers import DefaultRouter
from dreams import views

router = DefaultRouter()
router.register(r"dreams", views.DreamViewSet, basename="dream")

urlpatterns = [
    path("health/", views.health_check, name="health"),
    path("auth/sync/", views.auth_sync, name="auth-sync"),
    path("dashboard/summary/", views.dashboard_summary, name="dashboard-summary"),
    path("patterns/overview/", views.patterns_overview, name="patterns-overview"),
    path("patterns/insight/", views.generate_insight, name="generate-insight"),
    path("settings/profile/", views.UserProfileView.as_view(), name="user-profile"),
    path("", include(router.urls)),
]
