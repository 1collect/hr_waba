from django import forms

from .models import Question


class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ('text', 'is_active')
        labels = {'text': 'Вопрос', 'is_active': 'Включён'}
        widgets = {
            'text': forms.Textarea(attrs={
                'class': 'input', 'rows': 3,
                'placeholder': 'Введите вопрос кандидату',
            }),
        }
