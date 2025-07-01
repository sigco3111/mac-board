
import React from 'react';
import type { Post } from '../types';

interface PostItemProps {
  post: Post;
  isSelected: boolean;
  onClick: () => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, isSelected, onClick }) => {
  return (
    <li
      onClick={onClick}
      className={`p-3 border-b border-slate-200 cursor-pointer transition-colors duration-150 ${
        isSelected ? 'bg-blue-100/70' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <img src={post.author.avatarUrl} alt={post.author.name} className="w-8 h-8 rounded-full" />
          <div>
            <p className={`font-semibold text-sm ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{post.author.name}</p>
            <h3 className={`font-bold text-base ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>{post.title}</h3>
          </div>
        </div>
        <div className="flex flex-col items-end flex-shrink-0 ml-4">
            <span className="text-xs text-slate-500">{post.date}</span>
            {post.isNew && <span className="mt-2 w-3 h-3 bg-blue-500 rounded-full"></span>}
        </div>
      </div>
    </li>
  );
};

export default PostItem;
