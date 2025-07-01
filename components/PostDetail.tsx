

import React from 'react';
import type { Post } from '../types';
import { MessagesSquareIcon, HashtagIcon } from './icons';

interface PostDetailProps {
  post: Post | null;
  onSelectTag: (tag: string) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onSelectTag }) => {
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

  return (
    <div className="flex-grow bg-slate-50 flex flex-col h-full">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
        <div className="flex items-center space-x-3 mt-3 text-sm">
          <img src={post.author.avatarUrl} alt={post.author.name} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-semibold text-slate-800">{post.author.name}</p>
            <p className="text-slate-500">{post.date}</p>
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