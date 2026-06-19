/** Static catalog of /content/ assets for image picker in wiki editor. */
export const CONTENT_ASSET_PATHS: string[] = [
  "/content/placeholder-slide.svg",
  "/content/orientation-v1/lesson-01-login/slide-01.svg",
  "/content/orientation-v1/lesson-01-login/slide-02.svg",
  "/content/orientation-v1/lesson-02-create-project/slide-01.svg",
  "/content/orientation-v1/lesson-02-create-project/slide-02.svg",
  "/content/orientation-v1/lesson-02-create-project/slide-03.svg",
  "/content/orientation-v1/lesson-03-navigation/slide-01.svg",
  "/content/orientation-v1/lesson-03-navigation/slide-02.svg",
  "/content/orientation-v1/lesson-04-job-journal/slide-01.svg",
  "/content/orientation-v1/lesson-04-job-journal/slide-02.svg",
];

export function contentAssetLabel(path: string): string {
  const parts = path.replace("/content/", "").split("/");
  return parts.slice(-2).join(" / ");
}
