import { QuizQuestionItem } from '../utils/quizGenerator';

type Props = {
  question: QuizQuestionItem;
  selected?: string;
  onSelect: (option: string) => void;
  showAnswer: boolean;
};

export default function QuizQuestion({ question, selected, onSelect, showAnswer }: Props) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>題目：{question.prompt}</h3>
      <div className="grid two">
        {question.options.map(opt => {
          const isCorrect = opt === question.answer;
          const isSelected = selected === opt;
          const state = showAnswer
            ? isCorrect
              ? 'correct'
              : isSelected
                ? 'wrong'
                : ''
            : isSelected
              ? 'picked'
              : '';
          return (
            <button
              key={opt}
              className={`btn secondary quiz-option ${state}`}
              onClick={() => onSelect(opt)}
              disabled={showAnswer}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <style>{`
        .quiz-option { width: 100%; text-align: left; }
        .quiz-option.correct { background: #dcfce7; color: #065f46; }
        .quiz-option.wrong { background: #fee2e2; color: #991b1b; }
        .quiz-option.picked { outline: 2px solid #1d4ed8; }
      `}</style>
    </div>
  );
}
