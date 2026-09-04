from django.db import migrations


QUESTIONS = (
    ('full_name', 1, 'Как вас зовут? Укажите, пожалуйста, имя и фамилию.'),
    ('city', 2, 'В каком городе вы живёте?'),
    ('desired_position', 3, 'Какая должность или направление вас интересует?'),
    ('experience', 4, 'Расскажите кратко о вашем релевантном опыте работы.'),
    ('schedule', 5, 'Какой формат и график работы вам подходит?'),
    ('salary', 6, 'Какие у вас зарплатные ожидания?'),
)


def seed_questions(apps, schema_editor):
    Question = apps.get_model('recruiting', 'Question')
    for key, position, text in QUESTIONS:
        Question.objects.update_or_create(
            key=key,
            defaults={'position': position, 'text': text, 'is_active': True},
        )


def remove_seeded_questions(apps, schema_editor):
    Question = apps.get_model('recruiting', 'Question')
    Question.objects.filter(key__in=[item[0] for item in QUESTIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [('recruiting', '0001_initial')]
    operations = [migrations.RunPython(seed_questions, remove_seeded_questions)]
