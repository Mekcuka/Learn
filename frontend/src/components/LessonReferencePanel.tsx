import { type ReactNode } from "react";
import { Link } from "react-router-dom";

import type { LessonDetail, LessonSlide } from "../api/learnApi";
import SafeHtml from "./SafeHtml";

type LessonReferencePanelProps = {
  lesson: LessonDetail;
  slide: LessonSlide | null;
  slideIndex: number;
  slideTotal: number;
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string | null) => void;
};

function ReferenceSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`lesson-ref-section${className ? ` ${className}` : ""}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export default function LessonReferencePanel({
  lesson,
  slide,
  slideIndex,
  slideTotal,
  activeHotspotId,
  onHotspotSelect,
}: LessonReferencePanelProps) {
  const hotspots = slide?.hotspots ?? [];

  return (
    <aside className="lesson-reference-panel" aria-label="Справочная информация">
      {lesson.instruction_html?.trim() && (
        <ReferenceSection title="Задание">
          <SafeHtml html={lesson.instruction_html} className="lesson-ref-body" />
        </ReferenceSection>
      )}

      {slide && slideTotal > 0 && (
        <ReferenceSection title="Текущий слайд">
          <p className="lesson-ref-slide-meta">
            {slideIndex + 1} из {slideTotal} · {slide.title}
          </p>
        </ReferenceSection>
      )}

      {slide?.caption_html?.trim() && (
        <ReferenceSection title="Подсказка">
          <SafeHtml html={slide.caption_html} className="lesson-ref-body" />
        </ReferenceSection>
      )}

      {slide?.expected_result_html?.trim() && (
        <ReferenceSection title="Ожидаемый результат" className="lesson-ref-expected">
          <SafeHtml html={slide.expected_result_html} className="lesson-ref-body" />
        </ReferenceSection>
      )}

      {hotspots.length > 0 && (
        <ReferenceSection title="На скрине">
          <ul className="lesson-ref-hotspots">
            {hotspots.map((hotspot) => (
              <li key={hotspot.id}>
                <button
                  type="button"
                  className={`lesson-ref-hotspot-btn ${activeHotspotId === hotspot.id ? "active" : ""}`}
                  onClick={() =>
                    onHotspotSelect?.(activeHotspotId === hotspot.id ? null : hotspot.id)
                  }
                >
                  {hotspot.pulse !== false && <span className="lesson-ref-hotspot-dot" aria-hidden="true" />}
                  {hotspot.label}
                </button>
              </li>
            ))}
          </ul>
        </ReferenceSection>
      )}

      {lesson.verify.type === "quiz_passed" && lesson.quiz && (
        <ReferenceSection title="Квиз">
          <p className="lesson-ref-body">
            Ответьте на {lesson.quiz.questions.length} вопросов. Для зачёта нужно{" "}
            {lesson.quiz.pass_threshold_percent}% правильных ответов.
          </p>
        </ReferenceSection>
      )}

      <ReferenceSection title={`Модуль «${lesson.module_title}»`}>
        <ol className="lesson-ref-outline">
          {lesson.module_lessons.map((item) => {
            const locked = item.status === "locked";
            return (
              <li
                key={item.id}
                className={`outline-item outline-${item.status} ${item.id === lesson.id ? "outline-current" : ""}`}
              >
                {locked ? (
                  <span title="Сначала завершите предыдущий урок">
                    {item.order}. {item.title}
                  </span>
                ) : (
                  <Link to={`/lessons/${item.id}`}>
                    {item.order}. {item.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </ReferenceSection>
    </aside>
  );
}
