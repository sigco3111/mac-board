import React from 'react';
import type { UIPost } from '../src/types';
import PostItem from './PostItem';
import { SearchIcon } from './icons';

interface PostListProps {
  posts: UIPost[];
  selectedPost: UIPost | null;
  onSelectPost: (post: UIPost) => void;
  loading?: boolean;
  error?: string;
}

const PostList: React.FC<PostListProps> = ({ posts, selectedPost, onSelectPost, loading, error }) => {
  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg flex-shrink-0 bg-white flex flex-col h-full">
      {/* 구분선 완전히 제거 */}
      
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-8">
          {error}
        </div>
      ) : (
        <ul className="overflow-y-auto flex-grow">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                isSelected={selectedPost && post.id === selectedPost.id}
                onClick={() => onSelectPost(post)}
              />
            ))
          ) : (
            <div className="text-center text-slate-500 p-8">게시물이 없습니다.</div>
          )}
        </ul>
      )}
    </div>
  );
};

export default PostList;
