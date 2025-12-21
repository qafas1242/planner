import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Tag, Download, Upload, Calendar, List } from 'lucide-react';

const MonthlyPlanner = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [tags, setTags] = useState([
    { id: 1, name: '업무', color: '#3B82F6' },
    { id: 2, name: '개인', color: '#10B981' },
    { id: 3, name: '운동', color: '#F59E0B' },
    { id: 4, name: '공부', color: '#8B5CF6' }
  ]);
	  const [viewMode, setViewMode] = useState('day'); // 'month' or 'day' - 일간 보기(월별 리스트)를 기본으로 설정
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

  // 일간 보기(월별 리스트)에서는 월별로 이동하도록 navigateMonth 재사용

  const getDateKey = (date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const addEvent = () => {
    if (!eventTitle.trim() || !selectedTagId) return;
    
    const dateKey = getDateKey(selectedDate);
    const newEvent = {
      id: Date.now(),
      title: eventTitle,
      tagId: selectedTagId
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

  // 일간 보기(월별 리스트)를 위한 해당 월의 모든 날짜를 가져오는 함수
  const getDaysForDayView = () => {
    const days = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날짜
    
    for (let day = 1; day <= lastDay; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
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
      
      days.push(
        <div
          key={day}
          className="border border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer p-1.5 sm:p-2 relative group flex flex-col"
          onClick={() => openEventModal(date)}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs sm:text-sm font-medium ${isToday ? 'bg-blue-500 text-white w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs' : 'text-gray-700'}`}>
              {day}
            </span>
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="space-y-0.5 sm:space-y-1 overflow-hidden flex-1">
            {dayEvents.slice(0, 2).map(event => {
              const tag = getTagById(event.tagId);
              return (
                <div
                  key={event.id}
                  className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate"
                  style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {event.title}
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2}</div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const renderDayView = () => {
    const days = getDaysForDayView();
	    // 현재 월의 1일로 스크롤하기 위해 첫 번째 날짜를 기준으로 설정
	    const firstDayKey = getDateKey(days[0]);
    
    return (
      <div className="flex-1 overflow-y-auto">
        {days.map((date, index) => {
          const dateKey = getDateKey(date);
          const dayEvents = events[dateKey] || [];
          const isToday = new Date().toDateString() === date.toDateString();
          const dayOfWeek = dayNames[date.getDay()];
          
          return (
            <div
              key={index}
	              id={getDateKey(date)} // 모든 날짜에 고유 ID 부여 (스크롤 대상)
              className={`border-b border-gray-200 p-4 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                        {dayOfWeek}
                      </div>
                      <div className="text-xs text-gray-500">
                        {date.getFullYear()}년 {date.getMonth() + 1}월
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openEventModal(date)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
                {dayEvents.length > 0 ? (
                  <div className="space-y-2">
                    {dayEvents.map(event => {
                      const tag = getTagById(event.tagId);
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                          style={{ backgroundColor: `${tag?.color}10` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEventModal(date);
                          }}
                        >
                          <div className="w-1 h-12 rounded-full" style={{ backgroundColor: tag?.color }} />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{event.title}</div>
                            <div className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}>
                              {tag?.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    일정이 없습니다
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  React.useEffect(() => {
	    if (viewMode === 'day') {
	      setTimeout(() => {
	        // 일간 보기(월별 리스트)에서는 1일로 스크롤
	        document.getElementById(firstDayKey)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	      }, 100);
	    }
  }, [viewMode]);

  return (
    <div className="h-screen bg-white p-4 md:p-6 flex flex-col" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        {/* 메뉴를 감싸는 Sticky Wrapper 추가 */}
        <div className="sticky top-0 z-10 bg-white pb-2">
          {/* 헤더 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
	                {/* 일간 보기(월별 리스트)에서는 월간 보기와 동일하게 표시 */}
	                {`${currentDate.getFullYear()}년 ${monthNames[currentDate.getMonth()]}`}
              </h1>
              <div className="flex gap-1">
                <button
	                  onClick={() => navigateMonth(-1)} // 일간 보기에서도 월별 이동
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
	                  onClick={() => navigateMonth(1)} // 일간 보기에서도 월별 이동
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'month' ? 'day' : 'month')}
                className={`px-3 md:px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'day' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {viewMode === 'month' ? <List className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                <span className="hidden sm:inline">{viewMode === 'month' ? '일간' : '월간'}</span>
              </button>
              <button
                onClick={exportData}
                className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">내보내기</span>
              </button>
              <label className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">불러오기</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowTagModal(true)}
                className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">태그 관리</span>
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 md:px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                오늘
              </button>
            </div>
          </div>

          {/* 태그 표시 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        </div>

        {/* 월간 보기 */}
        {viewMode === 'month' && (
          <>
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {dayNames.map((day, i) => (
                <div key={day} className={`text-center py-2 text-sm font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
              {renderCalendar()}
            </div>
          </>
        )}

        {/* 일간 보기 */}
        {viewMode === 'day' && renderDayView()}

        {/* 일정 추가 모달 */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-96 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedDate && `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`}
                </h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
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
                      <button
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
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 해당 날짜의 할 일 목록 */}
              {selectedDate && events[getDateKey(selectedDate)]?.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">할 일 목록</h3>
                  {events[getDateKey(selectedDate)].map(event => {
                    const tag = getTagById(event.tagId);
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${tag?.color}10` }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag?.color }} />
                          <span className="text-sm font-medium text-gray-900">{event.title}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${tag?.color}20`, color: tag?.color }}>
                            {tag?.name}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteEvent(getDateKey(selectedDate), event.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={addEvent}
                disabled={!eventTitle.trim() || !selectedTagId}
                className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                할 일 추가
              </button>
            </div>
          </div>
        )}

        {/* 태그 관리 모달 */}
        {showTagModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={() => setShowTagModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">태그 관리</h2>
                <button
                  onClick={() => setShowTagModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
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
                      <button
                        key={color}
                        onClick={() => selectColor(color)}
                        className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${
                          newTagColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${
                        showColorPicker ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'
                      }}
                      title="커스텀 색상"
                    />
                  </div>
                  
                  {showColorPicker && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
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
                        <button
                          onClick={selectCustomColor}
                          className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={addTag}
                  disabled={!newTagName.trim()}
                  className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  태그 추가
                </button>
              </div>

              {/* 기존 태그 목록 */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">기존 태그</h3>
                {tags.map(tag => (
                  <div key={tag.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${tag.color}10` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                    </div>
                    <button
                      onClick={() => deleteTag(tag.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyPlanner;
