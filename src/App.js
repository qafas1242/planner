import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Tag, Download, Upload, Calendar, List, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Firebase SDK Imports ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
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

// --- Animated Checkbox Component (기존 유지) ---
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
        <motion.path
          d="M6 12l4 4l8 -8"
          variants={checkmarkVariants}
          style={{ pathLength: 0 }}
          transition={{ type: "tween", duration: 0.3, ease: "easeOut", delay: 0.1 }}
        />
      </motion.svg>
    </motion.div>
  );
};

// --- Auth Modal Component (신규 추가) ---
const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose(); // 성공 시 모달 닫기
    } catch (err) {
      let msg = "오류가 발생했습니다.";
      if (err.code === 'auth/invalid-email') msg = "유효하지 않은 이메일 주소입니다.";
      else if (err.code === 'auth/user-disabled') msg = "비활성화된 사용자입니다.";
      else if (err.code === 'auth/user-not-found') msg = "사용자를 찾을 수 없습니다.";
      else if (err.code === 'auth/wrong-password') msg = "비밀번호가 틀렸습니다.";
      else if (err.code === 'auth/email-already-in-use') msg = "이미 사용 중인 이메일입니다.";
      else if (err.code === 'auth/weak-password') msg = "비밀번호는 6자리 이상이어야 합니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9, y: 20 }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl w-96 p-8"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{isLogin ? '로그인' : '회원가입'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {loading ? '처리 중...' : (isLogin ? '로그인하기' : '가입하기')}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main Component ---
const MonthlyPlanner = () => {
  // Data States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [tags, setTags] = useState([
    { id: 1, name: '업무', color: '#3B82F6' },
    { id: 2, name: '개인', color: '#10B981' },
    { id: 3, name: '운동', color: '#F59E0B' },
    { id: 4, name: '공부', color: '#8B5CF6' }
  ]);

  // Auth & Sync States
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // 데이터 로드 완료 여부
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  // View & UI States
  const [viewMode, setViewMode] = useState('day'); 
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

  // Constants
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#78716C'
  ];

  // --- Firebase Auth & Data Logic ---

  // 1. 인증 상태 감지 및 초기 데이터 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 로그인 시 Firestore에서 데이터 불러오기
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.events) setEvents(data.events);
            if (data.tags) setTags(data.tags);
          } else {
            // 새 유저인 경우 초기 데이터 유지 (또는 Firestore 초기화)
          }
        } catch (error) {
          console.error("데이터 불러오기 실패:", error);
          alert("데이터를 불러오는 중 오류가 발생했습니다.");
        }
      } else {
        // 로그아웃 시 로컬 상태 초기화 (선택사항, 여기선 유지하거나 비움)
        setEvents({});
        // 태그는 기본값으로 복구
        setTags([
          { id: 1, name: '업무', color: '#3B82F6' },
          { id: 2, name: '개인', color: '#10B981' },
          { id: 3, name: '운동', color: '#F59E0B' },
          { id: 4, name: '공부', color: '#8B5CF6' }
        ]);
      }
      setDataLoaded(true); // 데이터 로드 처리 완료
    });

    return () => unsubscribe();
  }, []);

  // 2. 데이터 변경 시 자동 저장 (Auto-save)
  useEffect(() => {
    if (!user || !dataLoaded) return; // 로그인 안했거나 아직 초기 로딩 중이면 저장 안함

    const saveToFirestore = async () => {
      setSyncStatus('saving');
      try {
        await setDoc(doc(db, "users", user.uid), {
          events,
          tags,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (error) {
        console.error("저장 실패:", error);
        setSyncStatus('error');
      }
    };

    // 디바운싱: 1초 동안 변경이 없으면 저장
    const timeoutId = setTimeout(saveToFirestore, 1000);
    return () => clearTimeout(timeoutId);
  }, [events, tags, user, dataLoaded]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃 되었습니다.");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };


  // --- Helper Functions ---
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

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const scrollToDate = (date) => {
    const dateKey = getDateKey(date);
    const dateElement = document.getElementById(dateKey);
    if (dateElement && dayViewRef.current) {
      const container = dayViewRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = dateElement.getBoundingClientRect();
      const scrollPosition = elementRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2) + (elementRect.height / 2);
      container.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === 'day') {
      setTimeout(() => scrollToDate(today), 50);
    } else if (viewMode === 'week') {
      // 주간 보기 로직
    } else {
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  };

  const switchToDayView = (date) => {
    setCurrentDate(date);
    setViewMode('day');
    setTimeout(() => scrollToDate(date), 450);
  };

  // --- Logic for Events/Tags ---
  const taskTitleVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.5, ease: "easeOut" } }
  };

  const addEvent = () => {
    if (!eventTitle.trim() || !selectedTagId) return;
    const dateKey = getDateKey(selectedDate);
    const newEvent = { id: Date.now(), title: eventTitle, tagId: selectedTagId, completed: false };
    setEvents(prev => ({ ...prev, [dateKey]: [...(prev[dateKey] || []), newEvent] }));
    setEventTitle('');
    setSelectedTagId(null);
    setShowEventModal(false);
  };

  const deleteEvent = (dateKey, eventId) => {
    setEvents(prev => ({ ...prev, [dateKey]: prev[dateKey].filter(e => e.id !== eventId) }));
  };

  const toggleEventCompletion = (dateKey, eventId) => {
    setEvents(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(event => event.id === eventId ? { ...event, completed: !event.completed } : event)
    }));
  };

  const addTag = () => {
    if (!newTagName.trim()) return;
    const newTag = { id: Date.now(), name: newTagName, color: newTagColor };
    setTags(prev => [...prev, newTag]);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setShowColorPicker(false);
  };

  const deleteTag = (tagId) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
  };

  const openEventModal = (date) => {
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const getTagById = (tagId) => {
    return tags.find(t => t.id === tagId);
  };

  const exportData = () => {
    const data = { events, tags, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-data-${new Date().toISOString().split('T')[0]}.json`;
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
        const data = JSON.parse(e.target.result);
        if (data.events) setEvents(data.events);
        if (data.tags) setTags(data.tags);
        alert('데이터를 성공적으로 불러왔습니다!');
      } catch (error) {
        alert('데이터 불러오기에 실패했습니다.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const selectColor = (color) => {
    setNewTagColor(color);
    setCustomColor(color);
    setShowColorPicker(false);
  };

  const selectCustomColor = () => {
    setNewTagColor(customColor);
    setShowColorPicker(false);
  };

  const getDaysForDayView = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getDaysForWeekView = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // Animation Variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25, duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2, ease: "easeIn" } }
  };
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  const headerItemVariants = {
    hidden: { opacity: 0, y: -15, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15, duration: 0.4 } }
  };
  const calendarCellVariants = {
    initial: { opacity: 0, y: 15, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 250, damping: 20 } },
    hover: { scale: 1.03, y: -2, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", transition: { type: "spring", stiffness: 500, damping: 15 } }
  };
  const calendarEventVariants = {
    hidden: { scaleX: 0, opacity: 0, originX: 0 },
    visible: (index) => ({ scaleX: 1, opacity: 1, originX: 0, transition: { type: "spring", stiffness: 300, damping: 20, delay: index * 0.05 } })
  };
  const dayTaskItemVariants = {
    hidden: { scaleX: 0, opacity: 0, originX: 0, transition: { duration: 0.3 } },
    visible: (i) => ({ scaleX: 1, opacity: 1, originX: 0, transition: { type: "spring", stiffness: 300, damping: 15, delay: i * 0.05, when: "beforeChildren" } }),
    exit: { opacity: 0, scaleX: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.4, ease: "easeInOut" } }
  };

  // --- Rendering Logic ---
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50/30 border border-gray-100" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = getDateKey(date);
      const dayEvents = events[dateKey] || [];
      const isToday = new Date().toDateString() === date.toDateString();
      const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      
      days.push(
        <motion.div
          key={day}
          className="border border-gray-100 bg-white cursor-pointer p-1.5 sm:p-2 relative group flex flex-col min-h-[100px]"
          onClick={() => openEventModal(date)}
          variants={calendarCellVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          transition={{ duration: 0.3, delay: (day + startingDayOfWeek) * 0.015 }}
        >
          <div className="flex justify-between items-start mb-1">
            <motion.span 
              className={`text-xs sm:text-sm font-medium ${isToday ? 'bg-blue-500 text-white w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs' : 'text-gray-700'}`}
              whileHover={isToday ? { scale: 1.1, rotate: 5 } : {}}
            >
              {day}
            </motion.span>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              whileHover={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
              className="absolute top-1 right-1"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </motion.div>
          </div>
          <div className="space-y-0.5 sm:space-y-1 overflow-hidden flex-1">
            <AnimatePresence>
              {sortedEvents.slice(0, 3).map((event, index) => {
                const tag = getTagById(event.tagId);
                return (
                  <motion.div
                    key={event.id}
                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate ${event.completed ? 'line-through opacity-60' : ''}`}
                    style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
                    onClick={(e) => e.stopPropagation()}
                    variants={calendarEventVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ scaleX: 0, opacity: 0, transition: { duration: 0.3 } }}
                    custom={index}
                  >
                    {event.title}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {sortedEvents.length > 3 && (
              <motion.div 
                className="text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{sortedEvents.length - 3}
              </motion.div>
            )}
          </div>
        </motion.div>
      );
    }
    return days;
  };

  const renderWeekView = () => {
    const days = getDaysForWeekView;
    return (
      <motion.div 
        className="flex-1 flex flex-col"
        initial={{ opacity: 0, x: 60, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -60, scale: 0.98 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
      >
        <div className="grid grid-cols-7 gap-0 mb-2 px-4 md:px-6">
          {days.map((date, i) => {
            const dayOfWeek = dayNames[date.getDay()];
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <motion.div 
                key={i} 
                className={`text-center py-2 text-sm font-semibold cursor-pointer transition-colors rounded-lg ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
                onClick={() => switchToDayView(date)}
                whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={isToday ? 'bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full mx-auto' : ''}>
                  {dayOfWeek}
                </span>
                <div className="text-xs mt-1">{date.getDate()}</div>
              </motion.div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
          {days.map((date, i) => {
            const dateKey = getDateKey(date);
            const dayEvents = events[dateKey] || [];
            const isToday = new Date().toDateString() === date.toDateString();
            const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
            return (
              <motion.div
                key={i}
                className={`border border-gray-100 bg-white cursor-pointer p-1.5 sm:p-2 relative group flex flex-col min-h-[100px] ${isToday ? 'bg-blue-50/30' : ''}`}
                onClick={() => openEventModal(date)}
                variants={calendarCellVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="flex justify-end items-start mb-1">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                    whileHover={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
                    className="absolute top-1 right-1"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  </motion.div>
                </div>
                <div className="space-y-0.5 sm:space-y-1 overflow-hidden flex-1">
                  <AnimatePresence>
                    {sortedEvents.slice(0, 5).map((event, index) => {
                      const tag = getTagById(event.tagId);
                      return (
                        <motion.div
                          key={event.id}
                          className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate ${event.completed ? 'line-through opacity-60' : ''}`}
                          style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
                          onClick={(e) => e.stopPropagation()}
                          variants={calendarEventVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ scaleX: 0, opacity: 0, transition: { duration: 0.3 } }}
                          custom={index}
                        >
                          {event.title}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {sortedEvents.length > 5 && (
                    <motion.div className="text-xs text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      +{sortedEvents.length - 5}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderDayView = () => {
    const days = getDaysForDayView();
    return (
      <motion.div 
        ref={dayViewRef}
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0, x: viewMode === 'month' ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: viewMode === 'month' ? -50 : 50 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
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
              id={getDateKey(date)}
              className={`border-b border-gray-200 p-4 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`} whileHover={{ scale: 1.1 }}>
                      {date.getDate()}
                    </motion.div>
                    <div>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>{dayOfWeek}</div>
                      <div className="text-xs text-gray-500">{date.getFullYear()}년 {date.getMonth() + 1}월</div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => openEventModal(date)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
                
                {sortedEvents.length > 0 ? (
                  <motion.div className="space-y-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
                    <AnimatePresence>
                      {sortedEvents.map((event, eventIndex) => {
                        const tag = getTagById(event.tagId);
                        return (
                          <motion.div
                            key={event.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer overflow-hidden ${event.completed ? 'opacity-50' : 'hover:shadow-md'}`}
                            style={{ backgroundColor: `${tag?.color}10` }}
                            onClick={(e) => { e.stopPropagation(); toggleEventCompletion(dateKey, event.id); }}
                            variants={dayTaskItemVariants}
                            custom={eventIndex}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            whileHover={{ scale: event.completed ? 1.0 : 1.02, boxShadow: event.completed ? 'none' : "0 8px 16px rgba(0, 0, 0, 0.1)", transition: { type: "spring", stiffness: 400, damping: 15 } }}
                          >
                            <AnimatedCheckbox 
                              isChecked={event.completed} 
                              onClick={(e) => { e.stopPropagation(); toggleEventCompletion(dateKey, event.id); }}
                              color={tag?.color}
                            />
                            <motion.div className="flex-1 flex items-center gap-2" variants={taskTitleVariants}>
                              <div className={`font-medium text-gray-900 ${event.completed ? 'line-through' : ''}`}>{event.title}</div>
                              <div className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}>
                                {tag?.name}
                              </div>
                            </motion.div>
                            <motion.button
                              onClick={(e) => { e.stopPropagation(); deleteEvent(dateKey, event.id); }}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div className="text-center py-8 text-gray-400 text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    일정이 없습니다
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  useEffect(() => {
    if (viewMode === 'day') {
      const today = new Date();
      if (getDateKey(currentDate) !== getDateKey(today)) {
        setTimeout(() => {
          const firstDayKey = getDateKey(getDaysForDayView()[0]);
          document.getElementById(firstDayKey)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [viewMode, currentDate]);

  const viewModeMap = {
    month: { icon: <Calendar className="w-4 h-4" />, text: '월간' },
    week: { icon: <List className="w-4 h-4" />, text: '주간' },
    day: { icon: <List className="w-4 h-4" />, text: '일간' },
  };

  const getNextViewMode = (current) => {
    if (current === 'month') return 'week';
    if (current === 'week') return 'day';
    return 'month';
  };

  const currentViewModeData = viewModeMap[viewMode];
  const nextViewModeData = viewModeMap[getNextViewMode(viewMode)];

  return (
    <div className="h-screen bg-white flex flex-col" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* Header Fixed Wrapper */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <motion.div 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div className="flex items-center gap-4" variants={headerItemVariants}>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {viewMode === 'week' 
                    ? `${currentDate.getFullYear()}년 ${monthNames[getDaysForWeekView[0].getMonth()]} ${getDaysForWeekView[0].getDate()}일 - ${monthNames[getDaysForWeekView[6].getMonth()]} ${getDaysForWeekView[6].getDate()}일`
                    : `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`
                  }
                </h1>
                <div className="flex gap-1">
                  <motion.button
                    onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.15, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.15, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </motion.div>
              
              <motion.div className="flex flex-wrap gap-2 items-center" variants={headerItemVariants}>
                {/* Auth Status & Login/Logout Buttons */}
                {user ? (
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs text-gray-500 hidden md:inline-block">
                      {user.email}
                      {syncStatus === 'saving' && <span className="ml-2 text-blue-500">저장 중...</span>}
                      {syncStatus === 'saved' && <span className="ml-2 text-green-500">저장됨</span>}
                    </span>
                    <motion.button
                      onClick={handleLogout}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">로그아웃</span>
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 mr-2"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>로그인/가입</span>
                  </motion.button>
                )}

                <motion.button
                  onClick={() => setViewMode(getNextViewMode(viewMode))}
                  className={`px-3 md:px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    viewMode !== 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentViewModeData.icon}
                  <span className="hidden sm:inline">{currentViewModeData.text}</span>
                </motion.button>
                
                {/* 내보내기/불러오기는 서브 기능으로 유지 */}
                <motion.button
                  onClick={exportData}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="내보내기"
                  whileHover={{ scale: 1.1 }}
                >
                  <Download className="w-4 h-4" />
                </motion.button>
                <motion.label 
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="불러오기"
                  whileHover={{ scale: 1.1 }}
                >
                  <Upload className="w-4 h-4" />
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </motion.label>

                <motion.button
                  onClick={() => setShowTagModal(true)}
                  className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">태그</span>
                </motion.button>
                <motion.button
                  onClick={goToToday}
                  className="px-3 md:px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  오늘
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col pt-[140px] sm:pt-[100px]">
          <AnimatePresence mode="wait">
            {viewMode === 'month' && (
              <motion.div
                key="month-view"
                initial={{ opacity: 0, x: 60, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -60, scale: 0.98 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
                className="flex flex-col flex-1 px-4 md:px-6"
              >
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {dayNames.map((day, i) => (
                    <motion.div 
                      key={day} 
                      className={`text-center py-2 text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      {day}
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
                  {renderCalendar()}
                </div>
              </motion.div>
            )}
            {viewMode === 'week' && (
              <motion.div key="week-view" className="flex-1 flex flex-col">
                {renderWeekView()}
              </motion.div>
            )}
            {viewMode === 'day' && (
              <motion.div key="day-view" className="flex-1 flex flex-col">
                {renderDayView()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Event Modal */}
        <AnimatePresence>
          {showEventModal && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" 
              onClick={() => setShowEventModal(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl w-96 p-6 max-h-[80vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
                variants={modalVariants}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedDate && `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`}
                  </h2>
                  <motion.button
                    onClick={() => setShowEventModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="할 일 제목"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">태그 선택</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tags.map(tag => (
                        <motion.button
                          key={tag.id}
                          onClick={() => setSelectedTagId(tag.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedTagId === tag.id ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}`}
                          style={{ 
                            backgroundColor: `${tag.color}${selectedTagId === tag.id ? '' : '20'}`,
                            color: selectedTagId === tag.id ? 'white' : tag.color,
                            ringColor: tag.color
                          }}
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {tag.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedDate && events[getDateKey(selectedDate)]?.length > 0 && (
                  <motion.div 
                    className="mb-4 space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">할 일 목록</h3>
                    <AnimatePresence>
                      {events[getDateKey(selectedDate)].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map((event, eventIndex) => {
                        const tag = getTagById(event.tagId);
                        return (
                          <motion.div 
                            key={event.id} 
                            className={`flex items-center justify-between p-3 rounded-lg ${event.completed ? 'opacity-50' : ''}`} 
                            style={{ backgroundColor: `${tag?.color}10` }}
                            variants={dayTaskItemVariants}
                            custom={eventIndex}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                          >
                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                              <AnimatedCheckbox 
                                isChecked={event.completed} 
                                onClick={(e) => { e.stopPropagation(); toggleEventCompletion(getDateKey(selectedDate), event.id); }}
                                color={tag?.color}
                              />
                              <motion.span 
                                className={`text-sm font-medium text-gray-900 truncate ${event.completed ? 'line-through' : ''}`}
                                variants={taskTitleVariants}
                              >
                                {event.title}
                              </motion.span>
                              <span className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}>
                                {tag?.name}
                              </span>
                            </div>
                            <motion.button
                              onClick={() => deleteEvent(getDateKey(selectedDate), event.id)}
                              className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}

                <motion.button
                  onClick={addEvent}
                  disabled={!eventTitle.trim() || !selectedTagId}
                  className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  할 일 추가
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag Management Modal */}
        <AnimatePresence>
          {showTagModal && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" 
              onClick={() => setShowTagModal(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl w-[500px] p-6 max-h-[80vh] overflow-y-auto" 
                onClick={(e) => e.stopPropagation()}
                variants={modalVariants}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">태그 관리</h2>
                  <motion.button
                    onClick={() => setShowTagModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="새 태그 이름"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">색상 선택</label>
                    <div className="grid grid-cols-7 gap-2">
                      {colorOptions.map(color => (
                        <motion.button
                          key={color}
                          onClick={() => selectColor(color)}
                          className={`w-10 h-10 rounded-lg transition-all relative`}
                          style={{ backgroundColor: color }}
                          whileHover={{ scale: 1.15, rotate: 8 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {newTagColor === color && (
                            <motion.div 
                              className="absolute inset-0 rounded-lg border-3 border-white ring-2 ring-gray-400"
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0, transition: { type: "spring", stiffness: 500, damping: 25 } }}
                            />
                          )}
                        </motion.button>
                      ))}
                      <motion.button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center text-white text-lg font-bold ${showColorPicker ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)' }}
                        title="커스텀 색상"
                        whileHover={{ scale: 1.15, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showColorPicker ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    
                    <AnimatePresence>
                      {showColorPicker && (
                        <motion.div 
                          className="mt-3 p-4 bg-gray-50 rounded-lg overflow-hidden"
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 mb-2">커스텀 색상</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              className="w-16 h-10 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="#000000"
                            />
                            <motion.button
                              onClick={selectCustomColor}
                              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600"
                              whileHover={{ scale: 1.08, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              적용
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    onClick={addTag}
                    disabled={!newTagName.trim()}
                    className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    태그 추가
                  </motion.button>
                </div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">기존 태그</h3>
                  <AnimatePresence>
                    {tags.map((tag, index) => (
                      <motion.div 
                        key={tag.id} 
                        className="flex items-center justify-between p-3 rounded-lg" 
                        style={{ backgroundColor: `${tag.color}10` }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                        transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                        layout
                        whileHover={{ scale: 1.02, x: 5 }}
                      >
                        <div className="flex items-center gap-2">
                          <motion.div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: tag.color }}
                            whileHover={{ scale: 1.2, rotate: 45 }}
                          />
                          <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                        </div>
                        <motion.button
                          onClick={() => deleteTag(tag.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          whileHover={{ scale: 1.2, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login/Signup Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default MonthlyPlanner;
