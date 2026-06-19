import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "../../../styles/portal-wiki.css";

import { getSelfStudyAssignments, LearnApiError } from "../api/selfStudyApi";
import { PageError, PageLoading } from "../../../components/mui/PageStatus";
import PortalTopbar from "../../../components/PortalTopbar";
import { selfStudyProgressLabel, selfStudyStatusLabel } from "../utils/selfStudyUi";

export default function SelfStudyPage() {
  const [items, setItems] = useState<Awaited<ReturnType<typeof getSelfStudyAssignments>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSelfStudyAssignments()
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof LearnApiError ? err.message : "Не удалось загрузить задания");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="catalog-layout">
        <PortalTopbar active="home" />
        <PageLoading label="Загрузка заданий…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-layout">
        <PortalTopbar active="home" />
        <PageError message={error} />
      </div>
    );
  }

  return (
    <div className="catalog-layout">
      <PortalTopbar active="home" />
      <main className="self-study-shell">
        <Typography variant="h4" fontWeight="bold" component="h1" gutterBottom>
          Самостоятельная работа
        </Typography>
        <Typography color="text.secondary" className="self-study-lead" paragraph>
          Пошаговые задания для самостоятельного выполнения в демо-приложении с проверкой результата.
        </Typography>

        <div className="self-study-list">
          {items.map((item) => (
            <Card key={item.id} variant="outlined" className="self-study-card">
              <CardActionArea component={Link} to={`/self-study/${item.id}`}>
                <CardContent>
                  <div className="self-study-card-header">
                    <Typography variant="h6" fontWeight="bold" component="h2">
                      {item.title}
                    </Typography>
                    <Chip label={selfStudyStatusLabel(item.status)} size="small" />
                  </div>
                  {item.description ? (
                    <Typography color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                  ) : null}
                  <LinearProgress
                    variant="determinate"
                    value={item.progress_percent}
                    className="self-study-progress"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {selfStudyProgressLabel(item.completed_steps, item.total_steps)} ·{" "}
                    {item.progress_percent}%
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
