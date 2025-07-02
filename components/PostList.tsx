import React from 'react';
import type { UIPost } from '../src/types';
import PostItem from './PostItem';
import { SearchIcon } from './icons';

interface PostListProps {
  posts: UIPost[];
  selectedPostId: string | null;
  onSelectPost: (post: UIPost) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const PostList: React.FC<PostListProps> = ({ posts, selectedPostId, onSelectPost, searchTerm, onSearchChange }) => {
  return (
    <div className="w-80 md:w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="검색"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-100 rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <ul className="overflow-y-auto flex-grow">
        {posts.length > 0 ? (
          posts.map((post) => (
            <PostItem
              key={post.id}
              post={post}
              isSelected={post.id === selectedPostId}
              onClick={() => onSelectPost(post)}
            />
          ))
        ) : (
          <div className="text-center text-slate-500 p-8">게시물이 없습니다.</div>
        )}
      </ul>
    </div>
  );
};

export default PostList;
