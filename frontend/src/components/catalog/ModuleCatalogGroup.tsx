import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import Accordion from "@mui/material/Accordion";

import AccordionDetails from "@mui/material/AccordionDetails";

import AccordionSummary from "@mui/material/AccordionSummary";

import Chip from "@mui/material/Chip";

import LinearProgress from "@mui/material/LinearProgress";

import Paper from "@mui/material/Paper";

import Stack from "@mui/material/Stack";

import Typography from "@mui/material/Typography";

import { type MouseEvent } from "react";



import type { LessonListItem, ModuleDashboardItem } from "../../types/lesson";

import { moduleProgressLabel } from "../../utils/lessonUi";

import LessonCatalogCard from "./LessonCatalogCard";



type ModuleCatalogGroupProps = {

  module: ModuleDashboardItem;

  lessons: LessonListItem[];

  collapsible?: boolean;

  defaultExpanded?: boolean;

  activeTag?: string | null;

  onTagClick?: (tag: string, event: MouseEvent) => void;

};



function lessonCountChipLabel(lessonCount: number): string {

  const lessonWord =

    lessonCount === 1 ? "урок" : lessonCount >= 2 && lessonCount <= 4 ? "урока" : "уроков";

  return `${lessonCount} ${lessonWord}`;

}



function ModuleHeader({ module, lessonCount }: { module: ModuleDashboardItem; lessonCount: number }) {

  return (

    <Stack spacing={1} className="catalog-module-group-header" sx={{ width: "100%", minWidth: 0 }}>

      <Stack spacing={0.5} className="catalog-module-group-heading">

        <Typography variant="h6" fontWeight={700} component="h2">

          {module.title}

        </Typography>

        {module.description && (

          <Typography variant="body2" color="text.secondary" className="catalog-module-group-description">

            {module.description}

          </Typography>

        )}

      </Stack>

      <Stack

        direction="row"

        flexWrap="wrap"

        alignItems="center"

        gap={1}

        className="catalog-module-group-meta"

      >

        <Chip size="small" variant="outlined" label={lessonCountChipLabel(lessonCount)} />

        <Typography variant="caption" color="text.secondary" className="catalog-module-group-progress-text">

          {moduleProgressLabel(module.completed_lessons, module.total_lessons)}

        </Typography>

        <LinearProgress

          variant="determinate"

          value={module.progress_percent}

          className="catalog-module-group-progress"

          aria-label={`Прогресс модуля ${module.title}`}

        />

      </Stack>

    </Stack>

  );

}



function LessonGrid({

  lessons,

  activeTag,

  onTagClick,

}: {

  lessons: LessonListItem[];

  activeTag?: string | null;

  onTagClick?: (tag: string, event: MouseEvent) => void;

}) {

  return (

    <div className="catalog-grid catalog-module-group-grid">

      {lessons.map((lesson) => (

        <LessonCatalogCard

          key={lesson.id}

          lesson={lesson}

          activeTag={activeTag}

          onTagClick={onTagClick}

        />

      ))}

    </div>

  );

}



export default function ModuleCatalogGroup({

  module,

  lessons,

  collapsible = true,

  defaultExpanded = true,

  activeTag,

  onTagClick,

}: ModuleCatalogGroupProps) {

  if (!collapsible) {

    return (

      <Paper

        component="section"

        variant="outlined"

        className="catalog-module-group catalog-module-group-static"

        aria-label={module.title}

        sx={{
          margin: 0,
          "& > .catalog-module-group-header": {
            marginTop: "10px",
            marginBottom: "10px",
          },
        }}

      >

        <ModuleHeader module={module} lessonCount={lessons.length} />

        <LessonGrid lessons={lessons} activeTag={activeTag} onTagClick={onTagClick} />

      </Paper>

    );

  }



  return (

    <Accordion

      defaultExpanded={defaultExpanded}

      disableGutters

      elevation={0}

      className="catalog-module-group"

      sx={{

        margin: 0,

        "&::before": { display: "none" },

      }}

    >

      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        className="catalog-module-group-summary"
        sx={{ marginTop: "10px", marginBottom: "10px" }}
      >

        <ModuleHeader module={module} lessonCount={lessons.length} />

      </AccordionSummary>

      <AccordionDetails className="catalog-module-group-details">

        <LessonGrid lessons={lessons} activeTag={activeTag} onTagClick={onTagClick} />

      </AccordionDetails>

    </Accordion>

  );

}


