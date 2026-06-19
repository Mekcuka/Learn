import Typography from "@mui/material/Typography";

import { Link } from "react-router-dom";



import type { ModuleLessonOutlineItem } from "../../../types/lesson";



import styles from "./LessonRoadmap.module.css";



export type LessonRoadmapProps = {

  lessons: ModuleLessonOutlineItem[];

  currentLessonId: string;

  linkTo: (lessonId: string) => string;

  className?: string;

  /** When true, the active segment shows order only (full title lives beside the roadmap). */

  abbreviateCurrentLabel?: boolean;

};



export default function LessonRoadmap({

  lessons,

  currentLessonId,

  linkTo,

  className,

  abbreviateCurrentLabel = false,

}: LessonRoadmapProps) {

  const sorted = [...lessons].sort((a, b) => a.order - b.order);



  if (sorted.length === 0) {

    return null;

  }



  const rootClass = [styles.root, className].filter(Boolean).join(" ");



  return (

    <nav className={rootClass} aria-label="Прогресс по модулю">

      <ol className={styles.track}>

        {sorted.map((lesson, index) => {

          const isCurrent = lesson.id === currentLessonId;

          const isCompleted = lesson.status === "completed";

          const isLocked = lesson.status === "locked";

          const isUpcoming = !isCurrent && !isCompleted && !isLocked;

          const segmentClass = [

            styles.segment,

            isCurrent && styles.segmentCurrent,

            isCompleted && styles.segmentCompleted,

            isUpcoming && styles.segmentUpcoming,

            isLocked && styles.segmentLocked,

          ]

            .filter(Boolean)

            .join(" ");



          const segmentLabel =

            isCurrent && abbreviateCurrentLabel ? `Урок ${lesson.order}` : lesson.title;



          const label = (

            <Typography variant="caption" component="span" className={styles.label} noWrap>

              {segmentLabel}

            </Typography>

          );



          const segmentAriaLabel =

            isCurrent && abbreviateCurrentLabel ? `${lesson.title}, текущий урок` : undefined;



          return (

            <li

              key={lesson.id}

              className={segmentClass}

              style={{ zIndex: sorted.length - index }}

              aria-current={isCurrent ? "step" : undefined}

            >

              {isLocked ? (

                <span className={styles.link} title="Сначала завершите предыдущий урок">

                  {label}

                </span>

              ) : (

                <Link

                  to={linkTo(lesson.id)}

                  className={styles.link}

                  aria-label={segmentAriaLabel}

                >

                  {label}

                </Link>

              )}

            </li>

          );

        })}

      </ol>

    </nav>

  );

}


