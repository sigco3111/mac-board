import React from 'react';
import type { UIPost } from '../src/types';
import { MessagesSquareIcon, HashtagIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';

interface PostDetailProps {
  post: UIPost | null;
  onSelectTag: (tag: string | null) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onSelectTag }) => {
  // 인증 정보 가져오기
  const { user } = useAuth();
  
  // 기본 프로필 이미지
  const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+`;

  if (!post) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="text-center">
            <MessagesSquareIcon className="mx-auto w-16 h-16 text-slate-300" />
            <p className="mt-2 text-lg">게시물을 선택하여 여기에서 보세요.</p>
        </div>
      </div>
    );
  }

  // 현재 사용자가 글 작성자와 일치하고 구글 로그인 사용자라면 해당 프로필 이미지 사용
  const avatarUrl = (user && user.uid === post.authorId && !user.isAnonymous && user.photoURL) 
    ? user.photoURL 
    : defaultAvatar;

  return (
    <div className="flex-grow bg-slate-50 flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
        <div className="flex items-center space-x-3 mt-3 text-sm">
          <img 
            src={avatarUrl} 
            alt={post.author.name} 
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
          <div>
            <p className="font-semibold text-slate-800">{post.author.name}</p>
            <p className="text-slate-500">{new Date(post.date).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="p-6 overflow-y-auto flex-grow">
        <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: post.content }}></div>
         {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center flex-wrap gap-2">
            {post.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onSelectTag(tag)}
                className="flex items-center space-x-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
              >
                <HashtagIcon className="w-3 h-3" />
                <span>{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
            <MessagesSquareIcon className="w-5 h-5" />
            <span>{post.comments}개의 댓글</span>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;