"""Atomic questionnaire editing shared by the visual builder and its API."""
import hashlib
import json
import re
from uuid import uuid4

from django.db import transaction

from .models import Question


class BuilderConflict(ValueError):
    pass


def snapshot(questions=None):
    rows = [{
        'id': str(q.pk), 'key': q.key, 'text': q.text, 'answer_type': q.answer_type,
        'is_active': q.is_active,
        'show_if_question': str(q.show_if_question_id) if q.show_if_question_id else None,
        'show_if_answer': q.show_if_answer,
    } for q in (questions if questions is not None else Question.objects.all())]
    revision = hashlib.sha256(json.dumps(rows, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    return {'questions': rows, 'revision': revision}


@transaction.atomic
def save_scenario(payload):
    existing = list(Question.objects.select_for_update().all())
    if not isinstance(payload, dict) or not isinstance(payload.get('questions'), list):
        raise ValueError('Передайте список вопросов.')
    if payload.get('revision') != snapshot(existing)['revision']:
        raise BuilderConflict('Анкета уже изменена в другом окне. Скопируйте свои изменения и обновите страницу.')
    rows = payload['questions']
    if len(rows) > 200:
        raise ValueError('В одном сценарии может быть до 200 блоков.')
    known = {str(q.pk): q for q in existing}
    seen = {}
    for index, row in enumerate(rows, 1):
        if not isinstance(row, dict):
            raise ValueError('Некорректный блок.')
        identifier = row.get('id')
        if not isinstance(identifier, str) or identifier in seen:
            raise ValueError('У каждого блока должен быть уникальный идентификатор.')
        if identifier not in known and not re.fullmatch(r'new-[a-zA-Z0-9-]{1,80}', identifier):
            raise ValueError('Неизвестный блок. Обновите страницу.')
        text = row.get('text')
        if not isinstance(text, str) or not 1 <= len(text.strip()) <= 650:
            raise ValueError(f'Блок {index}: введите текст от 1 до 650 символов.')
        if row.get('answer_type') not in Question.AnswerType.values:
            raise ValueError(f'Блок {index}: выберите тип ответа.')
        if not isinstance(row.get('is_active'), bool):
            raise ValueError(f'Блок {index}: некорректный статус.')
        parent_id = row.get('show_if_question')
        if parent_id is not None:
            if not isinstance(parent_id, str) or parent_id not in seen:
                raise ValueError(f'Блок {index}: условие должно ссылаться на предыдущий блок.')
            parent = seen[parent_id]
            if parent['answer_type'] != 'yes_no' or (row['is_active'] and not parent['is_active']):
                raise ValueError(f'Блок {index}: условие требует включённого вопроса «Да / Нет».')
            if row.get('show_if_answer') not in ('Да', 'Нет'):
                raise ValueError(f'Блок {index}: выберите ответ для условия.')
        seen[identifier] = row
    if not known.keys() <= seen.keys():
        raise ValueError('Существующие блоки можно выключить. Их удаление вместе с историей ответов недоступно.')

    # Move old positions out of the destination range before applying a permutation.
    offset = max([q.position for q in existing] + [len(rows)]) + len(rows) + 1
    for index, question in enumerate(existing):
        Question.objects.filter(pk=question.pk).update(position=offset + index)
    saved = {}
    for index, row in enumerate(rows, 1):
        question = known.get(row['id']) or Question(key=f'question_{uuid4().hex}')
        question.position = index
        question.text = row['text'].strip()
        question.answer_type = row['answer_type']
        question.is_active = row['is_active']
        question.show_if_question = saved.get(row.get('show_if_question'))
        question.show_if_answer = row.get('show_if_answer', '') if question.show_if_question else ''
        question.save()
        saved[row['id']] = question
    result = snapshot()
    result['id_map'] = {key: str(value.pk) for key, value in saved.items()}
    return result
