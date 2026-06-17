import { Tag } from "@consta/uikit/Tag";
import { type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { buildTagHref, formatHashtag, normalizeTag } from "../utils/hashtags";

type HashtagListProps = {
  tags: string[];
  activeTag?: string | null;
  linkBase?: "/dashboard" | "/wiki";
  onTagClick?: (tag: string, event: MouseEvent) => void;
  className?: string;
};

export default function HashtagList({
  tags,
  activeTag,
  linkBase,
  onTagClick,
  className,
}: HashtagListProps) {
  const navigate = useNavigate();
  const normalizedTags = tags.map(normalizeTag).filter(Boolean);

  if (normalizedTags.length === 0) {
    return null;
  }

  const rootClass = ["hashtag-list-consta", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      {normalizedTags.map((tag) => {
        const isActive =
          activeTag != null &&
          normalizeTag(activeTag).toLocaleLowerCase("ru") === tag.toLocaleLowerCase("ru");

        if (onTagClick) {
          return (
            <Tag
              key={tag}
              size="s"
              mode="button"
              label={formatHashtag(tag)}
              onClick={(event) => onTagClick(tag, event)}
            />
          );
        }

        if (linkBase) {
          return (
            <Tag
              key={tag}
              size="s"
              mode="button"
              label={formatHashtag(tag)}
              onClick={(event) => {
                event.stopPropagation();
                navigate(buildTagHref(linkBase, tag));
              }}
            />
          );
        }

        return (
          <Tag
            key={tag}
            size="s"
            mode="check"
            label={formatHashtag(tag)}
            checked={isActive}
            onChange={() => undefined}
          />
        );
      })}
    </div>
  );
}
