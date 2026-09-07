from django import forms

from .models import Question


class QuestionForm(forms.ModelForm):
    text = forms.CharField(label='Вопрос', max_length=650, widget=forms.Textarea(attrs={
        'class': 'input', 'rows': 3, 'placeholder': 'Введите вопрос кандидату',
    }))
    class Meta:
        model = Question
        fields = ('text', 'answer_type', 'show_if_question', 'show_if_answer', 'is_active')
        labels = {'text': 'Вопрос', 'is_active': 'Включён'}
        widgets = {
            'text': forms.Textarea(attrs={
                'class': 'input', 'rows': 3,
                'placeholder': 'Введите вопрос кандидату',
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['answer_type'].required = False
        parents = Question.objects.filter(answer_type=Question.AnswerType.YES_NO, is_active=True)
        if self.instance.pk:
            parents = parents.filter(position__lt=self.instance.position)
        self.fields['show_if_question'].queryset = parents
        self.fields['show_if_question'].empty_label = 'Всегда показывать'
        for name in ('answer_type', 'show_if_question', 'show_if_answer'):
            self.fields[name].widget.attrs['class'] = 'input'

    def clean(self):
        data = super().clean()
        data['answer_type'] = data.get('answer_type') or self.instance.answer_type or Question.AnswerType.TEXT
        parent = data.get('show_if_question')
        if parent and not data.get('show_if_answer'):
            self.add_error('show_if_answer', 'Выберите «Да» или «Нет» для условия.')
        if not parent:
            data['show_if_answer'] = ''
        if self.instance.pk and self.instance.conditional_questions.exists():
            if data['answer_type'] != Question.AnswerType.YES_NO or not data.get('is_active'):
                self.add_error(None, 'Сначала уберите условия у зависимых вопросов.')
        return data
