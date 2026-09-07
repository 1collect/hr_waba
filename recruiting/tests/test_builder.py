import copy
import json

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from recruiting.builder import snapshot
from recruiting.models import Answer, Candidate, Question


class BuilderTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('builder-editor', is_staff=True)
        self.client.force_login(self.user)
        self.url = reverse('recruiting:question-builder-api')

    def post(self, data):
        return self.client.post(self.url, json.dumps(data), content_type='application/json')

    def test_atomic_reorder_add_and_condition_preserves_answers(self):
        data = snapshot()
        first = Question.objects.get(key='full_name')
        candidate = Candidate.objects.create(external_id='test')
        answer = Answer.objects.create(candidate=candidate, question=first, text='Иван')
        data['questions'][0], data['questions'][1] = data['questions'][1], data['questions'][0]
        parent = next(row for row in data['questions'] if row['key'] == 'studying')
        data['questions'].insert(3, {
            'id': 'new-branch', 'text': 'Где учитесь?', 'answer_type': 'text',
            'is_active': True, 'show_if_question': parent['id'], 'show_if_answer': 'Да',
        })
        result = self.post(data)
        self.assertEqual(result.status_code, 200)
        child = Question.objects.get(text='Где учитесь?')
        self.assertEqual(child.show_if_question_id, int(parent['id']))
        self.assertEqual(child.position, 4)
        self.assertEqual(result.json()['id_map']['new-branch'], str(child.pk))
        first.refresh_from_db()
        answer.refresh_from_db()
        self.assertEqual(first.position, 2)
        self.assertEqual(answer.text, 'Иван')
        self.assertEqual(answer.question_id, first.pk)

    def test_invalid_scenario_does_not_partially_save(self):
        original = snapshot()
        cases = []
        for field, value in [('text', ''), ('answer_type', 'unknown'), ('is_active', 'yes'),
                             ('show_if_question', '999999'), ('id', '999999')]:
            data = copy.deepcopy(original)
            data['questions'][1]['text'] = 'Не должно сохраниться'
            data['questions'][0][field] = value
            cases.append(data)
        removed = copy.deepcopy(original)
        removed['questions'].pop()
        cases.append(removed)
        duplicate = copy.deepcopy(original)
        duplicate['questions'].append(duplicate['questions'][0])
        cases.append(duplicate)
        for data in cases:
            with self.subTest(data=data):
                self.assertEqual(self.post(data).status_code, 400)
                self.assertEqual(snapshot(), original)

    def test_conflicting_revision_is_rejected(self):
        data = snapshot()
        question = Question.objects.first()
        question.text = 'Изменено в другом окне'
        question.save()
        self.assertEqual(self.post(data).status_code, 409)
        question.refresh_from_db()
        self.assertEqual(question.text, 'Изменено в другом окне')

    def test_archiving_keeps_history(self):
        data = snapshot()
        question = Question.objects.first()
        candidate = Candidate.objects.create(external_id='archive-test')
        Answer.objects.create(candidate=candidate, question=question, text='Ответ')
        data['questions'][0]['is_active'] = False
        self.assertEqual(self.post(data).status_code, 200)
        question.refresh_from_db()
        self.assertFalse(question.is_active)
        self.assertEqual(candidate.answers.get().text, 'Ответ')

    def test_invalid_branch_parent_and_answer_are_rejected(self):
        base = snapshot()
        for parent_index, answer in [(0, 'Да'), (2, 'Возможно')]:
            data = copy.deepcopy(base)
            data['questions'][3]['show_if_question'] = data['questions'][parent_index]['id']
            data['questions'][3]['show_if_answer'] = answer
            self.assertEqual(self.post(data).status_code, 400)
        data = copy.deepcopy(base)
        data['questions'][2]['is_active'] = False
        data['questions'][3].update(show_if_question=data['questions'][2]['id'], show_if_answer='Да')
        self.assertEqual(self.post(data).status_code, 400)

    def test_auth_csrf_and_malformed_payload(self):
        self.client.logout()
        self.assertEqual(self.client.get(self.url).status_code, 302)
        self.assertEqual(self.post(snapshot()).status_code, 302)
        self.client.force_login(self.user)
        csrf = Client(enforce_csrf_checks=True)
        csrf.force_login(self.user)
        self.assertEqual(csrf.post(self.url, '{}', content_type='application/json').status_code, 403)
        for payload in ([], None, {}, {'questions': 'no'}):
            self.assertEqual(self.post(payload).status_code, 400)
        self.assertEqual(self.client.post(self.url, '{', content_type='application/json').status_code, 400)

    def test_page_contains_builder_bootstrap(self):
        response = self.client.get(reverse('recruiting:questions'))
        self.assertContains(response, 'id="flow-builder"')
        self.assertContains(response, 'js/builder.js')
        self.assertEqual(response.context['builder_data']['revision'], snapshot()['revision'])
