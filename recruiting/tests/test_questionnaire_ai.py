import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from recruiting.questionnaire_ai import LocalQuestionnaireAnalyzer, OpenAIQuestionnaireAnalyzer


def question(pk, position, text, answer_type='text'):
    return SimpleNamespace(pk=pk, position=position, text=text, answer_type=answer_type)


class LocalQuestionnaireAnalyzerTests(SimpleTestCase):
    def test_extracts_numbered_and_line_separated_answers(self):
        questions = [question(10, 1, 'Ваше имя?'), question(20, 2, 'Ваш город?')]
        analyzer = LocalQuestionnaireAnalyzer()

        numbered = analyzer.extract('1. Иван Петров\n2. Алматы', questions)
        lines = analyzer.extract('Иван Петров\nАлматы', questions)

        self.assertEqual([(item.question_id, item.text) for item in numbered], [(10, 'Иван Петров'), (20, 'Алматы')])
        self.assertEqual([(item.question_id, item.text) for item in lines], [(10, 'Иван Петров'), (20, 'Алматы')])

    def test_decimal_is_not_mistaken_for_a_numbered_answer(self):
        questions = [question(10, 1, 'Возраст?', 'number'), question(20, 2, 'Город?')]

        answers = LocalQuestionnaireAnalyzer().extract('1.5', questions)

        self.assertEqual([(item.question_id, item.text) for item in answers], [(10, '1.5')])


class OpenAIQuestionnaireAnalyzerTests(SimpleTestCase):
    @patch('recruiting.questionnaire_ai.request.urlopen')
    def test_uses_structured_responses_output(self, urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps({
            'output': [{
                'type': 'message',
                'content': [{
                    'type': 'output_text',
                    'text': json.dumps({'answers': [
                        {'question_id': 10, 'answer': 'Иван Петров', 'evidence': 'Иван Петров'},
                        {'question_id': 20, 'answer': 'Алматы', 'evidence': 'Алматы'},
                    ]}),
                }],
            }],
        }).encode()
        urlopen.return_value.__enter__.return_value = response
        analyzer = OpenAIQuestionnaireAnalyzer('test-key', model='test-model')

        answers = analyzer.extract(
            'Меня зовут Иван Петров, живу в Алматы',
            [question(10, 1, 'Ваше имя?'), question(20, 2, 'Ваш город?')],
        )

        self.assertEqual([(item.question_id, item.text) for item in answers], [(10, 'Иван Петров'), (20, 'Алматы')])
        api_request = urlopen.call_args.args[0]
        payload = json.loads(api_request.data)
        self.assertEqual(payload['model'], 'test-model')
        self.assertEqual(payload['text']['format']['type'], 'json_schema')
        self.assertEqual(api_request.headers['Authorization'], 'Bearer test-key')

    @patch('recruiting.questionnaire_ai.request.urlopen')
    def test_discards_answer_when_evidence_is_not_in_candidate_message(self, urlopen):
        response = MagicMock()
        response.read.return_value = json.dumps({
            'output': [{
                'type': 'message',
                'content': [{
                    'type': 'output_text',
                    'text': json.dumps({'answers': [{
                        'question_id': 10,
                        'answer': 'Иван Петров',
                        'evidence': 'Иван Петров',
                    }]}),
                }],
            }],
        }).encode()
        urlopen.return_value.__enter__.return_value = response

        answers = OpenAIQuestionnaireAnalyzer('test-key').extract(
            'Здравствуйте', [question(10, 1, 'Ваше имя?')],
        )

        self.assertEqual(answers, [])
