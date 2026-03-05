"use client";

import React, { useCallback, useState } from "react";

type Card = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
};

type List = {
  id: string;
  title: string;
  cards: Card[];
};

const initialLists: List[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      {
        id: "c1",
        title: "Set up project",
        description: "Initialize repository and dependencies",
        dueDate: "2025-03-10",
      },
      {
        id: "c2",
        title: "Design mockups",
        description: "Create wireframes for main screens",
        dueDate: "2025-03-15",
      },
      {
        id: "c3",
        title: "Write documentation",
        description: "",
        dueDate: "",
      },
    ],
  },
  {
    id: "progress",
    title: "In Progress",
    cards: [
      {
        id: "c4",
        title: "Build Trello clone",
        description: "HTML structure first, then styling",
        dueDate: "2025-03-20",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    cards: [
      {
        id: "c5",
        title: "Create initial HTML",
        description: "",
        dueDate: "",
      },
    ],
  },
];

function formatDueDate(isoDate: string): string {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDueDateExpired(isoDate: string): boolean {
  if (!isoDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(isoDate + "T12:00:00");
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function AddCardForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, description: string, dueDate: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAdd(t, description.trim(), dueDate);
    setTitle("");
    setDescription("");
    setDueDate("");
  };

  return (
    <form className="add-card-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="card-title-input"
        placeholder="Enter card title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <textarea
        className="card-desc-input"
        placeholder="Add a description (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className="due-date-label">
        Due date
        <input
          type="date"
          className="card-due-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
      <div className="add-card-actions">
        <button type="submit" className="btn btn-primary">
          Add card
        </button>
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditCardForm({
  card,
  onSave,
  onCancel,
}: {
  card: Card;
  onSave: (title: string, description: string, dueDate: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [dueDate, setDueDate] = useState(card.dueDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onSave(t, description.trim(), dueDate);
  };

  return (
    <form className="edit-card-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="card-title-input"
        placeholder="Enter card title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        autoFocus
      />
      <textarea
        className="card-desc-input"
        placeholder="Add a description (optional)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <label className="due-date-label">
        Due date
        <input
          type="date"
          className="card-due-input"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
      <div className="add-card-actions">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function TrelloCard({
  card,
  isOverdue,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onClick,
}: {
  card: Card;
  isOverdue: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onEdit: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`card ${isDragging ? "dragging" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
    >
      <h3>{card.title}</h3>
      {card.description ? <p>{card.description}</p> : null}
      {card.dueDate ? (
        <span className="card-due-date" data-date={card.dueDate}>
          Due: {formatDueDate(card.dueDate)}
        </span>
      ) : (
        <span className="card-due-date card-due-date--none">No due date</span>
      )}
      {isOverdue ? <span className="card-overdue-label">Overdue</span> : null}
    </div>
  );
}

export function TrelloBoard() {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [draggedCard, setDraggedCard] = useState<{ card: Card; listId: string } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [addFormListId, setAddFormListId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [justDragged, setJustDragged] = useState(false);

  const moveCard = useCallback(
    (cardId: string, fromListId: string, toListId: string) => {
      if (fromListId === toListId) return;
      setLists((prev) => {
        const fromList = prev.find((l) => l.id === fromListId);
        const toList = prev.find((l) => l.id === toListId);
        if (!fromList || !toList) return prev;
        const card = fromList.cards.find((c) => c.id === cardId);
        if (!card) return prev;
        const fromCards = fromList.cards.filter((c) => c.id !== cardId);
        const toCards = [...toList.cards, card];
        return prev.map((list) => {
          if (list.id === fromListId) return { ...list, cards: fromCards };
          if (list.id === toListId) return { ...list, cards: toCards };
          return list;
        });
      });
    },
    []
  );

  const handleDragStart = (e: React.DragEvent, card: Card, listId: string) => {
    setDraggedCard({ card, listId });
    setJustDragged(true);
    (e.target as HTMLElement).classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove("dragging");
    setDraggedCard(null);
    setDragOverListId(null);
    setTimeout(() => setJustDragged(false), 0);
  };

  const handleDragOver = (e: React.DragEvent, listId: string) => {
    e.preventDefault();
    if (draggedCard) {
      e.dataTransfer.dropEffect = "move";
      setDragOverListId(listId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, listId: string) => {
    const list = (e.currentTarget as HTMLElement).closest(".list");
    if (list && !list.contains(e.relatedTarget as Node)) {
      setDragOverListId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, toListId: string) => {
    e.preventDefault();
    setDragOverListId(null);
    if (draggedCard && draggedCard.listId !== toListId) {
      moveCard(draggedCard.card.id, draggedCard.listId, toListId);
    }
    setDraggedCard(null);
  };

  const handleAddCard = (listId: string, title: string, description: string, dueDate: string) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        return {
          ...list,
          cards: [
            ...list.cards,
            {
              id: `c-${Date.now()}`,
              title,
              description,
              dueDate,
            },
          ],
        };
      })
    );
    setAddFormListId(null);
  };

  const handleSaveEdit = (
    listId: string,
    cardId: string,
    title: string,
    description: string,
    dueDate: string
  ) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;
        return {
          ...list,
          cards: list.cards.map((c) =>
            c.id === cardId
              ? { ...c, title, description, dueDate }
              : c
          ),
        };
      })
    );
    setEditingCardId(null);
  };

  const findCard = (cardId: string): { list: List; card: Card } | null => {
    for (const list of lists) {
      const card = list.cards.find((c) => c.id === cardId);
      if (card) return { list, card };
    }
    return null;
  };

  return (
    <div className="trello-board board-wrapper">
      <header className="board-header">
        <h1>My Trello Board</h1>
      </header>
      <main className="board">
        {lists.map((list) => (
          <article
            key={list.id}
            className={`list ${dragOverListId === list.id ? "drag-over" : ""}`}
            onDragOver={(e) => handleDragOver(e, list.id)}
            onDragLeave={(e) => handleDragLeave(e, list.id)}
            onDrop={(e) => handleDrop(e, list.id)}
          >
            <h2>{list.title}</h2>
            <div className="cards">
              {list.cards.map((card) => {
                if (editingCardId === card.id) {
                  const found = findCard(card.id);
                  if (!found) return null;
                  return (
                    <div key={card.id} className="card">
                      <EditCardForm
                        card={card}
                        onSave={(title, description, dueDate) =>
                          handleSaveEdit(list.id, card.id, title, description, dueDate)
                        }
                        onCancel={() => setEditingCardId(null)}
                      />
                    </div>
                  );
                }
                return (
                  <TrelloCard
                    key={card.id}
                    card={card}
                    isOverdue={!!card.dueDate && isDueDateExpired(card.dueDate)}
                    isDragging={draggedCard?.card.id === card.id}
                    onDragStart={(e) => handleDragStart(e, card, list.id)}
                    onDragEnd={handleDragEnd}
                    onEdit={() => setEditingCardId(card.id)}
                    onClick={(e) => {
                      if (!justDragged) setEditingCardId(card.id);
                    }}
                  />
                );
              })}
            </div>
            {addFormListId === list.id ? (
              <AddCardForm
                onAdd={(title, description, dueDate) =>
                  handleAddCard(list.id, title, description, dueDate)
                }
                onCancel={() => setAddFormListId(null)}
              />
            ) : (
              <button
                type="button"
                className="add-card-btn"
                onClick={() => setAddFormListId(list.id)}
              >
                + Add a card
              </button>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
