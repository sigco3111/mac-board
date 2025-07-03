import React from 'react';
import type { UIPost } from '../src/types';
import { useAuth } from '../src/hooks/useAuth';

interface PostItemProps {
  post: UIPost;
  isSelected: boolean;
  onClick: () => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, isSelected, onClick }) => {
  // 인증 정보 가져오기
  const { user } = useAuth();
  
  // 기본 프로필 이미지
  const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+`;

  // 현재 사용자가 글 작성자와 일치하고 구글 로그인 사용자라면 해당 프로필 이미지 사용
  const avatarUrl = (user && user.uid === post.authorId && !user.isAnonymous && user.photoURL) 
    ? user.photoURL 
    : defaultAvatar;

  return (
    <li
      onClick={onClick}
      className={`p-3 border-b border-slate-200 cursor-pointer transition-colors duration-150 ${
        isSelected ? 'bg-blue-100/70' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <img 
            src={avatarUrl} 
            alt={post.author.name} 
            className="w-8 h-8 rounded-full"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
          <div>
            <p className={`font-semibold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{post.author.name}</p>
            <h3 className={`font-bold text-base ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>{post.title}</h3>
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 ml-4">
            <span className="text-xs text-slate-500">{new Date(post.date).toLocaleDateString()}</span>
            {post.isNew && <span className="mt-2 w-3 h-3 bg-blue-500 rounded-full"></span>}
        </div>
      </div>
    </li>
  );
};

export default PostItem;
