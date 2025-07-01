/**
 * 날짜 포맷팅 유틸리티 함수
 * 다양한 형식으로 날짜를 표시하는 기능을 제공합니다.
 */

/**
 * ISO 문자열 날짜를 사용자 친화적인 형식으로 변환
 * 예: '2023-05-15T14:30:00Z' -> '2023년 5월 15일'
 */
export const formatDate = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 정보 없음';
  }
};

/**
 * ISO 문자열 날짜를 상대적인 시간으로 변환
 * 예: '1시간 전', '3일 전', '방금 전'
 */
export const formatRelativeTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // 시간 차이 계산 (밀리초 기준)
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);
    
    // 상대적 시간 표시
    if (diffYear > 0) {
      return `${diffYear}년 전`;
    } else if (diffMonth > 0) {
      return `${diffMonth}개월 전`;
    } else if (diffDay > 0) {
      return `${diffDay}일 전`;
    } else if (diffHour > 0) {
      return `${diffHour}시간 전`;
    } else if (diffMin > 0) {
      return `${diffMin}분 전`;
    } else {
      return '방금 전';
    }
  } catch (error) {
    console.error('상대적 시간 변환 오류:', error);
    return '시간 정보 없음';
  }
};

/**
 * ISO 문자열 날짜를 시간 포함 형식으로 변환
 * 예: '2023-05-15T14:30:00Z' -> '2023년 5월 15일 14:30'
 */
export const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('날짜 및 시간 포맷팅 오류:', error);
    return '날짜 정보 없음';
  }
}; 