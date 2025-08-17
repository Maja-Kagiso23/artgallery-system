from django.contrib import admin

# Register your models here.
from .models import (
    Artist,
    ArtPiece,
    Exhibition,
    ExhibitionArtPiece,
    Visitor,
    Registration,
    Clerk,
    SetupStatus
)

admin.site.register(Artist)
admin.site.register(ArtPiece)
admin.site.register(Exhibition)
admin.site.register(ExhibitionArtPiece)
admin.site.register(Visitor)
admin.site.register(Registration)
admin.site.register(Clerk)
admin.site.register(SetupStatus)

