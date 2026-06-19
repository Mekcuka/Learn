import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import { useEffect, useState } from "react";

import type { SlashCommandItem } from "./extensions/SlashCommands";

type SlashCommandListProps = {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

export default function SlashCommandList({ items, command }: SlashCommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((index) => (index + items.length - 1) % items.length);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % items.length);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const item = items[selectedIndex];
        if (item) {
          command(item);
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [command, items, selectedIndex]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Paper className="slash-command-menu" elevation={4}>
      <List dense disablePadding>
        {items.map((item, index) => (
          <ListItemButton
            key={item.command}
            selected={index === selectedIndex}
            onClick={() => command(item)}
          >
            <ListItemText
              primary={item.title}
              secondary={item.description}
              primaryTypographyProps={{ fontSize: "0.9rem" }}
              secondaryTypographyProps={{ fontSize: "0.78rem" }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
