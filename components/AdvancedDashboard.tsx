/**
 * 고도화된 대시보드 컴포넌트
 * 사이트의 주요 통계와 정보를 더 다양하고 자세하게 시각화하여 보여줍니다.
 */
import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler,
  RadialLinearScale,
  PolarAreaController,
  RadarController
} from 'chart.js';
import { Line, Bar, Doughnut, PolarArea, Radar } from 'react-chartjs-2';
import { 
  fetchPosts, 
  fetchUpdatedPostsByDateRange,
  fetchPostsByDateRange,
  fetchCategoriesFromFirestore
} from '../src/services/firebase/firestore';
import { UIPost } from '../src/types';

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PolarAreaController,
  RadarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * 고도화된 대시보드 속성
 */
interface AdvancedDashboardProps {
  /** 모달 창 열림 상태 */
  isOpen: boolean;
  /** 모달 닫기 이벤트 핸들러 */
  onClose: () => void;
}

/**
 * 날짜 범위 옵션 정의
 */
type DateRangeOption = '7days' | '30days' | '90days' | 'custom' | 'all';

/**
 * 차트 타입 옵션 정의
 */
type ChartType = 'line' | 'bar' | 'doughnut' | 'polar' | 'radar';

/**
 * 고도화된 대시보드 컴포넌트
 */
const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ isOpen, onClose }) => {
  const [posts, setPosts] = useState<UIPost[]>([]);
  const [updatedPosts, setUpdatedPosts] = useState<UIPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('line');

  // 카테고리 ID와 이름 매핑 상태 추가
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  const [stats, setStats] = useState({
    totalPosts: 0,
    periodNewPosts: 0,
    periodUpdatedPosts: 0,
    categoryDistribution: {} as Record<string, number>,
    tagDistribution: {} as Record<string, number>,
    postsByDay: [] as number[],
    updatedByDay: [] as number[],
    dateLabels: [] as string[],
    postLengthDistribution: {} as Record<string, number>,
    userActivity: {} as Record<string, number>,
    interactionRate: [] as number[], // 게시물 당 평균 댓글 수
    weekdayDistribution: Array(7).fill(0) as number[],
    hourDistribution: Array(24).fill(0) as number[],
  });
  
  // 애니메이션 효과를 위한 상태 변수
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열리면 애니메이션을 위해 약간의 지연 후 내용 표시
      setTimeout(() => {
        setIsVisible(true);
      }, 100);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  /**
   * 날짜 범위에 따른 시작일과 종료일 계산
   */
  const getDateRange = (): { startDate: Date, endDate: Date, days: number } => {
    const endDate = new Date();
    let startDate: Date;
    let days: number;

    switch (dateRange) {
      case '7days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // 오늘 포함 7일
        days = 7;
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 29); // 오늘 포함 30일
        days = 30;
        break;
      case '90days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 89); // 오늘 포함 90일
        days = 90;
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        // endDate는 이미 정의되어 있음
        const timeDiff = endDate.getTime() - startDate.getTime();
        days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // 종료일 포함
        break;
      case 'all':
        // 전체 기간인 경우 2000년 1월 1일부터 현재까지로 설정
        startDate = new Date(2000, 0, 1);
        const allDaysTimeDiff = endDate.getTime() - startDate.getTime();
        days = Math.floor(allDaysTimeDiff / (1000 * 60 * 60 * 24)) + 1;
        break;
      default:
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 29);
        days = 30;
    }

    // 시간 정보 초기화
    startDate.setHours(0, 0, 0, 0);
    
    // 종료일은 해당 일의 끝으로 설정
    const actualEndDate = new Date(endDate);
    actualEndDate.setHours(23, 59, 59, 999);

    return { startDate, endDate: actualEndDate, days };
  };

  // 카테고리 정보 로드
  const loadCategories = async () => {
    try {
      const categories = await fetchCategoriesFromFirestore();
      const categoryMapping: Record<string, string> = {};
      
      categories.forEach(category => {
        categoryMapping[category.id] = category.name;
      });
      
      setCategoryMap(categoryMapping);
    } catch (err) {
      console.error('카테고리 정보 로드 오류:', err);
      // 오류가 발생해도 기본 로직을 중단하지 않음
    }
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 카테고리 정보 로드
      await loadCategories();
      
      // 날짜 범위 계산
      const { startDate, endDate, days } = getDateRange();
      
      // 모든 게시물 조회 (전체 통계용)
      const allPostsData = await fetchPosts();

      // 선택한 기간 내의 신규 게시물 조회
      const periodPostsData = await fetchPostsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // 선택한 기간 내의 업데이트된 게시물 조회
      const updatedPostsData = await fetchUpdatedPostsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      setPosts(periodPostsData);
      setUpdatedPosts(updatedPostsData);
      
      // 통계 계산
      calculateAdvancedStats(allPostsData, periodPostsData, updatedPostsData, startDate, endDate, days);
      
      setIsLoading(false);
    } catch (err) {
      console.error('고급 대시보드 데이터 로드 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 날짜 범위 변경시 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, dateRange, customStartDate, customEndDate]);

  /**
   * 고급 통계 데이터 계산
   */
  const calculateAdvancedStats = (
    allPostsData: UIPost[],
    periodPostsData: UIPost[],
    updatedPostsData: UIPost[],
    startDate: Date,
    endDate: Date,
    days: number
  ) => {
    // 전체 게시물 수
    const totalPosts = allPostsData.length;
    
    // 선택한 기간 내의 신규 게시물 수
    const periodNewPosts = periodPostsData.length;
    
    // 선택한 기간 내의 업데이트된 게시물 수
    const periodUpdatedPosts = updatedPostsData.length;
    
    // 카테고리별 분포
    const categoryDistribution = allPostsData.reduce((acc, post) => {
      const category = post.category || '미분류';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 태그별 분포 (태그가 있는 경우)
    const tagDistribution = allPostsData.reduce((acc, post) => {
      const tags = post.tags || [];
      tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    // 선택한 기간 내의 일별 게시물 수 (최대 90일)
    const postsByDay: number[] = Array(days).fill(0);
    const updatedByDay: number[] = Array(days).fill(0);
    const dateLabels: string[] = [];
    
    // 날짜 레이블 생성
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // 포맷에 따라 날짜 레이블 생성
      const dateFormat = days <= 14 
        ? { month: '2-digit', day: '2-digit' } as const
        : { month: '2-digit', day: '2-digit' } as const;
        
      dateLabels.push(date.toLocaleDateString('ko-KR', dateFormat));
    }
    
    // 일별 데이터 계산
    periodPostsData.forEach(post => {
      const postDate = new Date(post.date);
      const daysDiff = Math.floor((postDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < days) {
        postsByDay[daysDiff]++;
      }

      // 게시물 길이에 따른 분포
      const contentLength = post.content?.length || 0;
      let lengthCategory;
      if (contentLength < 200) lengthCategory = '짧은 글 (200자 미만)';
      else if (contentLength < 1000) lengthCategory = '중간 글 (200-1000자)';
      else lengthCategory = '긴 글 (1000자 이상)';
      
      // 요일별 분포 계산
      const weekday = postDate.getDay(); // 0: 일요일, 1: 월요일, ...
      stats.weekdayDistribution[weekday]++;
      
      // 시간대별 분포 계산
      const hour = postDate.getHours();
      stats.hourDistribution[hour]++;
    });
    
    updatedPostsData.forEach(post => {
      const postDate = new Date(post.date);
      const daysDiff = Math.floor((postDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < days) {
        updatedByDay[daysDiff]++;
      }
    });
    
    // 게시물 길이 분포
    const postLengthDistribution = allPostsData.reduce((acc, post) => {
      const contentLength = post.content?.length || 0;
      let lengthCategory;
      if (contentLength < 200) lengthCategory = '짧은 글 (200자 미만)';
      else if (contentLength < 1000) lengthCategory = '중간 글 (200-1000자)';
      else lengthCategory = '긴 글 (1000자 이상)';
      
      acc[lengthCategory] = (acc[lengthCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 사용자별 활동
    const userActivity = allPostsData.reduce((acc, post) => {
      const userId = post.authorId || '익명';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 상호작용률 (댓글 수 기준)
    const interactionRate = allPostsData.map(post => post.comments || 0);
    
    // 요일별 분포 - 기존에 계산된 값 유지
    
    // 시간대별 분포 - 기존에 계산된 값 유지
    
    setStats({
      totalPosts,
      periodNewPosts,
      periodUpdatedPosts,
      categoryDistribution,
      tagDistribution,
      postsByDay,
      updatedByDay,
      dateLabels,
      postLengthDistribution,
      userActivity,
      interactionRate,
      weekdayDistribution: stats.weekdayDistribution,
      hourDistribution: stats.hourDistribution,
    });
  };

  // 기간별 게시물 데이터 생성 - 라인 차트
  const getDailyPostsData = () => {
    return {
      labels: stats.dateLabels,
      datasets: [
        {
          label: '신규 게시물',
          data: stats.postsByDay,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true,
        },
        {
          label: '업데이트된 게시물',
          data: stats.updatedByDay,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.1,
          fill: true,
        }
      ],
    };
  };
  
  // 카테고리 분포 데이터 생성 - 도넛 차트
  const getCategoryDistributionData = () => {
    // 카테고리 ID를 이름으로 변환하여 레이블 생성
    const categoryEntries = Object.entries(stats.categoryDistribution);
    const categoryLabels = categoryEntries.map(([id]) => {
      // 카테고리 이름으로 변환, 매핑이 없으면 ID 또는 미분류 사용
      return categoryMap[id] || (id === 'undefined' ? '미분류' : id);
    });
    
    const data = categoryEntries.map(([_, count]) => count);
    
    // 색상 배열
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
    ];
    
    // 카테고리가 색상보다 많으면 색상 반복
    const colors = categoryLabels.map((_, i) => backgroundColors[i % backgroundColors.length]);
    
    return {
      labels: categoryLabels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  };
  
  // 태그 분포 데이터 생성 - 폴라 차트
  const getTagDistributionData = () => {
    // 상위 5개 태그만 추출
    const sortedTags = Object.entries(stats.tagDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const labels = sortedTags.map(([tag]) => tag);
    const data = sortedTags.map(([_, count]) => count);
    
    // 색상 배열
    const backgroundColors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(255, 206, 86, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(153, 102, 255, 0.5)',
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
        },
      ],
    };
  };
  
  // 요일별 게시물 데이터 생성 - 레이더 차트
  const getWeekdayData = () => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    
    return {
      labels: weekdays,
      datasets: [
        {
          label: '요일별 게시물 수',
          data: stats.weekdayDistribution,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        },
      ],
    };
  };
  
  // 시간대별 게시물 데이터 생성 - 바 차트
  const getHourlyData = () => {
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}시`);
    
    return {
      labels: hourLabels,
      datasets: [
        {
          label: '시간대별 게시물 수',
          data: stats.hourDistribution,
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  /**
   * 날짜 범위 변경 핸들러
   */
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value as DateRangeOption);
  };

  /**
   * 사용자 지정 시작 날짜 변경 핸들러
   */
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartDate(e.target.value);
  };

  /**
   * 사용자 지정 종료 날짜 변경 핸들러
   */
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndDate(e.target.value);
  };
  
  /**
   * 차트 타입 변경 핸들러
   */
  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChartType(e.target.value as ChartType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div 
        className={`bg-white rounded-lg shadow-xl w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">고급 대시보드</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-600">
              <p className="font-medium">오류</p>
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* 필터 컨트롤 패널 */}
              <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 날짜 범위 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">기간 선택</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md bg-white"
                      value={dateRange}
                      onChange={handleDateRangeChange}
                    >
                      <option value="7days">최근 7일</option>
                      <option value="30days">최근 30일</option>
                      <option value="90days">최근 90일</option>
                      <option value="custom">사용자 지정</option>
                      <option value="all">전체 기간</option>
                    </select>
                    
                    {dateRange === 'custom' && (
                      <div className="mt-2 flex flex-col md:flex-row gap-2">
                        <input 
                          type="date" 
                          className="flex-1 p-2 border border-gray-300 rounded-md"
                          value={customStartDate}
                          onChange={handleStartDateChange}
                        />
                        <span className="text-center">~</span>
                        <input 
                          type="date" 
                          className="flex-1 p-2 border border-gray-300 rounded-md"
                          value={customEndDate}
                          onChange={handleEndDateChange}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* 차트 유형 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">차트 유형</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md bg-white"
                      value={selectedChartType}
                      onChange={handleChartTypeChange}
                    >
                      <option value="line">라인 차트</option>
                      <option value="bar">바 차트</option>
                      <option value="doughnut">도넛 차트</option>
                      <option value="polar">폴라 차트</option>
                      <option value="radar">레이더 차트</option>
                    </select>
                  </div>
                  
                  {/* 새로고침 버튼 */}
                  <div className="flex items-end">
                    <button 
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md w-full transition-colors"
                      onClick={loadData}
                    >
                      데이터 새로고침
                    </button>
                  </div>
                </div>
              </div>
              
              {/* 요약 통계 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 shadow-sm">
                  <h3 className="text-xs font-medium text-blue-800">전체 게시글</h3>
                  <p className="text-xl font-bold text-blue-600">{stats.totalPosts}개</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 shadow-sm">
                  <h3 className="text-xs font-medium text-green-800">선택 기간 신규</h3>
                  <p className="text-xl font-bold text-green-600">{stats.periodNewPosts}개</p>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-3 shadow-sm">
                  <h3 className="text-xs font-medium text-orange-800">선택 기간 수정</h3>
                  <p className="text-xl font-bold text-orange-600">{stats.periodUpdatedPosts}개</p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 shadow-sm">
                  <h3 className="text-xs font-medium text-purple-800">평균 상호작용</h3>
                  <p className="text-xl font-bold text-purple-600">
                    {stats.interactionRate.length > 0 
                      ? (stats.interactionRate.reduce((a, b) => a + b, 0) / stats.interactionRate.length).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
              </div>
              
              {/* 메인 차트 영역 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">기간별 게시물 추이</h3>
                <div className="h-64">
                  <Line 
                    data={getDailyPostsData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            precision: 0
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* 차트 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 카테고리 분포 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-md font-medium text-gray-800 mb-2">카테고리별 분포</h3>
                  <div className="h-60">
                    <Doughnut 
                      data={getCategoryDistributionData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              font: {
                                size: 11
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* 태그 분포 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-md font-medium text-gray-800 mb-2">인기 태그 (상위 5개)</h3>
                  <div className="h-60">
                    <PolarArea 
                      data={getTagDistributionData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            ticks: {
                              display: false
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* 요일별 분포 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-md font-medium text-gray-800 mb-2">요일별 게시물 분포</h3>
                  <div className="h-60">
                    <Radar 
                      data={getWeekdayData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          r: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* 시간대별 분포 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-md font-medium text-gray-800 mb-2">시간대별 게시물 분포</h3>
                  <div className="h-60">
                    <Bar 
                      data={getHourlyData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              precision: 0
                            }
                          }
                        },
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard; 