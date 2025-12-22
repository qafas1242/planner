import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Tag, Download, Upload, Calendar, List, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { DndContext, useDraggable, useDroppable, closestCenter } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';

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
            duration: 0.2, 
            delay: 0.1 // 배경 채우기 후 시작
          }}
        />
      </motion.svg>
    </motion.div>
  );
};

// Draggable Event Component
const DraggableEvent = ({ event, tag, dateKey, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: {
      event: event,
      dateKey: dateKey,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(0, 0, 0, 0.2)' : 'none',
    cursor: 'grab',
  } : { cursor: 'grab' };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate ${event.completed ? 'line-through opacity-60' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
};

// Droppable Date Cell Component
const DroppableDateCell = ({ dateKey, children, className = "" }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: dateKey,
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`${className} ${isOver ? 'ring-4 ring-offset-2 ring-blue-400/50 transition-all duration-200' : ''}`}
    >
      {children}
    </div>
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
  // 'month', 'week', 'day'
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
  
  // 2. 일정 검색 및 필터링을 위한 상태 추가
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState(null); // null: 전체, tagId: 특정 태그
  const [showSearchInput, setShowSearchInput] = useState(false);

  // --- 데이터 저장/로드 기능 추가 (localStorage) ---
  // 1. 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    const savedData = localStorage.getItem('monthlyPlannerData');
    if (savedData) {
      try {
        const { events: savedEvents, tags: savedTags } = JSON.parse(savedData);
        setEvents(savedEvents || {});
        // 로드된 태그를 기존 태그와 병합 (기존 태그가 기본값으로 남아있도록)
        setTags(prevTags => {
          const loadedTagsMap = new Map((savedTags || []).map(t => [t.id, t]));
          // 기본 태그를 유지하고, 로드된 태그로 덮어쓰거나 추가
          const mergedTags = prevTags.map(t => loadedTagsMap.get(t.id) || t);
          savedTags.forEach(t => {
            if (!prevTags.some(pt => pt.id === t.id)) {
              mergedTags.push(t);
            }
          });
          return mergedTags;
        });
      } catch (e) {
        console.error("Failed to parse saved data from localStorage", e);
      }
    }
  }, []);

  // 2. events 또는 tags 상태 변경 시 데이터 저장
  useEffect(() => {
    const dataToSave = { events, tags };
    localStorage.setItem('monthlyPlannerData', JSON.stringify(dataToSave));
  }, [events, tags]);
  // --- 데이터 저장/로드 기능 추가 끝 ---


  // 스크롤을 위한 Ref 추가

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

  // 주간 보기 이동 함수
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
      // goToToday는 이미 일간 보기일 때만 호출되므로, 뷰 전환 애니메이션을 기다릴 필요 없이 바로 스크롤 시도
      setTimeout(() => scrollToDate(today), 50);
    } else if (viewMode === 'week') {
      // 주간 보기에서는 해당 주가 보이도록 스크롤 (구현 생략, 현재 주간 보기 로직은 현재 날짜를 기준으로 주를 표시)
    } else {
      // 월간 보기에서는 해당 월의 1일로 이동
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  };

  // 주간 보기에서 날짜 클릭 시 일간 보기로 전환하는 함수 (사용자 요청으로 기능 제거)
  const switchToDayView = (date) => {
    // 기능 제거
    // setCurrentDate(date);
    // setViewMode('day');
    // setTimeout(() => scrollToDate(date), 450); 
  };

  // 할 일 추가 시 애니메이션을 위한 variants (페이드 인/아웃으로 단순화)
  const taskItemVariants = {
    hidden: { 
      opacity: 0, 
      height: 0, 
      paddingTop: 0, 
      paddingBottom: 0,
      transition: { duration: 0.2 }
    },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      paddingTop: '0.5rem', 
      paddingBottom: '0.5rem',
      transition: { 
        duration: 0.3,
        when: "beforeChildren"
      }
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      paddingTop: 0, 
      paddingBottom: 0,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  // 할 일 제목 Fade In 애니메이션 variants (단순화)
  const taskTitleVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        delay: 0.1,
        duration: 0.3,
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

  // 주간 보기를 위한 7일 배열 계산
  const getDaysForWeekView = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - startOfWeek.getDay()); // 일요일로 설정
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  // 1. 드래그 앤 드롭 핸들러
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return;

    const draggedEventId = active.id;
    const sourceDateKey = active.data.current.dateKey;
    const targetDateKey = over.id;

    if (sourceDateKey === targetDateKey) return; // 같은 날짜로 이동은 무시

    setEvents(prevEvents => {
      const eventToMove = prevEvents[sourceDateKey].find(e => e.id === draggedEventId);
      if (!eventToMove) return prevEvents;

      // 1. 원본 날짜에서 이벤트 제거
      const newSourceEvents = prevEvents[sourceDateKey].filter(e => e.id !== draggedEventId);
      
      // 2. 대상 날짜에 이벤트 추가
      const newTargetEvents = [...(prevEvents[targetDateKey] || []), eventToMove];

      return {
        ...prevEvents,
        [sourceDateKey]: newSourceEvents,
        [targetDateKey]: newTargetEvents,
      };
    });
  };ver.id;
    const sourceDateKey = active.data.current.dateKey;

    // 드롭 대상이 날짜 키가 아니거나, 같은 날짜에 드롭한 경우
    if (typeof destinationDateKey !== 'string' || !destinationDateKey.includes('-') || sourceDateKey === destinationDateKey) {
      return;
    }

    setEvents(prevEvents => {
      const newEvents = { ...prevEvents };

      // 1. Find the dragged event and remove it from the source date
      const sourceEvents = newEvents[sourceDateKey] || [];
      const draggedEvent = sourceEvents.find(e => e.id === draggedEventId);

      if (!draggedEvent) return prevEvents; // Should not happen

      newEvents[sourceDateKey] = sourceEvents.filter(e => e.id !== draggedEventId);

      // 2. Add the event to the destination date
      newEvents[destinationDateKey] = [
        ...(newEvents[destinationDateKey] || []),
        draggedEvent
      ];

      // 3. Clean up empty source date array
      if (newEvents[sourceDateKey].length === 0) {
        delete newEvents[sourceDateKey];
      }

      return newEvents;
    });
  };

  // 2. 필터링된 이벤트 목록을 계산하는 useMemo
  const filteredEvents = useMemo(() => {
    const allEvents = {};
    
    for (const dateKey in events) {
      let dayEvents = events[dateKey];
      
      // 1. 태그 필터링
      if (activeTagFilter !== null) {
        dayEvents = dayEvents.filter(event => event.tagId === activeTagFilter);
      }
      
      // 2. 검색어 필터링
      if (searchQuery.trim() !== '') {
        const lowerCaseQuery = searchQuery.toLowerCase();
        dayEvents = dayEvents.filter(event => 
          event.title.toLowerCase().includes(lowerCaseQuery)
        );
      }
      
      if (dayEvents.length > 0) {
        allEvents[dateKey] = dayEvents;
      }
    }
    
    return allEvents;
  }, [events, searchQuery, activeTagFilter]);

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
      // 필터링된 이벤트를 사용
      const dayEvents = filteredEvents[dateKey] || []; 
      const isToday = new Date().toDateString() === date.toDateString();
      
      const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

      days.push(
        <DroppableDateCell 
          key={day} 
          dateKey={dateKey} 
          className="border border-gray-100 bg-white cursor-pointer p-1.5 sm:p-2 relative group flex flex-col"
        >
          <motion.div
            onClick={() => openEventModal(date)}
            variants={calendarCellVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.3, delay: (day + startingDayOfWeek) * 0.015 }}
            className="flex flex-col h-full"
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
	                onClick={(e) => { e.stopPropagation(); openEventModal(date); }}
	              >
	                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
	              </motion.div>
	            </div>
	            <div className="space-y-0.5 sm:space-y-1 overflow-y-auto flex-1">
	              <AnimatePresence>
	                {sortedEvents.map((event, index) => {
                  const tag = getTagById(event.tagId);
                  return (
                    <DraggableEvent 
                      key={event.id} 
                      event={event} 
                      tag={tag} 
                      dateKey={dateKey}
                 	                      <motion.div
	                        className="flex items-center justify-between"
	                        style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
	                        variants={calendarEventVariants}
	                        initial="hidden"
	                        animate="visible"
	                        exit={{ scaleX: 0, opacity: 0, transition: { duration: 0.3 } }}
	                      >
	                        <span className={`truncate ${event.completed ? 'line-through opacity-60' : ''}`}>{event.title}</span>
	                        <motion.div
	                          className="flex-shrink-0 ml-1"
	                          whileHover={{ scale: 1.1 }}
	                          whileTap={{ scale: 0.9 }}
	                          onClick={(e) => {
	                            e.stopPropagation();
	                            toggleEventCompletion(dateKey, event.id);
	                          }}
	                        >
	                          <AnimatedCheckbox 
	                            isChecked={event.completed} 
	                            color={tag?.color} 
	                            onClick={(e) => {
	                              e.stopPropagation();
	                              toggleEventCompletion(dateKey, event.id);
	                            }}
	                          />
	                        </motion.div>
	                      </motion.div>                      </motion.div>
                    </DraggableEvent>
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
        </DroppableDateCell>
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
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0 mb-2 px-4 md:px-6">
          {days.map((date, i) => {
            const dayOfWeek = dayNames[date.getDay()];
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <motion.div 
                key={i} 
                className={`text-center py-2 text-sm font-semibold cursor-pointer transition-colors rounded-lg ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}
              onClick={() => { /* 주간 모드에서 날짜 클릭 시 일간 모드 전환 기능 제거 */ }}/ 클릭 이벤트 추가
                whileHover={{ scale: 1.05, backgroundColor: '#f3f4f6' }}
              >
                <span className={`block ${isToday ? 'text-blue-600' : ''}`}>{dayOfWeek}</span>
                <span className={`block text-xs ${isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 mx-auto flex items-center justify-center mt-1' : 'text-gray-500'}`}>{date.getDate()}</span>
              </motion.div>
            );
          })}
        </div>
        
        {/* 주간 일정 영역 */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto border-t border-gray-200">
          {days.map((date, i) => {
            const dateKey = getDateKey(date);
            // 필터링된 이벤트를 사용
            const dayEvents = filteredEvents[dateKey] || []; 
            const isToday = new Date().toDateString() === date.toDateString();
            
            const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

            return (
              <DroppableDateCell 
                key={i} 
                dateKey={dateKey} 
                className={`border-r border-gray-100 bg-white cursor-pointer p-1.5 sm:p-2 relative group flex flex-col ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                <motion.div
                  onClick={() => openEventModal(date)}
                  variants={calendarCellVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex flex-col h-full"
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
	                  <div className="space-y-0.5 sm:space-y-1 overflow-y-auto flex-1">
	                    <AnimatePresence>
	                      {sortedEvents.map((event, index) => {
                        const tag = getTagById(event.tagId);
                        return (
                          <DraggableEvent 
                            key={event.id} 
                            event={event} 
                            tag={tag} 
                            dateKey={dateKey}
                          >
	                            <motion.div
	                              className="flex items-center justify-between"
	                              style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
	                              variants={calendarEventVariants}
	                              initial="hidden"
	                              animate="visible"
	                              exit={{ scaleX: 0, opacity: 0, transition: { duration: 0.3 } }}
	                              custom={index}
	                            >
	                              <span className={`truncate ${event.completed ? 'line-through opacity-60' : ''}`}>{event.title}</span>
	                              <motion.div
	                                className="flex-shrink-0 ml-1"
	                                whileHover={{ scale: 1.1 }}
	                                whileTap={{ scale: 0.9 }}
	                                onClick={(e) => {
	                                  e.stopPropagation();
	                                  toggleEventCompletion(dateKey, event.id);
	                                }}
	                              >
	                                <AnimatedCheckbox 
	                                  isChecked={event.completed} 
	                                  color={tag?.color} 
	                                  onClick={(e) => {
	                                    e.stopPropagation();
	                                    toggleEventCompletion(dateKey, event.id);
	                                  }}
	                                />
	                              </motion.div>
	                            </motion.div>
                          </DraggableEvent>
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
              </DroppableDateCell>
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
        ref={dayViewRef} // Ref를 스크롤 컨테이너에 연결
        className="flex-1 overflow-y-auto"
        initial={{ opacity: 0, x: viewMode === 'month' ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: viewMode === 'month' ? -50 : 50 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 25 }}
      >
        {days.map((date, index) => {
          const dateKey = getDateKey(date);
          // 필터링된 이벤트를 사용
          const dayEvents = filteredEvents[dateKey] || []; 
          const isToday = new Date().toDateString() === date.toDateString();
          const dayOfWeek = dayNames[date.getDay()];
          
          const sortedEvents = dayEvents.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

          return (
            <DroppableDateCell 
              key={index} 
              dateKey={dateKey} 
              className={`border-b border-gray-200 p-4 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
            >
              <motion.div
                id={getDateKey(date)}
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
                            <DraggableEvent 
                              key={event.id} 
                              event={event} 
                              tag={tag} 
                              dateKey={dateKey}
                            >
                              <motion.div
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
                            </DraggableEvent>
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
                      이 날짜에는 일정이 없습니다.
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </DroppableDateCell>
          );
        })}
      </motion.div>
    );
  };

  const renderView = () => {
    switch (viewMode) {
      case 'month':
        return (
          <motion.div 
            key="month-view"
            className="grid grid-cols-7 flex-1 overflow-y-auto border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderCalendar()}
          </motion.div>
        );
      case 'week':
        return (
          <motion.div 
            key="week-view" 
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderWeekView()}
          </motion.div>
        );
      case 'day':
        return (
          <motion.div 
            key="day-view" 
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderDayView()}
          </motion.div>
        );
      default:
        return null;
    }
  };

  // 태그 필터링 버튼 렌더링
  const renderTagFilters = () => (
    <div className="flex space-x-2 overflow-x-auto pb-1">
      <motion.button
        onClick={() => setActiveTagFilter(null)}
        className={`px-3 py-1 text-sm rounded-full transition-all duration-200 ${activeTagFilter === null ? 'bg-gray-800 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        전체
      </motion.button>
      {tags.map(tag => (
        <motion.button
          key={tag.id}
          onClick={() => setActiveTagFilter(tag.id)}
          className={`px-3 py-1 text-sm rounded-full transition-all duration-200 ${activeTagFilter === tag.id ? 'text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
          style={{ 
            backgroundColor: activeTagFilter === tag.id ? tag.color : undefined,
            color: activeTagFilter === tag.id ? 'white' : tag.color,
            borderColor: tag.color,
            borderWidth: activeTagFilter === tag.id ? '0px' : '1px',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {tag.name}
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 sm:p-8">
      <div className="max-w-7xl w-full mx-auto bg-white rounded-xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white p-4 sm:p-6 border-b border-gray-200 flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <motion.h1 
              className="text-3xl sm:text-4xl font-extrabold text-gray-900"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
            >
              {viewMode === 'month' && `${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
              {viewMode === 'week' && `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 주`}
              {viewMode === 'day' && `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
            </motion.h1>

            <div className="flex items-center space-x-3">
              {/* 검색 아이콘 및 입력 필드 */}
              <motion.div
                className="relative"
                initial={false}
                animate={showSearchInput ? "visible" : "hidden"}
              >
                <motion.button
                  onClick={() => setShowSearchInput(prev => !prev)}
                  className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Search className="w-6 h-6" />
                </motion.button>
                <AnimatePresence>
                  {showSearchInput && (
                    <motion.input
                      type="text"
                      placeholder="일정 제목 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="absolute right-0 top-full mt-2 p-2 border border-gray-300 rounded-lg shadow-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 네비게이션 버튼 */}
              <motion.button
                onClick={() => viewMode === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
              <motion.button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium rounded-full text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                오늘
              </motion.button>
              <motion.button
                onClick={() => viewMode === 'month' ? navigateMonth(1) : navigateWeek(1)}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex space-x-2">
            <motion.button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${viewMode === 'month' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar className="w-4 h-4 inline-block mr-1" /> 월간
            </motion.button>
            <motion.button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${viewMode === 'week' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <List className="w-4 h-4 inline-block mr-1" /> 주간
            </motion.button>
            <motion.button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${viewMode === 'day' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <List className="w-4 h-4 inline-block mr-1" /> 일간
            </motion.button>
            <motion.button
              onClick={() => setShowTagModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Tag className="w-4 h-4 inline-block mr-1" /> 태그 관리
            </motion.button>
            <motion.button
              onClick={exportData}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Download className="w-6 h-6" />
            </motion.button>
            <motion.label
              htmlFor="import-file"
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Upload className="w-6 h-6" />
              <input 
                id="import-file" 
                type="file" 
                accept=".json" 
                onChange={importData} 
                className="hidden" 
              />
            </motion.label>
          </div>

          {/* 태그 필터링 영역 */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            {renderTagFilters()}
          </motion.div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <DndContext 
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
          >
            <AnimatePresence mode="wait">
              {renderView()}
            </AnimatePresence>
          </DndContext>
        </div>

      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                {selectedDate ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 일정 추가` : '일정 추가'}
              </h2>
              
              <input
                type="text"
                placeholder="일정 제목"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
              
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2 text-gray-700">태그 선택</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <motion.button
                      key={tag.id}
                      onClick={() => setSelectedTagId(tag.id)}
                      className={`px-3 py-1 text-sm rounded-full transition-all duration-200 border-2 ${selectedTagId === tag.id ? 'ring-2 ring-offset-2' : 'hover:opacity-80'}`}
                      style={{ 
                        backgroundColor: tag.color, 
                        color: 'white',
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
              
              <motion.button
                onClick={addEvent}
                disabled={!eventTitle.trim() || !selectedTagId}
                className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${(!eventTitle.trim() || !selectedTagId) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 shadow-md'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                일정 추가
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tag Modal */}
      <AnimatePresence>
        {showTagModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={backdropVariants}
            onClick={() => setShowTagModal(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">태그 관리</h2>
              
              {/* 기존 태그 목록 */}
              <div className="mb-6 border-b border-gray-200 pb-4 max-h-48 overflow-y-auto">
                <h3 className="text-lg font-medium mb-3 text-gray-700">현재 태그</h3>
                <div className="space-y-2">
                  {tags.map(tag => (
                    <motion.div
                      key={tag.id}
                      className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                        <span className="font-medium text-gray-800">{tag.name}</span>
                      </div>
                      <motion.button
                        onClick={() => deleteTag(tag.id)}
                        className="p-1 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* 새 태그 추가 */}
              <h3 className="text-lg font-medium mb-3 text-gray-700">새 태그 추가</h3>
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  placeholder="태그 이름"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
                <motion.button
                  onClick={() => setShowColorPicker(prev => !prev)}
                  className="p-3 rounded-lg text-white font-semibold transition-colors shadow-md flex items-center justify-center"
                  style={{ backgroundColor: newTagColor }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  색상 선택
                </motion.button>
              </div>
              
              {/* 색상 선택기 */}
              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4 className="text-sm font-medium mb-2 text-gray-600">기본 색상</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {colorOptions.map(color => (
                        <motion.button
                          key={color}
                          onClick={() => selectColor(color)}
                          className={`w-8 h-8 rounded-full transition-all duration-150 ${newTagColor === color ? 'ring-4 ring-offset-2' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color, ringColor: color }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      ))}
                    </div>
                    
                    <h4 className="text-sm font-medium mb-2 text-gray-600">직접 입력</h4>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-10 h-10 p-0 border-none rounded-lg overflow-hidden cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <motion.button
                        onClick={selectCustomColor}
                        className="px-4 py-2 text-sm rounded-lg text-white bg-gray-500 hover:bg-gray-600 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        적용
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                onClick={addTag}
                disabled={!newTagName.trim()}
                className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${!newTagName.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 shadow-md'}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                태그 추가
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MonthlyPlanner;
