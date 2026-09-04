from django.contrib import admin

from .models import Answer, Candidate, Message, Question


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 0
    readonly_fields = ('answered_at',)


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('direction', 'text', 'transport', 'external_message_id', 'sent_at', 'metadata')


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('external_id', 'display_name', 'status', 'current_question', 'updated_at')
    list_filter = ('status',)
    search_fields = ('external_id', 'display_name')
    inlines = (AnswerInline, MessageInline)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('position', 'key', 'text', 'is_active')
    list_editable = ('is_active',)
    ordering = ('position',)


admin.site.register(Answer)
admin.site.register(Message)
