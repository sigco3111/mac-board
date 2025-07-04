import React, { useState, useEffect } from 'react';
import { 
  fetchCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory, 
  reorderCategories,
  CategoryItem
} from '../../../services/admin/categories';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

/**
 * 카테고리 관리 컴포넌트
 * 카테고리의 CRUD 및 순서 변경 기능을 제공합니다.
 */
const CategoryManagement: React.FC = () => {
  // 카테고리 목록 상태
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  // 새 카테고리 이름 상태
  const [newCategoryName, setNewCategoryName] = useState('');
  // 수정 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  // 수정할 이름 상태
  const [editingName, setEditingName] = useState('');
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);
  // 성공 메시지 상태
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // 삭제 확인 모달 상태
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /**
   * 카테고리 목록 불러오기
   */
  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(`카테고리 목록을 불러오는 데 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 카테고리 추가 처리
   */
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await addCategory({ name: newCategoryName.trim() });
      await loadCategories();
      setNewCategoryName('');
      showSuccessMessage('카테고리가 성공적으로 추가되었습니다.');
    } catch (err) {
      setError(`카테고리 추가에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 카테고리 수정 모드 진입
   */
  const startEditing = (category: CategoryItem) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  /**
   * 카테고리 수정 취소
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  /**
   * 카테고리 이름 수정 처리
   */
  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateCategory(categoryId, editingName.trim());
      await loadCategories();
      cancelEditing();
      showSuccessMessage('카테고리가 성공적으로 수정되었습니다.');
    } catch (err) {
      setError(`카테고리 수정에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 카테고리 삭제 확인
   */
  const confirmDelete = (categoryId: string) => {
    setDeleteConfirmId(categoryId);
  };

  /**
   * 카테고리 삭제 취소
   */
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  /**
   * 카테고리 삭제 처리
   */
  const handleDeleteCategory = async (categoryId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteCategory(categoryId);
      await loadCategories();
      setDeleteConfirmId(null);
      showSuccessMessage('카테고리가 성공적으로 삭제되었습니다.');
    } catch (err) {
      setError(`카테고리 삭제에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 성공 메시지 표시 및 자동 삭제
   */
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * 드래그 앤 드롭으로 순서 변경 처리
   */
  const handleDragEnd = async (result: DropResult) => {
    // 드래그가 목적지로 끝나지 않은 경우
    if (!result.destination) {
      return;
    }

    // 시스템 카테고리는 순서 변경 제한 (일단 화면에서만 제한)
    const systemCategories = ['general', 'tech', 'questions'];
    if (
      systemCategories.includes(categories[result.source.index].id) || 
      systemCategories.includes(categories[result.destination.index].id)
    ) {
      setError('기본 시스템 카테고리의 위치는 변경할 수 없습니다.');
      return;
    }
    
    // 위치가 변경되지 않은 경우
    if (result.destination.index === result.source.index) {
      return;
    }

    // 새 순서의 카테고리 배열 생성
    const reordered = Array.from(categories);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    // UI 먼저 업데이트
    setCategories(reordered);
    
    // API 호출하여 DB에 반영
    try {
      await reorderCategories(reordered);
      showSuccessMessage('카테고리 순서가 성공적으로 변경되었습니다.');
    } catch (err) {
      // 실패 시 원래 상태로 복구하고 에러 표시
      loadCategories();
      setError(`카테고리 순서 변경에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  // 컴포넌트 마운트 시 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">카테고리 관리</h2>
      
      {/* 성공 메시지 표시 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            className="ml-2 text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* 카테고리 추가 폼 */}
      <form 
        onSubmit={handleAddCategory} 
        className="mb-8 flex items-center space-x-2"
      >
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="새 카테고리 이름"
          className="px-4 py-2 border rounded flex-grow"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading || !newCategoryName.trim()}
        >
          추가
        </button>
      </form>
      
      {/* 카테고리 목록 */}
      {isLoading && !categories.length ? (
        <div className="text-center py-4">로딩 중...</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categories">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="border rounded divide-y"
              >
                {categories.map((category, index) => (
                  <Draggable 
                    key={category.id} 
                    draggableId={category.id} 
                    index={index}
                    isDragDisabled={['general', 'tech', 'questions'].includes(category.id)}
                  >
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-4 flex items-center justify-between ${
                          ['general', 'tech', 'questions'].includes(category.id) 
                            ? 'bg-gray-50' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* 시스템 카테고리 표시 또는 수정 폼 */}
                        {editingId === category.id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-3 py-1 border rounded flex-grow"
                              autoFocus
                            />
                            <button
                              onClick={() => handleUpdateCategory(category.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                              disabled={isLoading}
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                              disabled={isLoading}
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium flex-grow">{category.name}</span>
                            {['general', 'tech', 'questions'].includes(category.id) && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">시스템</span>
                            )}
                          </div>
                        )}
                        
                        {/* 카테고리 ID 표시 */}
                        <div className="text-xs text-gray-500 mx-4">
                          ID: {category.id}
                        </div>
                        
                        {/* 작업 버튼 */}
                        {!['general', 'tech', 'questions'].includes(category.id) && (
                          <div className="flex items-center space-x-1">
                            {/* 삭제 확인 모드 */}
                            {deleteConfirmId === category.id ? (
                              <>
                                <span className="text-sm text-red-600 mr-2">정말 삭제하시겠습니까?</span>
                                <button
                                  onClick={() => handleDeleteCategory(category.id)}
                                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                  disabled={isLoading}
                                >
                                  확인
                                </button>
                                <button
                                  onClick={cancelDelete}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                                  disabled={isLoading}
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <>
                                {/* 편집 버튼 */}
                                <button
                                  onClick={() => startEditing(category)}
                                  className="p-2 text-blue-500 hover:text-blue-700"
                                  disabled={isLoading || editingId !== null}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                                
                                {/* 삭제 버튼 */}
                                <button
                                  onClick={() => confirmDelete(category.id)}
                                  className="p-2 text-red-500 hover:text-red-700"
                                  disabled={isLoading || editingId !== null}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      {/* 도움말 */}
      <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded">
        <h3 className="font-bold mb-2">카테고리 관리 도움말</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>카테고리는 게시물을 분류하는 데 사용됩니다.</li>
          <li>시스템 카테고리(일반, 기술, 질문)는 수정 및 삭제할 수 없습니다.</li>
          <li>카테고리 순서를 변경하려면 카테고리를 드래그하여 이동하세요.</li>
          <li>카테고리를 삭제하면 해당 카테고리의 게시물은 '일반' 카테고리로 자동 이동됩니다.</li>
          <li>카테고리 ID는 자동으로 생성되며 수정할 수 없습니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryManagement; 