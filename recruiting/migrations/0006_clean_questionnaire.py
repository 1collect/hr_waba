from django.db import migrations


def clean_questionnaire(apps, schema_editor):
    Question = apps.get_model('recruiting', 'Question')
    questions = Question.objects.using(schema_editor.connection.alias)
    requested = [
        ('full_name', 'Ваше полное ФИО?', 'text'),
        ('age', 'Сколько Вам лет?', 'number'),
        ('studying', 'Учитесь ли Вы сейчас?', 'yes_no'),
        ('criminal_record', 'Имеется ли у Вас судимость?', 'yes_no'),
        ('bank_restrictions', 'Имеется ли арест или ограничение на банковских счетах?', 'yes_no'),
        ('last_workplace', 'Ваше последнее место работы?', 'text'),
    ]
    existing = list(questions.order_by('position'))
    offset = max([q.position for q in existing] + [0]) + len(requested) + 1
    for index, question in enumerate(existing):
        questions.filter(pk=question.pk).update(position=offset + index)
    questions.update(is_active=False)
    for position, (key, text, answer_type) in enumerate(requested, 1):
        questions.update_or_create(key=key, defaults={
            'text': text,
            'position': position,
            'answer_type': answer_type,
            'is_active': True,
            'show_if_question_id': None,
            'show_if_answer': '',
        })
    # Keep disabled questions and their historical answers after the active form.
    for position, question in enumerate(questions.filter(is_active=False), len(requested) + 1):
        questions.filter(pk=question.pk).update(position=position)


class Migration(migrations.Migration):
    dependencies = [('recruiting', '0005_requested_questionnaire')]
    operations = [migrations.RunPython(clean_questionnaire, migrations.RunPython.noop)]
