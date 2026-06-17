import { Loader } from "@consta/uikit/Loader";
import { Text } from "@consta/uikit/Text";

type PageLoadingProps = {
  label?: string;
};

export function PageLoading({ label = "Загрузка…" }: PageLoadingProps) {
  return (
    <div className="page-status">
      <Loader size="m" />
      <Text size="m" view="secondary">
        {label}
      </Text>
    </div>
  );
}

type PageErrorProps = {
  message: string;
};

export function PageError({ message }: PageErrorProps) {
  return (
    <div className="page-status page-status-error">
      <Text size="m" view="alert">
        {message}
      </Text>
    </div>
  );
}
