from django.db import migrations


def seed(apps, schema_editor):
    Question = apps.get_model('recruiting', 'Question')
    db = schema_editor.connection.alias
    questions = Question.objects.using(db)
    for question in questions.order_by('-position'):
        questions.filter(pk=question.pk).update(position=question.position + 6)
    questions.filter(key__in=['city', 'desired_position', 'experience', 'schedule', 'salary']).update(is_active=False)
    for position, (key, text, answer_type) in enumerate([
        ('full_name', 'Ваше полное ФИО?', 'text'),
        ('age', 'Сколько Вам лет?', 'number'),
        ('studying', 'Учитесь ли Вы сейчас?', 'yes_no'),
        ('criminal_record', 'Имеется ли у Вас судимость?', 'yes_no'),
        ('bank_restrictions', 'Имеется ли арест или ограничение на банковских счетах?', 'yes_no'),
        ('last_workplace', 'Ваше последнее место работы?', 'text'),
    ], 1):
        questions.update_or_create(key=key, defaults={
            'position': position, 'text': text, 'answer_type': answer_type, 'is_active': True,
        })


class Migration(migrations.Migration):
    dependencies = [('recruiting', '0004_candidate_question_needs_prompt_question_answer_type_and_more')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
