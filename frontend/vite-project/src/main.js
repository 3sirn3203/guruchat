const { useMemo, useState, useCallback, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

const gurus = [
  { name: "Elon Musk" },
  { name: "Nakamoto" },
  { name: "Buffett" },
  { name: "Ralo" },
  { name: "Socrates" },
  { name: "Hypatia" },
  { name: "Keller" }
];

const initialMessages = [
  { id: "m1", author: "Nakamoto", role: "opponent", text: "Trust no one. Verify the code." },
  {
    id: "m2",
    author: "Nakamoto",
    role: "opponent",
    text: "What are you trying to figure out today?"
  }
];

const historySeed = {
  today: [
    "How Much Pushups A day",
    "Top 10 Imdb Best Movies ever",
    "Tell me what support i played daily fitness"
  ],
  yesterday: [
    "How Much Pushups A day",
    "Top 10 Imdb Best Movies ever",
    "Tell me what support i played daily fitness",
    "Top 10 Imdb Best Movies ever",
    "Tell me what support i played daily fitness"
  ]
};

const BackIcon = () =>
  React.createElement(
    "svg",
    { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" },
    React.createElement("path", {
      d: "M14.5 6l-5 6 5 6",
      stroke: "#f5f7fb",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    })
  );

const Logo = () =>
  React.createElement(
    "svg",
    { className: "logo", viewBox: "0 0 120 120", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true" },
    React.createElement("path", {
      d: "M54.5 12c4-7 14-7 18 0l7.5 12.8c4 6.8.5 15.5-7 17.7l-14 4.3c-7.5 2.3-15-4.3-13.4-12L49 24l5.5-12z",
      fill: "#0f0f0f"
    }),
    React.createElement("path", {
      d: "M17.5 63c-7.8-3-10.2-13-4.5-19.5l9.9-11c5.6-6.2 15.6-5 19.6 2.4l7.4 14.1c4 7.4-1 16.3-9.4 17.2L24 67.9 17.5 63z",
      fill: "#0f0f0f"
    }),
    React.createElement("path", {
      d: "M68.7 105c-3.9 7-14 7-18 0l-7.5-13c-4-7-.3-15.8 7.4-17.8l14.1-3.7c7.7-2 15 4.8 13.1 12.6l-3.8 15-5.3 6.9z",
      fill: "#0f0f0f"
    })
  );

const Person = ({ name, id, active, onToggle }) =>
  React.createElement(
    "div",
    {
      className: `person${active ? " active" : ""}`,
      key: `${name}-${id}`,
      onClick: () => onToggle(name),
      tabIndex: 0,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(name);
        }
      },
      "aria-pressed": active,
      role: "button"
    },
    React.createElement("div", { className: "avatar", "aria-hidden": "true" }),
    React.createElement("div", { className: "name" }, name)
  );

const Carousel = ({ selectedNames, onToggle }) => {
  const items = useMemo(() => [...gurus, ...gurus], []);
  return React.createElement(
    "section",
    { className: "carousel-shell", "aria-label": "Masters carousel" },
    React.createElement(
      "div",
      { className: "carousel-window" },
      React.createElement(
        "div",
        { className: "carousel-track", role: "list" },
        items.map((person, idx) =>
          React.createElement(Person, {
            ...person,
            id: idx,
            active: selectedNames.has(person.name),
            onToggle
          })
        )
      )
    )
  );
};

const ModeToggle = ({ mode, onToggle }) =>
  React.createElement(
    "button",
    {
      type: "button",
      className: `mode-toggle${mode === "spicy" ? " spicy" : ""}`,
      onClick: onToggle,
      "aria-pressed": mode === "spicy",
      title: "Toggle chat spice level"
    },
    React.createElement("span", { className: "dot" }),
    mode === "spicy" ? "Spicy mode" : "Normal mode"
  );

const Message = ({ role, text, author }) => {
  const isUser = role === "user";
  return React.createElement(
    "div",
    { className: `message-row${isUser ? " user" : ""}` },
    !isUser &&
      React.createElement("div", {
        className: "avatar-small",
        "aria-hidden": "true",
        style: {
          backgroundImage:
            "url('https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=200&q=60')"
        }
      }),
    React.createElement(
      "div",
      { className: `bubble${isUser ? " user" : ""}` },
      !isUser && author ? React.createElement("strong", null, `${author}: `) : null,
      text
    )
  );
};

const DeleteIcon = () =>
  React.createElement(
    "svg",
    { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" },
    React.createElement("path", {
      d: "M6 8.5h12",
      stroke: "#d64a1e",
      "stroke-width": "2",
      "stroke-linecap": "round"
    }),
    React.createElement("path", {
      d: "M10 4.5h4",
      stroke: "#d64a1e",
      "stroke-width": "2",
      "stroke-linecap": "round"
    }),
    React.createElement("path", {
      d: "M9 8.5v9a1.5 1.5 0 001.5 1.5h3A1.5 1.5 0 0015 17.5v-9",
      stroke: "#d64a1e",
      "stroke-width": "2",
      "stroke-linecap": "round"
    })
  );

const PencilIcon = () =>
  React.createElement(
    "svg",
    { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" },
    React.createElement("path", {
      d: "M4 17.5l1.5 1.5L15 9.5 13.5 8z",
      stroke: "#c4cedf",
      "stroke-width": "1.7",
      "stroke-linecap": "round"
    }),
    React.createElement("path", {
      d: "M14.5 7L17 4.5a1.5 1.5 0 012 0l1.5 1.5a1.5 1.5 0 010 2L17 10",
      stroke: "#c4cedf",
      "stroke-width": "1.7"
    }),
    React.createElement("path", {
      d: "M4 17.5L3 21l3.5-1",
      stroke: "#c4cedf",
      "stroke-width": "1.7",
      "stroke-linecap": "round"
    })
  );

const HistoryItem = ({ title, onDelete, onSelect, onRename }) => {
  const [offset, setOffset] = useState(0);
  const [ready, setReady] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef(null);
  const startRef = useRef(0);
  const draggingRef = useRef(false);

  const handleStart = (clientX) => {
    if (editing) return;
    draggingRef.current = true;
    startRef.current = clientX;
    setPressed(true);
  };

  const handleMove = (clientX) => {
    if (editing) return;
    if (!draggingRef.current) return;
    const delta = Math.max(0, clientX - startRef.current);
    if (delta > 4 && pressed) setPressed(false);
    setOffset(Math.min(delta, 90));
  };

  const handleEnd = () => {
    if (editing) return;
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const nextReady = offset > 50;
    setReady(nextReady);
    setOffset(nextReady ? 70 : 0);
    setPressed(false);
  };

  const handleClick = () => {
    if (editing) return;
    if (offset > 6 || ready) return;
    if (onSelect) onSelect();
    setPressed(false);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditing(true);
    setDraft(title);
    setPressed(false);
    setTimeout(() => {
      var _a;
      return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, 0);
  };

  const commitDraft = () => {
    const nextTitle = draft.trim();
    if (nextTitle && nextTitle !== title && onRename) {
      onRename(nextTitle);
    }
    setEditing(false);
    setDraft(nextTitle || title);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(title);
  };

  return React.createElement(
    "div",
    {
      className: "history-item-wrapper",
      onPointerDown: (e) => handleStart(e.clientX),
      onPointerMove: (e) => handleMove(e.clientX),
      onPointerUp: handleEnd,
      onPointerCancel: handleEnd,
      onPointerLeave: handleEnd
    },
    React.createElement(
      "div",
      { className: "history-delete", style: { opacity: ready || offset > 10 ? 1 : 0.5 } },
      React.createElement(
        "button",
        {
          type: "button",
          onClick: onDelete,
          style: { border: "none", background: "transparent", cursor: "pointer" },
          "aria-label": `Delete ${title}`
        },
        React.createElement(DeleteIcon)
      )
    ),
    React.createElement(
      "div",
      {
        className: `history-item${ready ? " ready" : ""}${pressed ? " pressed" : ""}`,
        style: { transform: `translateX(${offset}px)` },
        onClick: handleClick
      },
      React.createElement(
        "div",
        { className: "history-item-content" },
        editing
          ? React.createElement("input", {
              ref: inputRef,
              value: draft,
              onChange: (e) => setDraft(e.target.value),
              onBlur: commitDraft,
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraft();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              },
              className: "history-edit-input",
              "aria-label": `Edit ${title}`
            })
          : React.createElement("span", { className: "history-title-text" }, title),
        React.createElement(
          "button",
          {
            type: "button",
            className: "edit-btn",
            onClick: handleEditClick,
            "aria-label": `Edit ${title}`
          },
          React.createElement(PencilIcon)
        )
      )
    )
  );
};

const HistoryGroup = ({ label, items, onDelete, onSelect, onRename }) =>
  React.createElement(
    "div",
    { className: "history-group" },
    React.createElement("h4", null, label),
    items.map((item) =>
      React.createElement(HistoryItem, {
        key: item.id,
        title: item.title,
        onDelete: () => onDelete(item.id),
        onSelect,
        onRename: (next) => onRename(item.id, next)
      })
    )
  );

const HistoryOverlay = ({ open, onClose, itemsByDay, onDelete, onRename }) =>
  React.createElement(
    "div",
    { className: `history-overlay${open ? " open" : ""}` },
    React.createElement(
      "div",
      { className: "history-header" },
      React.createElement("h3", { className: "history-title" }, "History"),
      React.createElement(
        "button",
        { className: "post-btn", type: "button", onClick: onClose, "aria-label": "Back to chat" },
        React.createElement(
          "svg",
          { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" },
          React.createElement("path", {
            d: "M7 17l10-10",
            stroke: "#f4f7ff",
            "stroke-width": "2.4",
            "stroke-linecap": "round"
          }),
          React.createElement("path", {
            d: "M9.5 7H17v7.5",
            stroke: "#f4f7ff",
            "stroke-width": "2.4",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
          })
        )
      )
    ),
    React.createElement(
      "div",
      { className: "history-body" },
      React.createElement(
        "label",
        { className: "search-box" },
        React.createElement(
          "svg",
          { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" },
          React.createElement("circle", {
            cx: "11",
            cy: "11",
            r: "6.5",
            stroke: "#9a9a9a",
            "stroke-width": "2"
          }),
          React.createElement("path", {
            d: "M16 16l4 4",
            stroke: "#9a9a9a",
            "stroke-width": "2",
            "stroke-linecap": "round"
          })
        ),
        React.createElement("input", { type: "search", placeholder: "Search...", "aria-label": "Search history" })
      ),
      React.createElement(HistoryGroup, {
        label: "Today",
        items: itemsByDay.today,
        onDelete: onDelete,
        onSelect: onClose,
        onRename: onRename
      }),
      React.createElement(HistoryGroup, {
        label: "Yesterday",
        items: itemsByDay.yesterday,
        onDelete: onDelete,
        onSelect: onClose,
        onRename: onRename
      })
    )
  );

const CarouselPage = ({ onGetStarted, selectedNames, onToggle }) =>
  React.createElement(
    "main",
    { className: "phone welcome-page" },
    React.createElement(
      "button",
      { className: "back-btn", "aria-label": "Go back", type: "button" },
      React.createElement(BackIcon)
    ),
    React.createElement(
      "div",
      { className: "welcome-stack" },
      React.createElement(
        "section",
        { className: "headline" },
        React.createElement(
          "h1",
          null,
          React.createElement("span", null, "Welcome to"),
          React.createElement("span", null, "GuruChat")
        ),
        React.createElement(
          "p",
          {style: { whiteSpace: "pre-line" } },
          "Start chatting with masters now. Stop guessing. \n Let the masters debate."
        )
      ),
      React.createElement(Carousel, { selectedNames, onToggle }),
      React.createElement("p", { className: "footer-hint" }, "Swipe or tap to pick your guru")
    ),
    React.createElement(
      "button",
      { className: "cta", type: "button", onClick: onGetStarted },
      "Get Started"
    )
  );

const ChatPage = ({ onBack }) => {
  const [mode, setMode] = useState("normal");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState(() => {
    let counter = 0;
    const withIds = (day, list) => list.map((title) => ({ id: `${day}-${counter++}`, day, title }));
    return {
      today: withIds("today", historySeed.today),
      yesterday: withIds("yesterday", historySeed.yesterday)
    };
  });
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const feedRef = useRef(null);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "normal" ? "spicy" : "normal"));
  }, []);

  const handleDeleteHistory = useCallback((id) => {
    setHistoryItems((prev) => {
      const filterDay = (arr) => arr.filter((item) => item.id !== id);
      return {
        today: filterDay(prev.today),
        yesterday: filterDay(prev.yesterday)
      };
    });
  }, []);

  const handleRenameHistory = useCallback((id, title) => {
    setHistoryItems((prev) => {
      const rename = (arr) => arr.map((item) => (item.id === id ? { ...item, title } : item));
      return {
        today: rename(prev.today),
        yesterday: rename(prev.yesterday)
      };
    });
  }, []);

  const scrollToBottom = () => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `o-${Date.now()}`,
          role: "opponent",
          author: "Nakamoto",
          text: mode === "spicy" ? "Bold take incoming. Ready?" : "Let me think that through with you."
        }
      ]);
    }, 600);
  }, [input, mode]);

  return React.createElement(
    "div",
    { className: "chat-page" },
    React.createElement(
      "div",
      { className: "top-row" },
      React.createElement(
        "button",
        { className: "back-btn", "aria-label": "Go back", type: "button", onClick: onBack },
        React.createElement(BackIcon)
      ),
      React.createElement("div", { className: "top-row-spacer", "aria-hidden": "true" }),
      React.createElement(
        "button",
        {
          className: "hamburger-btn",
          type: "button",
          "aria-label": "Open history",
          onClick: () => setHistoryOpen(true)
        },
        React.createElement(
          "div",
          { className: "hamburger-lines", "aria-hidden": "true" },
          React.createElement("span", null),
          React.createElement("span", null),
          React.createElement("span", null)
        )
      )
    ),
    React.createElement("h2", { className: "chat-title" }, "GuruChat"),
    React.createElement(
      "div",
      { className: "chat-feed", ref: feedRef },
      messages.map((m) => React.createElement(Message, { key: m.id, ...m }))
    ),
    React.createElement(
      "div",
      { className: "composer" },
      React.createElement(
        "div",
        { className: "composer-inner" },
        React.createElement("input", {
          type: "text",
          placeholder: "Send a message.",
          "aria-label": "Send a message",
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }
        }),
        React.createElement(ModeToggle, { mode, onToggle: toggleMode }),
        React.createElement(
          "button",
          { className: "send-btn", type: "button", "aria-label": "Send", onClick: handleSend },
          React.createElement(
            "svg",
            { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": "true" },
            React.createElement("path", {
              d: "M5 12h9",
              stroke: "#7a7a7a",
              "stroke-width": "2",
              "stroke-linecap": "round"
            }),
            React.createElement("path", {
              d: "M12 5l7 7-7 7",
              stroke: "#7a7a7a",
              "stroke-width": "2",
              "stroke-linecap": "round",
              "stroke-linejoin": "round"
            })
          )
        )
      )
    ),
    React.createElement(HistoryOverlay, {
      open: historyOpen,
      onClose: () => setHistoryOpen(false),
      itemsByDay: historyItems,
      onDelete: handleDeleteHistory,
      onRename: handleRenameHistory
    })
  );
};

const App = () => {
  const [selectedNames, setSelectedNames] = useState(() => new Set());
  const [view, setView] = useState("welcome");

  const handleToggle = useCallback((name) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  if (view === "chat") {
    return React.createElement(
      "main",
      { className: "phone" },
      React.createElement(ChatPage, { onBack: () => setView("welcome") })
    );
  }

  return React.createElement(
    CarouselPage,
    { onGetStarted: () => setView("chat"), selectedNames, onToggle: handleToggle }
  );
};

const root = createRoot(document.getElementById("root"));
root.render(React.createElement(App));
