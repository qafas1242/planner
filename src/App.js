import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Tag, Download, Upload, Calendar, List, User, LogOut, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCwvAVowAg004_t2CMdtagglYnkZQuogsE",
  authDomain: "planner-82bca.firebaseapp.com",
  projectId: "planner-82bca",
  storageBucket: "planner-82bca.firebasestorage.app",
  messagingSenderId: "74803715226",
  appId: "1:74803715226:web:5bb97de1ceff4879a8d323",
  measurementId: "G-PSG70SQHX2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Animated Checkbox Component (개선된 디자인 적용)
const AnimatedCheckbox = ({ isChecked, onClick, color }) => {
  const checkmarkVariants = {
    checked: { pathLength: 1, opacity: 1 },
    unchecked: { pathLength: 0, opacity: 0 }
  };
  const fillVariants = {
    checked: { opacity: 1, scale: 1, backgroundColor: color },
    unchecked: { opacity: 0, scale: 0.5, backgroundColor: "#fff" }
  };
  return (
    <motion.div
      className="w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 relative"
      style={{ borderColor: color }}
      onClick={onClick}
      initial={false}
      animate={isChecked ? "checked" : "unchecked"}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* 원형 배경 Fade In 채우기 */}
      <motion.div
        className="w-full h-full rounded-full absolute"
        variants={fillVariants}
        transition={{ duration: 0.3 }}
      />
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10"
      >
        {/* 체크 표시를 왼쪽에서 오른쪽으로 꺾으면서 그리기 */}
        <motion.path
          d="M6 12l4 4l8 -8"
          variants={checkmarkVariants}
          style={{ pathLength: 0 }}
          transition={{ 
            type: "tween", 
            duration: 0.3, 
            ease: "easeOut",
            delay: 0.1 // 배경 채우기 후 시작
          }}
        />
      </motion.svg>
    </motion.div>
  );
};

// 모달 애니메이션 variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};
const modalVariants = {
  hidden: { y: "-100vh", opacity: 0, scale: 0.8 },
  visible: { 
    y: "0", 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring", 
      stiffness: 200, 
      damping: 25 
    } 
  },
  exit: { y: "100vh", opacity: 0, scale: 0.8 }
};

const MonthlyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [tags, setTags] = useState([
    { id: 1, name: '업무', color: '#3B82F6' },
    { id: 2, name: '개인', color: '#10B981' },
    { id: 3, name: '운동', color: '#F59E0B' },
    { id: 4, name: '공부', color: '#8B5CF6' }
  ]);
  const [viewMode, setViewMode] = useState('day'); // 'month', 'day'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#3B82F6');
  const dayViewRef = useRef(null);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#78716C'
  ];

  // --- Firebase Auth & Data State ---
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false); // DB 로딩 완료 여부 (덮어쓰기 방지)

  // --- Firebase Logic (원래 코드와 동일하게 유지) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.events) setEvents(data.events);
            if (data.tags) setTags(data.tags);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsDataLoaded(true);
        }
      } else {
        setIsDataLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isDataLoaded) {
      const saveData = async () => {
        try {
          await setDoc(doc(db, "users", user.uid), {
            events,
            tags
          }, { merge: true });
        } catch (error) {
          console.error("Error saving data:", error);
        }
      };

      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [events, tags, user, isDataLoaded]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        alert("회원가입 성공! 자동 로그인됩니다.");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      console.error("Firebase Auth Error:", error.code, error.message);
      let msg = "오류가 발생했습니다.";
      if (error.code === 'auth/email-already-in-use') {
        msg = "이미 사용 중인 이메일입니다.";
      } 
      else if (error.code === 'auth/invalid-email') {
        msg = "유효하지 않은 이메일 형식입니다.";
      } 
      else if (error.code === 'auth/weak-password') {
        msg = "비밀번호는 6자리 이상이어야 합니다.";
      }
      else if (error.code === 'auth/invalid-credential' || 
               error.code === 'auth/invalid-login-credentials' ||
               error.code === 'auth/user-not-found' || 
               error.code === 'auth/wrong-password') {
        msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      }
      else if (error.code === 'auth/user-disabled') {
        msg = "비활성화된 계정입니다.";
      }
      else if (error.code === 'auth/too-many-requests') {
        msg = "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      }
      else if (error.code === 'auth/network-request-failed') {
        msg = "네트워크 연결을 확인해주세요.";
      }
      else {
        msg = `오류가 발생했습니다. (${error.code})`;
      }
      setAuthError(msg);
    }
  };

  const handleLogout = async () => {
    try {
      setIsDataLoaded(false);
      await signOut(auth);
      setEvents({});
      setTags([
        { id: 1, name: '업무', color: '#3B82F6' },
        { id: 2, name: '개인', color: '#10B981' },
        { id: 3, name: '운동', color: '#F59E0B' },
        { id: 4, name: '공부', color: '#8B5CF6' }
      ]);
      alert("로그아웃 되었습니다.");
    } catch (error) {
      console.error("Logout error:", error);
      alert(`로그아웃 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  // --- End Firebase Logic ---

  // --- Utility Functions (원래 코드와 동일하게 유지) ---
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };
  
  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };
  
  const getDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };
  
  const scrollToDate = (date) => {
    const dateKey = getDateKey(date);
    const dateElement = document.getElementById(\`day-card-\${dateKey}\`); // ID 변경
    if (dateElement && dayViewRef.current) {
      const container = dayViewRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = dateElement.getBoundingClientRect();
      
      const scrollPosition = elementRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === 'day') {
      setTimeout(() => scrollToDate(today), 450);
    } else {
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  };

  const getTagById = (id) => {
    return tags.find(tag => tag.id === id);
  };

  const openEventModal = (date) => {
    setSelectedDate(date);
    setEventTitle('');
    setSelectedTagId(tags.length > 0 ? tags[0].id : null);
    setShowEventModal(true);
  };

  const addEvent = () => {
    if (!eventTitle.trim() || !selectedDate || !selectedTagId) {
      alert("제목과 태그를 선택해주세요.");
      return;
    }

    const dateKey = getDateKey(selectedDate);
    const newEvent = {
      id: Date.now(),
      title: eventTitle.trim(),
      tagId: selectedTagId,
      completed: false,
    };

    setEvents(prevEvents => ({
      ...prevEvents,
      [dateKey]: [...(prevEvents[dateKey] || []), newEvent]
    }));

    setEventTitle('');
    setShowEventModal(false);
  };

  const toggleEventCompletion = (dateKey, eventId) => {
    setEvents(prevEvents => {
      const dayEvents = prevEvents[dateKey] || [];
      const updatedEvents = dayEvents.map(event => 
        event.id === eventId ? { ...event, completed: !event.completed } : event
      );
      return {
        ...prevEvents,
        [dateKey]: updatedEvents
      };
    });
  };

  const deleteEvent = (dateKey, eventId) => {
    setEvents(prevEvents => {
      const dayEvents = prevEvents[dateKey] || [];
      const updatedEvents = dayEvents.filter(event => event.id !== eventId);
      
      if (updatedEvents.length === 0) {
        const { [dateKey]: _, ...rest } = prevEvents;
        return rest;
      }
      
      return {
        ...prevEvents,
        [dateKey]: updatedEvents
      };
    });
  };

  const addTag = () => {
    if (!newTagName.trim()) {
      alert("태그 이름을 입력해주세요.");
      return;
    }
    if (tags.some(tag => tag.name === newTagName.trim())) {
      alert("이미 존재하는 태그 이름입니다.");
      return;
    }

    const newTag = {
      id: Date.now(),
      name: newTagName.trim(),
      color: newTagColor,
    };

    setTags(prevTags => [...prevTags, newTag]);
    setNewTagName('');
    setShowColorPicker(false);
  };

  const deleteTag = (tagId) => {
    if (window.confirm("이 태그를 삭제하면 이 태그가 지정된 모든 일정이 태그를 잃게 됩니다. 계속하시겠습니까?")) {
      setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
      
      // 삭제된 태그를 사용하는 모든 이벤트에서 tagId 제거
      setEvents(prevEvents => {
        const newEvents = { ...prevEvents };
        for (const dateKey in newEvents) {
          newEvents[dateKey] = newEvents[dateKey].map(event => 
            event.tagId === tagId ? { ...event, tagId: null } : event
          );
        }
        return newEvents;
      });
    }
  };

  const selectColor = (color) => {
    setNewTagColor(color);
    setShowColorPicker(false);
  };

  const selectCustomColor = () => {
    setNewTagColor(customColor);
    setShowColorPicker(false);
  };

  const exportData = () => {
    const data = { events, tags };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`planner_data_\${new Date().toISOString().split('T')[0]}.json\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData.events) setEvents(importedData.events);
        if (importedData.tags) setTags(importedData.tags);
        alert("데이터를 성공적으로 불러왔습니다.");
      } catch (error) {
        alert("파일 형식이 올바르지 않습니다.");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  };

  const getDaysForDayView = useMemo(() => {
    const days = [];
    const today = new Date();
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // 현재 월의 모든 날짜를 포함
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    
    // 현재 날짜가 오늘이 아닐 경우, 오늘 날짜를 포함하도록 조정 (UX 개선)
    if (currentDate.getMonth() !== today.getMonth() || currentDate.getFullYear() !== today.getFullYear()) {
      // 현재 월이 아닌 경우, 현재 월의 1일로 시작하도록 이미 설정되어 있음.
    } else {
      // 현재 월인 경우, 오늘 날짜를 중심으로 보여주기 위해 1일 대신 오늘 날짜를 포함하도록 할 수 있으나,
      // 기존 로직은 월 전체를 보여주므로 그대로 유지.
    }
    
    return days;
  }, [currentDate]);
  // --- End Utility Functions ---

  // --- Animation Variants (개선된 디자인에 맞게 조정) ---
  const headerItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 30
      } 
    }
  };

  // 캘린더 셀 애니메이션 variants (더 부드러운 상호작용)
  const calendarCellVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    hover: { 
      scale: 1.02, 
      boxShadow: "0 6px 15px rgba(0, 0, 0, 0.08)",
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      } 
    }
  };

  // 일간 보기 항목 애니메이션 (더 깔끔한 등장)
  const dayTaskItemVariants = {
    hidden: { 
      opacity: 0, 
      y: 10,
    },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25, 
        delay: i * 0.05,
      }
    }),
    exit: { 
      opacity: 0, 
      height: 0, 
      paddingTop: 0, 
      paddingBottom: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  // --- End Animation Variants ---

  // --- Render Functions ---

  // 월간 뷰 렌더링 (디자인 개선)
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    // 빈 칸 채우기
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={\`empty-\${i}\`} className="bg-gray-50/50 border-r border-b border-gray-100" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const dayEvents = events[dateKey] || [];
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
      const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      
      days.push(
        <motion.div
          key={day}
          className={\`border-r border-b border-gray-100 bg-white cursor-pointer p-2 relative flex flex-col h-32 transition-all duration-200 \${isSelected ? 'ring-2 ring-indigo-500 z-10' : ''}\`}
          onClick={() => openEventModal(date)}
          variants={calendarCellVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.3, delay: (day + startingDayOfWeek) * 0.005 }}
        >
          <div className="flex justify-between items-start mb-1">
            <span 
              className={\`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors \${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-800 hover:bg-gray-100'}\`}
            >
              {day}
            </span>
            <motion.button
              onClick={(e) => { e.stopPropagation(); openEventModal(date); }}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-indigo-100"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-4 h-4 text-indigo-500" />
            </motion.button>
          </div>
          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            <AnimatePresence>
              {sortedEvents.map((event) => {
                const tag = getTagById(event.tagId);
                return (
                  <motion.div
                    key={event.id}
                    className={\`text-xs px-2 py-0.5 rounded-md truncate transition-all \${event.completed ? 'line-through opacity-60' : 'font-medium'}\`}
                    style={{ backgroundColor: \`\${tag?.color}20\`, color: tag?.color }}
                    onClick={(e) => { e.stopPropagation(); toggleEventCompletion(dateKey, event.id); }}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ opacity: event.completed ? 0.6 : 0.8 }}
                  >
                    {event.title}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    }
    
    return days;
  };

  // 일간 뷰 렌더링 (디자인 개선 - 카드 기반)
  const renderDayView = () => {
    const days = getDaysForDayView;
    return (
      <motion.div 
        ref={dayViewRef}
        className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6 bg-gray-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        {days.map((date, index) => {
          const dateKey = getDateKey(date);
          const dayEvents = events[dateKey] || [];
          const isToday = new Date().toDateString() === date.toDateString();
          const dayOfWeek = dayNames[date.getDay()];
          
          const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

          return (
            <motion.div
              key={index}
              id={\`day-card-\${dateKey}\`}
              className={\`max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 transition-all duration-300 \${isToday ? 'ring-4 ring-indigo-100' : 'hover:shadow-xl'}\`}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className={\`text-4xl font-extrabold \${isToday ? 'text-indigo-600' : 'text-gray-900'}\`}>
                    {date.getDate()}
                  </div>
                  <div>
                    <div className={\`text-lg font-bold \${isToday ? 'text-indigo-600' : 'text-gray-700'}\`}>
                      {dayOfWeek}
                    </div>
                    <div className="text-sm text-gray-500">
                      {date.getFullYear()}년 {date.getMonth() + 1}월
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => openEventModal(date)}
                  className="p-2 bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
              
              {sortedEvents.length > 0 ? (
                <motion.div className="space-y-3">
                  <AnimatePresence>
                    {sortedEvents.map((event, eventIndex) => {
                      const tag = getTagById(event.tagId);
                      return (
                        <motion.div
                          key={event.id}
                          className={\`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 \${event.completed ? 'opacity-60 bg-gray-50' : 'hover:bg-indigo-50'}\`}
                          onClick={() => toggleEventCompletion(dateKey, event.id)}
                          variants={dayTaskItemVariants}
                          custom={eventIndex}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                        >
                          <AnimatedCheckbox 
                            isChecked={event.completed} 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEventCompletion(dateKey, event.id);
                            }}
                            color={tag?.color || '#6B7280'}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className={\`font-medium text-gray-800 truncate \${event.completed ? 'line-through text-gray-500' : ''}\`}>
                              {event.title}
                            </div>
                            {tag && (
                              <div 
                                className="text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full inline-block"
                                style={{ backgroundColor: \`\${tag.color}20\`, color: tag.color }}
                              >
                                {tag.name}
                              </div>
                            )}
                          </div>
                          
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(dateKey, event.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  오늘의 일정이 없습니다.
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  // --- Main Component JSX ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* Fixed Header (개선된 디자인) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          
          {/* 좌측: 월/년도 네비게이션 */}
          <motion.div className="flex items-center gap-4" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
            <motion.h1 className="text-xl md:text-2xl font-bold text-gray-900" variants={headerItemVariants}>
              {`${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
            </motion.h1>
            <motion.div className="flex gap-1" variants={headerItemVariants}>
              <motion.button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              <motion.button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* 우측: 기능 버튼 그룹 */}
          <motion.div className="flex items-center gap-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}>
            
            {/* 뷰 모드 전환 버튼 */}
            <motion.button
              onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
              className="px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 bg-indigo-500 text-white shadow-md hover:bg-indigo-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variants={headerItemVariants}
            >
              {viewMode === 'month' ? <List className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === 'month' ? '일간 보기' : '월간 보기'}</span>
            </motion.button>

            {/* 오늘 버튼 */}
            <motion.button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              variants={headerItemVariants}
            >
              오늘
            </motion.button>

            {/* 태그 관리 버튼 */}
            <motion.button
              onClick={() => setShowTagModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              variants={headerItemVariants}
            >
              <Tag className="w-5 h-5" />
            </motion.button>

            {/* 로그인/로그아웃 버튼 */}
            {user ? (
              <motion.button
                onClick={handleLogout}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                variants={headerItemVariants}
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setShowAuthModal(true)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                variants={headerItemVariants}
              >
                <User className="w-5 h-5" />
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-[70px] md:pt-[70px]">
        <AnimatePresence mode="wait">
          {/* 월간 보기 */}
          {viewMode === 'month' && (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col flex-1 px-4 md:px-6 max-w-7xl mx-auto w-full"
            >
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-0 mb-0 bg-white border-b border-gray-200 sticky top-[70px] z-40 shadow-sm">
                {dayNames.map((day, i) => (
                  <div 
                    key={day} 
                    className={\`text-center py-3 text-sm font-semibold \${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}\`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 캘린더 그리드 */}
              <div className="grid grid-cols-7 gap-0 border-t border-gray-200 flex-1">
                {renderCalendar()}
              </div>
            </motion.div>
          )}

          {/* 일간 보기 */}
          {viewMode === 'day' && (
            <motion.div
              key="day-view"
              className="flex-1 flex flex-col max-w-7xl mx-auto w-full"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              {renderDayView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 모달 컴포넌트들은 여기에 추가될 예정 */}
      {/* Event Modal */}
      {/* Tag Modal */}
      {/* Auth Modal */}
      
    </div>
  );
};

export default MonthlyPlanner;
_jsx
      {/* --- Modals --- */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEventModal(false)}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedDate && `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정`}
                </h2>
                <motion.button
                  onClick={() => setShowEventModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {/* 일정 추가 폼 */}
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="새로운 할 일 추가..."
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    autoFocus
                  />
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">태그</label>
                    <div className="grid grid-cols-3 gap-2">
                      {tags.map(tag => (
                        <motion.button
                          key={tag.id}
                          onClick={() => setSelectedTagId(tag.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border-2 ${selectedTagId === tag.id ? 'ring-2 ring-offset-1' : ''}`}
                          style={{ 
                            backgroundColor: selectedTagId === tag.id ? `${tag.color}20` : 'white',
                            color: tag.color,
                            borderColor: selectedTagId === tag.id ? tag.color : 'transparent',
                            ringColor: tag.color
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {tag.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 기존 일정 목록 */}
                {selectedDate && events[getDateKey(selectedDate)] && events[getDateKey(selectedDate)].length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">오늘의 할 일</h3>
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {events[getDateKey(selectedDate)].map(event => {
                          const tag = getTagById(event.tagId);
                          return (
                            <motion.div
                              key={event.id}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${event.completed ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-50'}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <AnimatedCheckbox 
                                isChecked={event.completed} 
                                onClick={() => toggleEventCompletion(getDateKey(selectedDate), event.id)}
                                color={tag?.color || '#6B7280'}
                              />
                              <div className={`flex-1 font-medium text-gray-800 ${event.completed ? 'line-through' : ''}`}>
                                {event.title}
                              </div>
                              <motion.button
                                onClick={() => deleteEvent(getDateKey(selectedDate), event.id)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 mt-auto">
                <motion.button
                  onClick={addEvent}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
                  whileTap={{ scale: 0.98 }}
                >
                  일정 추가
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showTagModal && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTagModal(false)}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">태그 관리</h2>
                <motion.button
                  onClick={() => setShowTagModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </motion.button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {/* 새 태그 추가 */}
                <div className="border-2 border-dashed border-gray-200 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-800">새 태그 추가</h3>
                  <input
                    type="text"
                    placeholder="태그 이름"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                  
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">색상:</span>
                        <div 
                          className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-md"
                          style={{ backgroundColor: newTagColor }}
                          onClick={() => setShowColorPicker(prev => !prev)}
                        />
                      </div>
                      <motion.button
                        onClick={addTag}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        추가
                      </motion.button>
                    </div>
                    
                    <AnimatePresence>
                      {showColorPicker && (
                        <motion.div
                          className="absolute top-full mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl z-10 w-full"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            {colorOptions.map(color => (
                              <motion.div
                                key={color}
                                className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-md"
                                style={{ backgroundColor: color, outline: newTagColor === color ? `3px solid ${color}80` : 'none' }}
                                onClick={() => selectColor(color)}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              className="w-10 h-10 p-0 border-none cursor-pointer rounded-lg"
                            />
                            <input 
                              type="text" 
                              value={customColor} 
                              onChange={(e) => setCustomColor(e.target.value)} 
                              className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                            <motion.button
                              onClick={selectCustomColor}
                              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              선택
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* 기존 태그 목록 */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">내 태그</h3>
                  {tags.map(tag => (
                    <motion.div
                      key={tag.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="font-medium text-gray-800">{tag.name}</span>
                      </div>
                      <motion.button
                        onClick={() => deleteTag(tag.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAuthModal && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAuthModal(false)}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
              variants={modalVariants}
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-extrabold text-gray-900">{authMode === 'login' ? '로그인' : '회원가입'}</h2>
                  <p className="text-gray-500 mt-2">
                    {authMode === 'login' 
                      ? '계정에 로그인하여 일정을 관리하세요.' 
                      : '새 계정을 만들어 시작하세요.'
                    }
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      required
                    />
                    <input
                      type="password"
                      placeholder="비밀번호"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>

                  {authError && (
                    <div className="text-red-500 text-sm font-medium text-center p-3 bg-red-50 rounded-lg">
                      {authError}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105"
                    whileTap={{ scale: 0.98 }}
                  >
                    {authMode === 'login' ? '로그인' : '회원가입'}
                  </motion.button>
                </form>

                <div className="text-center mt-6">
                  <button 
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError('');
                    }}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    {authMode === 'login' 
                      ? '계정이 없으신가요? 회원가입' 
                      : '이미 계정이 있으신가요? 로그인'
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyPlanner;
