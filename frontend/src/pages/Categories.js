import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder } from 'lucide-react';

import { categoriesAPI } from '../utils/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    color: '#6B7280'
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);



  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle add
  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      sortOrder: 0,
      color: '#6B7280'
    });
    setShowAddModal(true);
  };

  // Handle edit
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      sortOrder: category.sortOrder || 0,
      color: category.color || '#6B7280'
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sortOrder: 0,
      color: '#6B7280'
    });
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCategory(null);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showEditModal) {
        await categoriesAPI.update(selectedCategory.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      
      await fetchCategories();
      resetForm();
    } catch (error) {
      console.error('Kategori kaydedilirken hata:', error);
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  // Handle delete
  const handleDelete = async (category) => {
    if (!window.confirm(`"${category.name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await categoriesAPI.delete(category.id);
      await fetchCategories();
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
      alert(error.response?.data?.message || 'Kategori silinemedi');
    }
  };

  // Render category list
  const renderCategory = (category) => {
    return (
      <div key={category.id}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <div 
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: category.color || '#6B7280' }}
            ></div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="font-medium text-gray-900">{category.name}</div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  #{(category.sortOrder || 0).toString().padStart(2, '0')}
                </span>
              </div>
              {category.description && (
                <div className="text-sm text-gray-500 mt-1">{category.description}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                Barkod kodu: {category.name ? 'Otomatik' : 'Belirlenmemiş'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(category)}
              className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Kategoriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Kategori Yönetimi</h2>
            <p className="text-gray-600">Ürün kategorilerini yönetin</p>
          </div>
          <button
            onClick={handleAdd}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Yeni Kategori</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">
              Kategoriler ({categories.length})
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Folder size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Henüz kategori eklenmemiş</p>
              </div>
            ) : (
               categories
                 .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name, 'tr'))
                 .map(category => renderCategory(category))
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-medium">
                  {showEditModal ? 'Kategori Düzenle' : 'Yeni Kategori'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="input"
                    rows="2"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sıralama
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Rengi
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="input flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      placeholder="#6B7280"
                    />
                  </div>
                  <div className="mt-2 flex space-x-2">
                    {['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({...prev, color}))}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {showEditModal ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
