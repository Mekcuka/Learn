import SafeHtml from "./SafeHtml";

type ExpectedResultProps = {
  html: string;
};

export default function ExpectedResult({ html }: ExpectedResultProps) {
  if (!html?.trim()) {
    return null;
  }

  return (
    <aside className="expected-result">
      <h3>Ожидаемый результат</h3>
      <SafeHtml html={html} />
    </aside>
  );
}
