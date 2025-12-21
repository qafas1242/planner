import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Tag, Download, Upload, Calendar, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const colorOptions = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#64748B', '#6B7280', '#78716C'
  ];

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

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    
    if (viewMode === 'day') {
      setTimeout(() => {
        const todayKey = getDateKey(today);
        const todayElement = document.getElementById(todayKey);
        if (todayElement) {
          todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
        delay: 0.15, 
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
      completed: false, // <-- completed 필드 추가
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

  // 할 일 완료 상태 토글 함수
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

  const getDaysForDayView = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

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

  // 캘린더 셀 애니메이션 variants
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
      
      // 완료된 항목을 뒤로 정렬
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
    const days = getDaysForDayView();
    
    return (
      <motion.div 
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
          
          // 완료된 항목을 뒤로 정렬
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
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer overflow-hidden ${event.completed ? 'opacity-60' : 'hover:shadow-md'}`}
                            style={{ backgroundColor: `${tag?.color}10` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // openEventModal(date); // 클릭 시 모달 열기 대신 완료 토글
                              toggleEventCompletion(dateKey, event.id);
                            }}
                            variants={taskItemVariants}
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
                              className="flex-1"
                              variants={taskTitleVariants}
                            >
                              <div className={`font-medium text-gray-900 ${event.completed ? 'line-through' : ''}`}>{event.title}</div>
                              <div className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}>
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

  useEffect(() => {
    if (viewMode === 'day') {
      setTimeout(() => {
        const todayKey = getDateKey(new Date());
        const todayElement = document.getElementById(todayKey);
        if (todayElement) {
          todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const firstDayKey = getDateKey(getDaysForDayView()[0]);
          document.getElementById(firstDayKey)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [viewMode, currentDate]);

  return (
    <div className="h-screen bg-white flex flex-col" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* 메뉴를 감싸는 Fixed Wrapper */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            {/* 헤더 */}
            <motion.div 
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div className="flex items-center gap-4" variants={headerItemVariants}>
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {`${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
                </h1>
                <div className="flex gap-1">
                  <motion.button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.15, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </motion.button>
                  <motion.button
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
                  onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
                  className={`px-3 md:px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                    viewMode === 'day' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {viewMode === 'month' ? <List className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                  <span className="hidden sm:inline">{viewMode === 'month' ? '일간' : '월간'}</span>
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

            {/* 태그 표시 */}
            <motion.div 
              className="flex flex-wrap gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {tags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                  whileHover={{ 
                    scale: 1.1, 
                    y: -3,
                    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag.name}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* 컨텐츠 영역 - Fixed 헤더 높이만큼 패딩 추가 */}
        <div className="flex-1 flex flex-col" style={{ paddingTop: '180px' }}>
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
                              : 'hover:opacity-80'
                          }`}
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

                {/* 해당 날짜의 할 일 목록 */}
                {selectedDate && events[getDateKey(selectedDate)]?.length > 0 && (
                  <motion.div 
                    className="mb-4 space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">할 일 목록</h3>
                    <AnimatePresence>
                      {events[getDateKey(selectedDate)].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1)).map(event => {
                        const tag = getTagById(event.tagId);
                        return (
                          <motion.div 
                            key={event.id} 
                            className={`flex items-center justify-between p-3 rounded-lg ${event.completed ? 'opacity-60' : ''}`} 
                            style={{ backgroundColor: `${tag?.color}10` }}
                            variants={taskItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            layout
                          >
                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                              <AnimatedCheckbox 
                                isChecked={event.completed} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEventCompletion(getDateKey(selectedDate), event.id);
                                }}
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
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            />
                          )}
                        </motion.button>
                      ))}
                      <motion.button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`w-10 h-10 rounded-lg transition-all flex items-center justify-center text-white text-lg font-bold ${
                          showColorPicker ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'
                        }}
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

                {/* 기존 태그 목록 */}
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
      </div>
    </div>
  );
};

export default MonthlyPlanner;
