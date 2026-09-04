from django.db import models


class Candidate(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'Новый'
        SURVEY_IN_PROGRESS = 'survey_in_progress', 'Проходит анкету'
        SURVEY_COMPLETED = 'survey_completed', 'Анкета заполнена'
        CONTACTED = 'contacted', 'Связались'
        REJECTED = 'rejected', 'Отклонён'
        HIRED = 'hired', 'Нанят'

    external_id = models.CharField('номер / идентификатор', max_length=64, unique=True)
    display_name = models.CharField('имя в мессенджере', max_length=255, blank=True)
    status = models.CharField(
        'статус', max_length=32, choices=Status.choices, default=Status.NEW, db_index=True
    )
    current_question = models.ForeignKey(
        'Question', verbose_name='текущий вопрос', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='current_candidates'
    )
    survey_started_at = models.DateTimeField('анкета начата', null=True, blank=True)
    survey_completed_at = models.DateTimeField('анкета завершена', null=True, blank=True)
    typing_until = models.DateTimeField('печатает до', null=True, blank=True)
    created_at = models.DateTimeField('создан', auto_now_add=True)
    updated_at = models.DateTimeField('обновлён', auto_now=True)

    class Meta:
        ordering = ('-updated_at',)
        verbose_name = 'кандидат'
        verbose_name_plural = 'кандидаты'

    def __str__(self):
        return self.display_name or self.external_id


class Question(models.Model):
    text = models.TextField('текст вопроса')
    key = models.SlugField('ключ', max_length=64, unique=True)
    position = models.PositiveIntegerField('порядок', unique=True)
    is_active = models.BooleanField('активен', default=True)
    created_at = models.DateTimeField('создан', auto_now_add=True)

    class Meta:
        ordering = ('position',)
        verbose_name = 'вопрос'
        verbose_name_plural = 'вопросы'

    def __str__(self):
        return f'{self.position}. {self.text}'


class Answer(models.Model):
    candidate = models.ForeignKey(
        Candidate, verbose_name='кандидат', on_delete=models.CASCADE, related_name='answers'
    )
    question = models.ForeignKey(
        Question, verbose_name='вопрос', on_delete=models.PROTECT, related_name='answers'
    )
    text = models.TextField('ответ')
    answered_at = models.DateTimeField('получен', auto_now_add=True)

    class Meta:
        ordering = ('question__position',)
        constraints = [
            models.UniqueConstraint(fields=('candidate', 'question'), name='unique_candidate_question_answer')
        ]
        verbose_name = 'ответ'
        verbose_name_plural = 'ответы'

    def __str__(self):
        return f'{self.candidate}: {self.question.key}'


class Message(models.Model):
    class Direction(models.TextChoices):
        INCOMING = 'incoming', 'Входящее'
        OUTGOING = 'outgoing', 'Исходящее'

    candidate = models.ForeignKey(
        Candidate, verbose_name='кандидат', on_delete=models.CASCADE, related_name='messages'
    )
    direction = models.CharField('направление', max_length=8, choices=Direction.choices)
    text = models.TextField('текст')
    transport = models.CharField('транспорт', max_length=32)
    external_message_id = models.CharField(
        'ID сообщения транспорта', max_length=255, null=True, blank=True, unique=True
    )
    sent_at = models.DateTimeField('время сообщения', db_index=True)
    metadata = models.JSONField('метаданные', default=dict, blank=True)

    class Meta:
        ordering = ('sent_at', 'id')
        verbose_name = 'сообщение'
        verbose_name_plural = 'сообщения'

    def __str__(self):
        return f'{self.get_direction_display()}: {self.text[:50]}'
