export function buildDeepLink(
  template: string | null,
  options: { returnUrl?: string; projectId?: string | null },
): string | null {
  if (!template) {
    return null;
  }

  let url = template;
  if (options.projectId) {
    url = url.replace("{project_id}", options.projectId);
  } else {
    url = url.replace("/{project_id}", "").replace("{project_id}", "");
  }

  if (options.returnUrl) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}return_url=${encodeURIComponent(options.returnUrl)}`;
  }

  return url;
}

export function lessonReturnUrl(lessonId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/lessons/${lessonId}`;
}
