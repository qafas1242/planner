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
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
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

const MonthlyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [tags, setTags] = useState([
    { id: 1, name: '업무', color: '#3B82F6' },
    { id: 2, name: '개인', color: '#10B981' },
    { id: 3, name: '운동', color: '#F59E0B' },
    { id: 4, name: '공부', color: '#8B5CF6' }
  ]);
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
  const [authMode, setAuthMode] = useState('login'); 
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [rememberMe, setRememberMe] = useState(false); 
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- Firebase Logic ---
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(savedRememberMe);
  }, []);

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
      saveData();
    }
  }, [events, tags, user, isDataLoaded]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        alert("회원가입 성공! 자동 로그인됩니다.");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
      
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      console.error("Firebase Auth Error:", error.code, error.message);
      let msg = "오류가 발생했습니다.";
      if (error.code === 'auth/email-already-in-use') msg = "이미 사용 중인 이메일입니다.";
      else if (error.code === 'auth/invalid-email') msg = "유효하지 않은 이메일 형식입니다.";
      else if (error.code === 'auth/weak-password') msg = "비밀번호는 6자리 이상이어야 합니다.";
      else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') msg = "이메일 또는 비밀번호가 올바르지 않습니다.";
      else if (error.code === 'auth/user-disabled') msg = "비활성화된 계정입니다.";
      else if (error.code === 'auth/too-many-requests') msg = "너무 많은 로그인 시도가 있었습니다.";
      else if (error.code === 'auth/network-request-failed') msg = "네트워크 연결을 확인해주세요.";
      
      setAuthError(msg);
    }
  };

  const handleLogout = async () => {
    try {
      setIsDataLoaded(false);
      if (!rememberMe) localStorage.removeItem('rememberMe');
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
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    
    if (viewMode === 'day') {
      setTimeout(() => {
        scrollToDate(today);
      }, 50);
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
  
  const getTagById = (tagId) => tags.find(t => t.id === tagId);
  
  const exportData = () => {
    const data = { events, tags, exportDate: new Date().toISOString() };
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
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentDate]);

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50/20" />);
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
          className={`min-h-[100px] border-b border-r border-gray-100 p-2 relative group flex flex-col transition-colors ${isToday ? 'bg-blue-50/10' : 'bg-white'}`}
          onClick={() => openEventModal(date)}
          whileHover={{ backgroundColor: "rgba(249, 250, 251, 1)" }}
        >
          <div className="flex justify-between items-start mb-1.5">
            <span 
              className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 
                ${isToday 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                  : 'text-gray-700 group-hover:bg-gray-100'}`}
            >
              {day}
            </span>
          </div>
          <div className="space-y-1 overflow-hidden flex-1">
            {sortedEvents.slice(0, 3).map((event) => {
              const tag = getTagById(event.tagId);
              return (
                <div
                  key={event.id}
                  className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-medium truncate group/item transition-all hover:brightness-95
                    ${event.completed ? 'opacity-50 line-through' : ''}`}
                  style={{ backgroundColor: `${tag?.color}15`, color: tag?.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleEventCompletion(dateKey, event.id);
                  }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.completed ? 'bg-gray-400' : ''}`} style={{ backgroundColor: event.completed ? undefined : tag?.color }} />
                  <span className="truncate">{event.title}</span>
                </div>
              );
            })}
            {sortedEvents.length > 3 && (
              <div className="text-[10px] text-gray-400 pl-1 mt-0.5 font-medium">
                +{sortedEvents.length - 3} more
              </div>
            )}
          </div>
        </motion.div>
      );
    }
    
    const totalSlots = days.length;
    const remainingSlots = 42 - totalSlots; 
    for (let i = 0; i < remainingSlots; i++) {
        days.push(<div key={`empty-end-${i}`} className="bg-gray-50/20 border-b border-r border-gray-100 min-h-[100px]" />);
    }

    return days;
  };
  
  const renderDayView = () => {
    const days = getDaysForDayView;
    return (
      <div 
        ref={dayViewRef}
        className="flex-1 overflow-y-auto bg-gray-50 scroll-smooth pb-10"
      >
        <div className="max-w-3xl mx-auto pt-6 px-4 space-y-4">
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
              className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${isToday ? 'ring-2 ring-blue-500/10' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.01 }}
            >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 ${isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                      <span className="text-xl font-bold">{date.getDate()}</span>
                      <span className="text-[10px] font-medium uppercase">{dayOfWeek}</span>
                    </div>
                    <div>
                      {isToday && <div className="text-xs font-bold text-blue-600">오늘</div>}
                    </div>
                  </div>
                  <motion.button
                    onClick={() => openEventModal(date)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-blue-600 origin-center"
                    whileHover={{ 
                      rotate: 90, 
                      transition: { type: "spring", stiffness: 300, damping: 10 } 
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="w-5 h-5" />
                  </motion.button>
                </div>
                
                {sortedEvents.length > 0 ? (
                  <div className="space-y-2">
                    {sortedEvents.map((event) => {
                      const tag = getTagById(event.tagId);
                      return (
                        <div
                          key={event.id}
                          className={`group flex items-center gap-3 p-3 rounded-xl border border-transparent transition-all hover:border-gray-100 hover:shadow-sm hover:bg-white
                            ${event.completed ? 'bg-gray-50/50 opacity-60' : 'bg-gray-50'}`}
                          onClick={(e) => {
                              e.stopPropagation();
                              toggleEventCompletion(dateKey, event.id);
                          }}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${event.completed ? 'bg-gray-400 border-gray-400' : 'bg-white border-gray-300'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEventCompletion(dateKey, event.id);
                            }}
                          >
                            {event.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                            <div className={`font-medium text-gray-800 truncate ${event.completed ? 'line-through text-gray-400' : ''}`}>
                              {event.title}
                            </div>
                            <div className="flex-shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-block" 
                                style={{ backgroundColor: `${tag?.color}15`, color: tag?.color }}>
                                {tag?.name}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(dateKey, event.id);
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-300 text-sm">일정이 없습니다</div>
                )}
            </motion.div>
          );
        })}
        </div>
      </div>
    );
  };
  
  useEffect(() => {
    const isTodayInThisMonth = (date) => {
      const today = new Date();
      return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    };

    if (viewMode === 'day' && dayViewRef.current) {
      if (!isTodayInThisMonth(currentDate)) {
        setTimeout(() => {
          if (dayViewRef.current) dayViewRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }, 450);
      }
    }
  }, [viewMode]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
              {currentDate.getFullYear()}년 <span className="text-blue-600">{monthNames[currentDate.getMonth()]}</span>
            </h1>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => navigateMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigateMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              오늘
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
             <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>월간</span>
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>일간</span>
              </button>
             </div>

             <div className="w-px h-6 bg-gray-200 mx-2" />

            <div className="flex gap-1">
              <button onClick={exportData} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors" title="내보내기">
                <Download className="w-4 h-4" />
              </button>
              <label className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors cursor-pointer" title="불러오기">
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={() => setShowTagModal(true)} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors" title="태그 관리">
                <Tag className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {user ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 rounded-lg transition-all flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>로그인</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {viewMode === 'month' ? (
            <motion.div
              key="month-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full"
            >
              <div className="grid grid-cols-7 mb-3">
                {dayNames.map((day, i) => (
                  <div key={day} className={`text-center text-xs font-semibold uppercase tracking-wide ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-7 grid-rows-6">
                {renderCalendar()}
              </div>
            </motion.div>
          ) : renderDayView()}
        </AnimatePresence>
      </div>

      {/* --- Modals --- */}
      
      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div 
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEventModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedDate && `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`}
                </h2>
                <motion.button
                  onClick={() => setShowEventModal(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                  whileHover={{ 
                    rotate: 90, 
                    transition: { type: "spring", stiffness: 300, damping: 12, bounce: 0.6 } 
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="space-y-5">
                  <input
                    type="text"
                    placeholder="새로운 할 일을 입력하세요"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-0 py-2 text-lg border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent placeholder-gray-300 transition-colors"
                    autoFocus
                  />
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">태그 선택</label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => setSelectedTagId(tag.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                            selectedTagId === tag.id 
                              ? 'ring-2 ring-offset-1' 
                              : 'border-transparent hover:bg-gray-100'
                          }`}
                          style={{ 
                            backgroundColor: selectedTagId === tag.id ? tag.color : `${tag.color}15`,
                            color: selectedTagId === tag.id ? 'white' : tag.color,
                            borderColor: selectedTagId === tag.id ? 'transparent' : 'transparent',
                            outlineColor: tag.color
                          }}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={addEvent}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98]"
                  >
                    일정 추가하기
                  </button>
                </div>
                
                {selectedDate && events[getDateKey(selectedDate)] && events[getDateKey(selectedDate)].length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">현재 목록</h3>
                    <div className="space-y-2">
                      {events[getDateKey(selectedDate)].map(event => {
                        const tag = getTagById(event.tagId);
                        return (
                          <div
                            key={event.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-gray-100 transition-all
                              ${event.completed ? 'bg-gray-50 opacity-60' : 'bg-white border-gray-50'}`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${event.completed ? 'bg-gray-400 border-gray-400' : 'bg-white border-gray-300'}`}
                              onClick={() => toggleEventCompletion(getDateKey(selectedDate), event.id)}
                            >
                              {event.completed && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <div className={`flex-1 text-sm font-medium text-gray-800 ${event.completed ? 'line-through text-gray-400' : ''}`}>
                              {event.title}
                            </div>
                            <button
                              onClick={() => deleteEvent(getDateKey(selectedDate), event.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Manager Modal */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div 
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => setShowTagModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">태그 관리</h2>
                <motion.button 
                  onClick={() => setShowTagModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
                  whileHover={{ 
                    rotate: 90, 
                    transition: { type: "spring", stiffness: 300, damping: 12, bounce: 0.6 } 
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                  <input
                    type="text"
                    placeholder="새 태그 이름"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full cursor-pointer shadow-sm ring-2 ring-white" 
                        style={{ backgroundColor: newTagColor }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      />
                      <span className="text-xs text-gray-500">색상 변경</span>
                    </div>
                    <button
                      onClick={addTag}
                      className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
                    >
                      추가
                    </button>
                  </div>
                  
                  {showColorPicker && (
                    <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-lg grid grid-cols-5 gap-2">
                      {colorOptions.map(color => (
                        <div
                          key={color}
                          className="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => selectColor(color)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                      </div>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => setShowAuthModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-sm p-8" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <div className="text-center mb-8 flex flex-col items-center">
                <div className="w-full flex justify-end -mt-4 -mr-4">
                   <motion.button 
                    onClick={() => setShowAuthModal(false)} 
                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400"
                    whileHover={{ 
                      rotate: 90, 
                      transition: { type: "spring", stiffness: 300, damping: 12, bounce: 0.6 } 
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {authMode === 'login' ? '반가워요!' : '계정 만들기'}
                </h2>
                <p className="text-sm text-gray-500">
                  {authMode === 'login' ? '플래너에 로그인하여 일정을 동기화하세요.' : '나만의 플래너를 시작해보세요.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">이메일</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">비밀번호</label>
                  <input
                    type="password"
                    placeholder="6자리 이상"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    required
                  />
                </div>
                
                {authError && (
                  <div className="text-red-500 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
                    {authError}
                  </div>
                )}

                <motion.label className="flex items-center gap-2 cursor-pointer py-1" whileTap={{ scale: 0.98 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">자동 로그인</span>
                </motion.label>

                <motion.button
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {authMode === 'login' ? '로그인' : '회원가입'}
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {authMode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyPlanner;
