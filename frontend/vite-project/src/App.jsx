import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

import { sdk } from '@farcaster/miniapp-sdk';

// API Base URL
const API_BASE_URL = 'https://guruchat-backend.onrender.com';

// User ID 관리 유틸리티
const getUserId = () => {
  let userId = localStorage.getItem('guruchat_user_id');
  if (!userId) {
    // UUID v4 생성 (표준 형식)
    userId = crypto.randomUUID();
    localStorage.setItem('guruchat_user_id', userId);
  }
  return userId;
};

// gurus는 이제 App 컴포넌트 state로 관리됨

const initialMessages = [
  { id: 'm1', author: 'Nakamoto', role: 'opponent', text: 'Trust no one. Verify the code.' },
  { id: 'm2', author: 'Nakamoto', role: 'opponent', text: 'What are you trying to figure out today?' },
];

const historySeed = {
  today: ['How Much Pushups A day', 'Top 10 Imdb Best Movies ever', 'Tell me what support i played daily fitness'],
  yesterday: [
    'How Much Pushups A day',
    'Top 10 Imdb Best Movies ever',
    'Tell me what support i played daily fitness',
    'Top 10 Imdb Best Movies ever',
    'Tell me what support i played daily fitness',
  ],
};

const BackIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.5 6l-5 6 5 6" stroke="#f5f7fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Person = ({ name, active, onToggle }) => (
  <div
    className={`person${active ? ' active' : ''}`}
    onClick={() => onToggle(name)}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(name);
      }
    }}
    aria-pressed={active}
    role="button"
  >
    <div className="avatar" aria-hidden="true" />
    <div className="name">{name}</div>
  </div>
);

const Carousel = ({ gurus, selectedNames, onToggle }) => {
  if (!gurus || gurus.length === 0) {
    return (
      <section className="carousel-shell" aria-label="Masters carousel">
        <div className="carousel-window">
          <div className="carousel-track" role="list">
            <p>Loading characters...</p>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section className="carousel-shell" aria-label="Masters carousel">
      <div className="carousel-window">
        <div className="carousel-track" role="list">
          {gurus.map((person, idx) => (
            <Person
              key={person.id || `${person.name}-${idx}`}
              name={person.name}
              active={selectedNames.has(person.id || person.name)}
              onToggle={() => onToggle(person.id || person.name)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const ModeToggle = ({ mode, onToggle }) => (
  <button
    type="button"
    className={`mode-toggle${mode === 'spicy' ? ' spicy' : ''}`}
    onClick={onToggle}
    aria-pressed={mode === 'spicy'}
    title="Toggle chat spice level"
  >
    <span className="dot" />
    {mode === 'spicy' ? 'Spicy mode' : 'Normal mode'}
  </button>
);

const Message = ({ role, text, author }) => {
  const isUser = role === 'user';
  return (
    <div className={`message-row${isUser ? ' user' : ''}`}>
      {!isUser && (
        <div
          className="avatar-small"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=200&q=60')",
          }}
        />
      )}
      <div className={`bubble${isUser ? ' user' : ''}`}>
        {!isUser && author ? <strong>{`${author}: `}</strong> : null}
        {text}
      </div>
    </div>
  );
};

const DeleteIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 8.5h12" stroke="#d64a1e" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 4.5h4" stroke="#d64a1e" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M9 8.5v9a1.5 1.5 0 001.5 1.5h3A1.5 1.5 0 0015 17.5v-9"
      stroke="#d64a1e"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PencilIcon = () => (
  <svg width={19} height={19} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 17.5l1.5 1.5L15 9.5 13.5 8z" stroke="#c4cedf" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M14.5 7L17 4.5a1.5 1.5 0 012 0l1.5 1.5a1.5 1.5 0 010 2L17 10" stroke="#c4cedf" strokeWidth="1.7" />
    <path d="M4 17.5L3 21l3.5-1" stroke="#c4cedf" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
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
    setTimeout(() => inputRef.current?.focus(), 0);
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

  return (
    <div
      className="history-item-wrapper"
      onPointerDown={(e) => handleStart(e.clientX)}
      onPointerMove={(e) => handleMove(e.clientX)}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onPointerLeave={handleEnd}
    >
      <div className="history-delete" style={{ opacity: ready || offset > 10 ? 1 : 0.5 }}>
        <button
          type="button"
          onClick={onDelete}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
          aria-label={`Delete ${title}`}
        >
          <DeleteIcon />
        </button>
      </div>
      <div
        className={`history-item${ready ? ' ready' : ''}${pressed ? ' pressed' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={handleClick}
      >
        <div className="history-item-content">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitDraft();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              className="history-edit-input"
              aria-label={`Edit ${title}`}
            />
          ) : (
            <span className="history-title-text">{title}</span>
          )}
          <button type="button" className="edit-btn" onClick={handleEditClick} aria-label={`Edit ${title}`}>
            <PencilIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

const HistoryGroup = ({ label, items, onDelete, onSelect, onRename }) => (
  <div className="history-group">
    <h4>{label}</h4>
    {items.map((item) => (
      <HistoryItem
        key={item.id}
        title={item.title}
        onDelete={() => onDelete(item.id)}
        onSelect={onSelect}
        onRename={(next) => onRename(item.id, next)}
      />
    ))}
  </div>
);

const HistoryOverlay = ({ open, onClose, itemsByDay, onDelete, onRename }) => (
  <div className={`history-overlay${open ? ' open' : ''}`}>
    <div className="history-header">
      <h3 className="history-title">History</h3>
      <button className="post-btn" type="button" onClick={onClose} aria-label="Back to chat">
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 17l10-10" stroke="#f4f7ff" strokeWidth="2.4" strokeLinecap="round" />
          <path
            d="M9.5 7H17v7.5"
            stroke="#f4f7ff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
    <div className="history-body">
      <label className="search-box">
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" stroke="#9a9a9a" strokeWidth="2" />
          <path d="M16 16l4 4" stroke="#9a9a9a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input type="search" placeholder="Search..." aria-label="Search history" />
      </label>
      <HistoryGroup
        label="Today"
        items={itemsByDay.today}
        onDelete={onDelete}
        onSelect={onClose}
        onRename={onRename}
      />
      <HistoryGroup
        label="Yesterday"
        items={itemsByDay.yesterday}
        onDelete={onDelete}
        onSelect={onClose}
        onRename={onRename}
      />
    </div>
  </div>
);

const CarouselPage = ({ gurus, onGetStarted, selectedNames, onToggle }) => (
  <main className="phone welcome-page">
    <button className="back-btn" aria-label="Go back" type="button">
      <BackIcon />
    </button>
    <div className="welcome-stack">
      <section className="headline">
        <h1>
          <span>Welcome to</span>
          <span>GuruChat</span>
        </h1>
        <p style={{ whiteSpace: 'pre-line' }}>Start chatting with masters now. Stop guessing. {'\n'} Let the masters debate.</p>
      </section>
      <Carousel gurus={gurus} selectedNames={selectedNames} onToggle={onToggle} />
      <p className="footer-hint">Swipe or tap to pick your guru</p>
    </div>
    <button className="cta" type="button" onClick={onGetStarted}>
      Get Started
    </button>
  </main>
);

const ChatPage = ({ onBack, sessionId, userId, selectedCharacters }) => {
  const [mode, setMode] = useState('normal');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [historyItems, setHistoryItems] = useState(() => {
    let counter = 0;
    const withIds = (day, list) => list.map((title) => ({ id: `${day}-${counter++}`, day, title }));
    return {
      today: withIds('today', historySeed.today),
      yesterday: withIds('yesterday', historySeed.yesterday),
    };
  });
  
  // 초기 메시지: 선택된 캐릭터들의 설명을 표시
  const [messages, setMessages] = useState(() => {
    if (!selectedCharacters || selectedCharacters.length === 0) {
      return [{
        id: 'm1',
        author: 'System',
        role: 'opponent',
        text: 'Please select a Guru to start chatting.'
      }];
    }
    
    // 각 캐릭터의 설명을 메시지로 추가
    return selectedCharacters.map((char, idx) => ({
      id: `intro-${char.id || idx}`,
      author: char.name,
      role: 'opponent',
      text: char.description || `Hello, I'm ${char.name}. Ask me anything!`
    }));
  });
  
  const [input, setInput] = useState('');
  const feedRef = useRef(null);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'normal' ? 'spicy' : 'normal'));
  }, []);

  const handleDeleteHistory = useCallback((id) => {
    setHistoryItems((prev) => {
      const filterDay = (arr) => arr.filter((item) => item.id !== id);
      return {
        today: filterDay(prev.today),
        yesterday: filterDay(prev.yesterday),
      };
    });
  }, []);

  const handleRenameHistory = useCallback((id, title) => {
    setHistoryItems((prev) => {
      const rename = (arr) => arr.map((item) => (item.id === id ? { ...item, title } : item));
      return {
        today: rename(prev.today),
        yesterday: rename(prev.yesterday),
      };
    });
  }, []);

  const scrollToBottom = () => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    if (isComposing) return;
    const text = input.trim();
    if (!text) return;
    
    const userMsg = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/chat/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          content: text,
          style: mode, // 'spicy' or 'normal'
          model: 'qwen-plus'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // 각 캐릭터별 메시지 버퍼
      const characterBuffers = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // 'data: ' 제거
              const data = JSON.parse(jsonStr);
              
              if (data.character_id && data.name && data.content) {
                const charId = data.character_id;
                
                // 스페이스만 있는 경우 메시지 종료 신호
                if (data.content === ' ') {
                  continue;
                }

                // 버퍼 초기화 또는 업데이트
                if (!characterBuffers[charId]) {
                  const msgId = `${charId}-${Date.now()}`;
                  characterBuffers[charId] = {
                    id: msgId,
                    author: data.name,
                    role: 'opponent',
                    text: data.content
                  };
                  
                  // 새 메시지 추가
                  setMessages((prev) => [...prev, characterBuffers[charId]]);
                } else {
                  // 기존 메시지 업데이트
                  characterBuffers[charId].text += data.content;
                  
                  setMessages((prev) => 
                    prev.map(msg => 
                      msg.id === characterBuffers[charId].id 
                        ? { ...msg, text: characterBuffers[charId].text }
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'opponent',
          author: 'System',
          text: '메시지 전송에 실패했습니다. 다시 시도해주세요.',
        },
      ]);
    }
  }, [input, mode, isComposing, sessionId, userId]);

  return (
    <div className="chat-page">
      <div className="top-row">
        <button className="back-btn" aria-label="Go back" type="button" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="top-row-spacer" aria-hidden="true" />
        <button
          className="hamburger-btn"
          type="button"
          aria-label="Open history"
          onClick={() => setHistoryOpen(true)}
        >
          <div className="hamburger-lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </button>
      </div>
      <h2 className="chat-title">GuruChat</h2>
      <div className="chat-feed" ref={feedRef}>
        {messages.map((m) => (
          <Message key={m.id} {...m} />
        ))}
      </div>
      <div className="composer">
        <div className="composer-inner">
          <input
            type="text"
            placeholder="Send a message."
            aria-label="Send a message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !(e.nativeEvent?.isComposing || isComposing)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <ModeToggle mode={mode} onToggle={toggleMode} />
          <button className="send-btn" type="button" aria-label="Send" onClick={handleSend}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h9" stroke="#7a7a7a" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 5l7 7-7 7" stroke="#7a7a7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <HistoryOverlay
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        itemsByDay={historyItems}
        onDelete={handleDeleteHistory}
        onRename={handleRenameHistory}
      />
    </div>
  );
};

const App = () => {
  const [userId, setUserId] = useState(null);
  const [gurus, setGurus] = useState([]);
  const [selectedNames, setSelectedNames] = useState(() => new Set());
  const [view, setView] = useState('welcome');
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    sdk.actions.ready();
    // User ID 초기화
    const id = getUserId();
    setUserId(id);
    console.log('🔑 User ID:', id);

    // 캐릭터 목록 가져오기
    const fetchCharacters = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/characters/`, {
          method: 'GET',
          headers: {
            'accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch characters');
        }
        
        const data = await response.json();
        console.log('📚 Characters loaded:', data);
        setGurus(data);
      } catch (error) {
        console.error('❌ Error fetching characters:', error);
        // 폴백으로 빈 배열 유지
      }
    };

    fetchCharacters();
  }, []);

  const handleToggle = useCallback((name) => {
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        // 이미 선택된 경우 선택 해제
        next.delete(name);
      } else {
        // 최대 3명까지만 선택 가능
        if (next.size >= 3) {
          alert('최대 3명의 Guru만 선택할 수 있습니다!');
          return prev;
        }
        next.add(name);
      }
      return next;
    });
  }, []);

  const handleGetStarted = useCallback(async () => {
    // 캐릭터 선택 확인
    if (selectedNames.size === 0) {
      alert('최소 1명의 Guru를 선택해주세요!');
      return;
    }

    if (!userId) {
      alert('User ID를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    try {
      const requestBody = {
        user_id: userId,
        character_ids: Array.from(selectedNames)
      };
      
      console.log('📤 세션 생성 요청:', requestBody);

      // 세션 생성 API 호출
      const response = await fetch(`${API_BASE_URL}/api/sessions/`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API 응답 에러:', errorData);
        throw new Error(`Failed to create session: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log('✅ Session created:', data);
      
      setSessionId(data.id);
      setView('chat');
    } catch (error) {
      console.error('❌ Error creating session:', error);
      alert('세션 생성에 실패했습니다. 콘솔을 확인해주세요.');
    }
  }, [selectedNames, userId]);

  if (view === 'chat') {
    const selectedCharacters = gurus.filter(guru => selectedNames.has(guru.id));
    
    return (
      <main className="phone">
        <ChatPage 
          onBack={() => setView('welcome')} 
          sessionId={sessionId}
          userId={userId}
          selectedCharacters={selectedCharacters}
        />
      </main>
    );
  }

  return <CarouselPage gurus={gurus} onGetStarted={handleGetStarted} selectedNames={selectedNames} onToggle={handleToggle} />;
};

export default App;
