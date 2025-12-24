import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Tag, Download, Upload, Calendar, List, User, LogOut } from 'lucide-react';
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

// Animated Checkbox Component
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

const MonthlyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [tags, setTags] = useState([
    { id: 1, name: '업무', color: '#3B82F6' },
    { id: 2, name: '개인', color: '#10B981' },
    { id: 3, name: '운동', color: '#F59E0B' },
    { id: 4, name: '공부', color: '#8B5CF6' }
  ]);
  // 'month', 'day'
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
  // 스크롤을 위한 Ref 추가
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

  // --- Firebase Logic ---

  // 1. Auth Listener: 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 로그인 성공 시 DB에서 데이터 불러오기
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
          setIsDataLoaded(true); // 데이터 로딩 완료 표시 (이후부터 저장 가능)
        }
      } else {
        // 로그아웃 시 상태 초기화 (옵션: 로컬 데이터 유지하려면 이 부분 조정)
        setIsDataLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Auto Save: 데이터 변경 시 DB 자동 저장
  useEffect(() => {
    // 유저가 있고, 초기 데이터 로딩이 완료된 상태에서만 저장 수행
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

      // 디바운싱: 너무 잦은 쓰기 방지 (1초 딜레이)
      const timeoutId = setTimeout(saveData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [events, tags, user, isDataLoaded]);

  // 3. Auth Actions
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
      // 실제 에러 확인을 위한 로깅
      console.error("Firebase Auth Error:", error.code, error.message);
      
      let msg = "오류가 발생했습니다.";
      
      // 회원가입 에러
      if (error.code === 'auth/email-already-in-use') {
        msg = "이미 사용 중인 이메일입니다.";
      } 
      else if (error.code === 'auth/invalid-email') {
        msg = "유효하지 않은 이메일 형식입니다.";
      } 
      else if (error.code === 'auth/weak-password') {
        msg = "비밀번호는 6자리 이상이어야 합니다.";
      }
      // ⭐ 로그인 에러 (업데이트된 에러 코드)
      else if (error.code === 'auth/invalid-credential' || 
               error.code === 'auth/invalid-login-credentials' ||
               error.code === 'auth/user-not-found' || 
               error.code === 'auth/wrong-password') {
        msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      }
      // 계정 비활성화
      else if (error.code === 'auth/user-disabled') {
        msg = "비활성화된 계정입니다.";
      }
      // 너무 많은 시도
      else if (error.code === 'auth/too-many-requests') {
        msg = "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      }
      // 네트워크 에러
      else if (error.code === 'auth/network-request-failed') {
        msg = "네트워크 연결을 확인해주세요.";
      }
      // 알 수 없는 에러 (디버깅용)
      else {
        msg = `오류가 발생했습니다. (${error.code})`;
      }
      
      setAuthError(msg);
    }
  };

  const handleLogout = async () => {
    try {
      // 먼저 isDataLoaded를 false로 설정하여 Auto Save 방지
      setIsDataLoaded(false);
      
      // Firebase 로그아웃 실행
      await signOut(auth);
      
      // 로그아웃 후 상태 초기화
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
  
  // 일간 모드에서 오늘 버튼 눌렀을때 오늘 날짜가 중앙에 오도록 자동 스크롤 되도록 수정
  const scrollToDate = (date) => {
    const dateKey = getDateKey(date);
    const dateElement = document.getElementById(dateKey);
    if (dateElement && dayViewRef.current) {
      // 스크롤 컨테이너를 명시적으로 사용하여 스크롤
      const container = dayViewRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = dateElement.getBoundingClientRect();
      
      // 요소의 중앙이 컨테이너의 중앙에 오도록 계산
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
      // 뷰 전환 애니메이션(400ms)이 끝난 후 스크롤이 실행되도록 지연 시간을 넉넉하게 줌
      setTimeout(() => scrollToDate(today), 450);
    } else {
      // 월간 보기에서는 해당 월의 1일로 이동
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  };

  // 할 일 추가 시 애니메이션을 위한 variants
  const taskItemVariants = {
    hidden: { 
      scaleX: 0, 
      opacity: 0, 
      originX: 0,
      transition: { duration: 0.3 }
    },
    visible: { 
      scaleX: 1, 
      opacity: 1, 
      originX: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 15, 
        when: "beforeChildren"
      }
    },
    exit: { 
      opacity: 0, 
      scaleX: 0,
      height: 0, 
      paddingTop: 0, 
      paddingBottom: 0,
      transition: { 
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  };
  // 할 일 제목 Fade In 애니메이션 variants
  const taskTitleVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        delay: 0.1, // 타원 확장 시작(0s) 후 0.1초 뒤에 시작
        duration: 0.5,
        ease: "easeOut"
      } 
    }
  };

  const addEvent = () => {
    if (!eventTitle.trim() || !selectedTagId) return;
    
    const dateKey = getDateKey(selectedDate);
    const newEvent = {
      id: Date.now(),
      title: eventTitle,
      tagId: selectedTagId,
      completed: false,
    };
    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEvent]
    }));
    setEventTitle('');
    setSelectedTagId(null);
    setShowEventModal(false);
  };

  const deleteEvent = (dateKey, eventId) => {
    setEvents(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(e => e.id !== eventId)
    }));
  };

  const toggleEventCompletion = (dateKey, eventId) => {
    setEvents(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(event => 
        event.id === eventId ? { ...event, completed: !event.completed } : event
      )
    }));
  };

  const addTag = () => {
    if (!newTagName.trim()) return;
    const newTag = {
      id: Date.now(),
      name: newTagName,
      color: newTagColor
    };
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
    const data = {
      events,
      tags,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `calendar-data-${today}.json`;
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
        alert('데이터 불러오기에 실패했습니다. 올바른 파일인지 확인해주세요.');
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
  const getDaysForDayView = useMemo(() => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);
  
  // 모달 애니메이션 variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { 
        duration: 0.2, 
        ease: "easeIn" 
      } 
    }
  };
  // 배경 오버레이 애니메이션 variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  // 헤더 항목 애니메이션 variants
  const headerItemVariants = {
    hidden: { opacity: 0, y: -15, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 200,
        damping: 15,
        duration: 0.4
      } 
    }
  };

  // 캘린더 셀 애니메이션 variants (상호작용 강화)
  const calendarCellVariants = {
    initial: { opacity: 0, y: 15, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 250,
        damping: 20
      }
    },
    hover: { 
      scale: 1.03, 
      y: -2,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 15 
      } 
    }
  };
  // 캘린더 뷰 할 일 항목 애니메이션 variants (타원 성장 효과)
  const calendarEventVariants = {
    hidden: { 
      scaleX: 0, 
      opacity: 0, 
      originX: 0 
    },
    visible: (index) => ({ 
      scaleX: 1, 
      opacity: 1, 
      originX: 0,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: index * 0.05
      }
    })
  };
  // 일간 보기 항목 애니메이션 (상호작용 강화)
  const dayTaskItemVariants = {
    hidden: { 
      scaleX: 0, 
      opacity: 0, 
      originX: 0,
      transition: { duration: 0.3 }
    },
    visible: (i) => ({ 
      scaleX: 1, 
      opacity: 1, 
      originX: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 15, 
        delay: i * 0.05, // 순차적 등장
        when: "beforeChildren"
      }
    }),
    exit: { 
      opacity: 0, 
      scaleX: 0,
      height: 0, 
      paddingTop: 0, 
      paddingBottom: 0,
      transition: { 
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  };
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
          className="border border-gray-100 bg-white cursor-pointer p-1.5 sm:p-2 relative group flex flex-col"
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
              {sortedEvents.slice(0, 2).map((event, index) => {
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
            {sortedEvents.length > 2 && (
              <motion.div 
                className="text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{sortedEvents.length - 2}
              </motion.div>
            )}
          </div>
        </motion.div>
      );
    }
    
    return days;
  };
  
  const renderDayView = () => {
    const days = getDaysForDayView;
    return (
      <motion.div 
        ref={dayViewRef} // Ref를 스크롤 컨테이너에 연결
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
                    <motion.div 
                      className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {date.getDate()}
                    </motion.div>
                    <div>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                        {dayOfWeek}
                      </div>
                      <div className="text-xs text-gray-500">
                        {date.getFullYear()}년 {date.getMonth() + 1}월
                      </div>
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
                  <motion.div 
                    className="space-y-2"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
                  >
                    <AnimatePresence>
                      {sortedEvents.map((event, eventIndex) => {
                        const tag = getTagById(event.tagId);
                        return (
                          <motion.div
                            key={event.id}
                            // 체크된 항목은 투명도를 낮춥니다.
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer overflow-hidden ${event.completed ? 'opacity-50' : 'hover:shadow-md'}`}
                            style={{ backgroundColor: `${tag?.color}10` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEventCompletion(dateKey, event.id);
                            }}
                            variants={dayTaskItemVariants} // 변경된 variants 적용
                            custom={eventIndex} // staggerChildren을 위해 index 전달
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                            whileHover={{ 
                              scale: event.completed ? 1.0 : 1.02, 
                              boxShadow: event.completed ? 'none' : "0 8px 16px rgba(0, 0, 0, 0.1)",
                              transition: { type: "spring", stiffness: 400, damping: 15 }
                            }}
                          >
                            <AnimatedCheckbox 
                              isChecked={event.completed} 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEventCompletion(dateKey, event.id);
                              }}
                              color={tag?.color}
                            />
                            
                            <motion.div 
                              className="flex-1 flex items-center gap-2" // 태그 이름을 옆에 표시하기 위해 flex-1 flex items-center gap-2 추가
                              variants={taskTitleVariants}
                            >
                              <div className={`font-medium text-gray-900 ${event.completed ? 'line-through' : ''}`}>{event.title}</div>
                              {/* 할 일 이름 옆에 태그 이름 표시 */}
                              <div className="text-xs px-2 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}>
                                {tag?.name}
                              </div>
                            </motion.div>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteEvent(dateKey, event.id);
                              }}
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
                  <motion.div 
                    className="text-center py-8 text-gray-400 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
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
  
  // 일간 모드에서 월 전환할 때 가능한 최대까지 위로 자동 스크롤시키고
  useEffect(() => {
    if (viewMode === 'day') {
      // goToToday에서 이미 스크롤 로직을 처리하므로, 여기서는 현재 날짜가 오늘이 아닐 경우에만 첫 날로 스크롤
      
      // 월이 변경되었거나, 뷰 모드가 'day'로 전환되었을 때
      if (dayViewRef.current) {
        // 뷰 전환 애니메이션(400ms)이 끝난 후 스크롤이 실행되도록 지연 시간을 넉넉하게 줌
        setTimeout(() => {
          dayViewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }, 450);
      }
    }
  }, [viewMode, currentDate]); // currentDate가 변경되면 (월 전환 포함) 실행

  // 뷰 모드 버튼 텍스트를 위한 맵 (주간 모드 제거)
  const viewModeMap = {
    month: { icon: <Calendar className="w-4 h-4" />, text: '월간' },
    day: { icon: <List className="w-4 h-4" />, text: '일간' },
  };
  
  // 뷰 모드 전환 로직 수정 (month <-> day)
  const getNextViewMode = (current) => {
    if (current === 'month') return 'day';
    return 'month';
  };

  const getPrevViewMode = (current) => {
    if (current === 'day') return 'month';
    return 'day';
  };

  const currentViewModeData = viewModeMap[viewMode];
  const nextViewModeData = viewModeMap[getNextViewMode(viewMode)];
  
  return (
    <div className="h-screen bg-white flex flex-col" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* 메뉴를 감싸는 Fixed Wrapper */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            {/* 헤더 */}
            <motion.div 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div className="flex items-center gap-4" variants={headerItemVariants}>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {/* 월간 보기만 남았으므로 월 표시만 */}
                  {`${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
                </h1>
                <div className="flex gap-1">
                  <motion.button
                    // 월간 모드만 남았으므로 navigateMonth만 사용
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.15, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
                    // 월간 모드만 남았으므로 navigateMonth만 사용
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.15, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </motion.div>
              <motion.div className="flex flex-wrap gap-2" variants={headerItemVariants}>
                <motion.button
                  onClick={() => setViewMode(getNextViewMode(viewMode))}
                  className={`px-3 md:px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    viewMode !== 'month' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentViewModeData.icon}
                  <span className="hidden sm:inline">{currentViewModeData.text}</span>
                </motion.button>
                <motion.button
                  onClick={exportData}
                  className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">내보내기</span>
                </motion.button>
                <motion.label 
                  className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">불러오기</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </motion.label>
                <motion.button
                  onClick={() => setShowTagModal(true)}
                  className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">태그 관리</span>
                </motion.button>
                
                {/* --- Firebase Login/Logout Button --- */}
                {user ? (
                  <motion.button
                    onClick={handleLogout}
                    className="px-3 md:px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={() => setShowAuthModal(true)}
                    className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">로그인</span>
                  </motion.button>
                )}

              </motion.div>
            </motion.div>
            {/* 요청에 따라 태그 나열 제거 */}
          </div>
        </div>

        {/* 컨텐츠 영역 - 모바일 레이아웃 문제 해결을 위해 반응형 패딩 적용 */}
        <div className="flex-1 flex flex-col pt-[140px] sm:pt-[100px]">
          {/* 뷰 모드 전환 애니메이션 */}
          <AnimatePresence mode="wait">
            {/* 월간 보기 */}
            {viewMode === 'month' && (
              <motion.div
                key="month-view"
                initial={{ opacity: 0, x: 60, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -60, scale: 0.98 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
                className="flex flex-col flex-1 px-4 md:px-6"
              >
                {/* 요일 헤더 */}
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

                {/* 캘린더 그리드 */}
                <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
                  {renderCalendar()}
                </div>
              </motion.div>
            )}

            {/* 일간 보기 */}
            {viewMode === 'day' && (
              <motion.div key="day-view" className="flex-1 flex flex-col">
                {renderDayView()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 일정 추가 모달 */}
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
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedTagId === tag.id 
                              ? 'ring-2 ring-offset-2' 
                              : 'hover:bg-gray-50'
                          }`}
                          style={{ 
                            backgroundColor: selectedTagId === tag.id ? `${tag.color}20` : 'white',
                            color: tag.color,
                            borderColor: tag.color,
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

                <motion.button
                  onClick={addEvent}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  일정 추가
                </motion.button>
                
                {/* 해당 날짜의 기존 일정 목록 */}
                {selectedDate && events[getDateKey(selectedDate)] && events[getDateKey(selectedDate)].length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">오늘의 할 일</h3>
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {events[getDateKey(selectedDate)].map(event => {
                          const tag = getTagById(event.tagId);
                          return (
                            <motion.div
                              key={event.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer overflow-hidden ${event.completed ? 'opacity-50' : 'hover:shadow-sm'}`}
                              style={{ backgroundColor: `${tag?.color}10` }}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <AnimatedCheckbox 
                                isChecked={event.completed} 
                                onClick={() => toggleEventCompletion(getDateKey(selectedDate), event.id)}
                                color={tag?.color}
                              />
                              <div className={`flex-1 font-medium text-gray-900 ${event.completed ? 'line-through' : ''}`}>
                                {event.title}
                              </div>
                              <motion.button
                                onClick={() => deleteEvent(getDateKey(selectedDate), event.id)}
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
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 태그 관리 모달 */}
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
                className="bg-white rounded-2xl shadow-2xl w-96 p-6 max-h-[80vh] overflow-y-auto" 
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
                  {/* 새 태그 추가 */}
                  <div className="border p-4 rounded-lg space-y-3">
                    <h3 className="font-medium text-gray-700">새 태그 추가</h3>
                    <input
                      type="text"
                      placeholder="태그 이름"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    
                    {/* 색상 선택 */}
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">색상:</span>
                          <div 
                            className="w-6 h-6 rounded-full cursor-pointer border-2 border-gray-300" 
                            style={{ backgroundColor: newTagColor }}
                            onClick={() => setShowColorPicker(prev => !prev)}
                          />
                        </div>
                        <motion.button
                          onClick={addTag}
                          className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          추가
                        </motion.button>
                      </div>
                      
                      {/* 색상 선택기 팝업 */}
                      <AnimatePresence>
                        {showColorPicker && (
                          <motion.div
                            className="absolute top-full mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl z-10"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="grid grid-cols-5 gap-2">
                              {colorOptions.map(color => (
                                <motion.div
                                  key={color}
                                  className="w-6 h-6 rounded-full cursor-pointer border-2 border-white shadow-md"
                                  style={{ backgroundColor: color, outline: newTagColor === color ? `2px solid ${color}` : 'none' }}
                                  onClick={() => selectColor(color)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                />
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-8 h-8 p-0 border-none cursor-pointer"
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
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-700">현재 태그</h3>
                    {tags.map(tag => (
                      <motion.div
                        key={tag.id}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{ backgroundColor: `${tag.color}10` }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                          <span className="text-sm font-medium" style={{ color: tag.color }}>{tag.name}</span>
                        </div>
                        <motion.button
                          onClick={() => deleteTag(tag.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 인증 모달 (로그인/회원가입) */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" 
              onClick={() => setShowAuthModal(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div 
                className="bg-white rounded-2xl shadow-2xl w-96 p-6" 
                onClick={(e) => e.stopPropagation()}
                variants={modalVariants}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {authMode === 'login' ? '로그인' : '회원가입'}
                  </h2>
                  <motion.button
                    onClick={() => setShowAuthModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </motion.button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                  <input
                    type="email"
                    placeholder="이메일"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="password"
                    placeholder="비밀번호 (6자리 이상)"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  
                  {authError && (
                    <motion.p 
                      className="text-red-500 text-sm bg-red-50 p-2 rounded-lg"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {authError}
                    </motion.p>
                  )}

                  <motion.button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {authMode === 'login' ? '로그인' : '회원가입'}
                  </motion.button>
                </form>

                <div className="mt-4 text-center">
                  <motion.button
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError(''); // 모드 변경 시 에러 메시지 초기화
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {authMode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MonthlyPlanner;
