import { memo, useEffect, useMemo, useRef } from "react";



import { splitContentHtml } from "../utils/contentHtml";



type ContentHtmlProps = {

  html: string;

  className?: string;

};



function ContentHtml({ html, className }: ContentHtmlProps) {

  const bodyRef = useRef<HTMLDivElement>(null);

  const popupRef = useRef<HTMLDivElement | null>(null);



  const { bodyHtml, footnotesHtml, hasFootnotes } = useMemo(() => splitContentHtml(html), [html]);



  useEffect(() => {

    if (bodyRef.current === null) {

      return;

    }

    const host: HTMLDivElement = bodyRef.current;



    function closePopup() {

      popupRef.current?.remove();

      popupRef.current = null;

      host.querySelectorAll(".learn-popup[aria-expanded='true']").forEach((node) => {

        node.setAttribute("aria-expanded", "false");

      });

    }



    function openPopup(trigger: HTMLElement) {

      const text = trigger.getAttribute("data-popup")?.trim();

      if (!text) {

        return;

      }



      closePopup();

      trigger.setAttribute("aria-expanded", "true");



      const popup = document.createElement("div");

      popup.className = "learn-popup-bubble";

      popup.setAttribute("role", "dialog");

      popup.textContent = text;



      const rect = trigger.getBoundingClientRect();

      const hostRect = host.getBoundingClientRect();

      popup.style.left = `${rect.left - hostRect.left}px`;

      popup.style.top = `${rect.bottom - hostRect.top + 6}px`;



      host.appendChild(popup);

      popupRef.current = popup;

    }



    function onClick(event: MouseEvent) {

      const target = event.target as HTMLElement | null;

      const trigger = target?.closest<HTMLElement>(".learn-popup");

      if (!trigger || !host.contains(trigger)) {

        closePopup();

        return;

      }

      event.preventDefault();

      event.stopPropagation();

      if (trigger.getAttribute("aria-expanded") === "true") {

        closePopup();

        return;

      }

      openPopup(trigger);

    }



    function onKeyDown(event: KeyboardEvent) {

      const target = event.target as HTMLElement | null;

      if (event.key === "Escape") {

        closePopup();

        return;

      }

      if (!target?.classList.contains("learn-popup")) {

        return;

      }

      if (event.key === "Enter" || event.key === " ") {

        event.preventDefault();

        onClick(event as unknown as MouseEvent);

      }

    }



    host.addEventListener("click", onClick);

    host.addEventListener("keydown", onKeyDown);

    document.addEventListener("click", closePopup);



    return () => {

      host.removeEventListener("click", onClick);

      host.removeEventListener("keydown", onKeyDown);

      document.removeEventListener("click", closePopup);

      closePopup();

    };

  }, [bodyHtml]);



  if (!bodyHtml && !hasFootnotes) {

    return null;

  }



  return (

    <div className={`content-html${className ? ` ${className}` : ""}`}>

      <div

        ref={bodyRef}

        className="content-html-body lesson-html-body"

        dangerouslySetInnerHTML={{ __html: bodyHtml }}

      />

      {hasFootnotes && (

        <div className="content-html-footnotes lesson-html-footnotes" dangerouslySetInnerHTML={{ __html: footnotesHtml }} />

      )}

    </div>

  );

}



export default memo(ContentHtml);

