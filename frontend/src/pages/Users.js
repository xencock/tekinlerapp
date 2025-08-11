import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { Plus, Edit, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// Modal Component
const UserModal = ({ isOpen, onClose, onSave, user, setUser, error }) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{user?.id ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}</h2>
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">Tam Ad</label>
            <input type="text" name="fullName" value={user?.fullName || ''} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Kullanıcı Adı</label>
            <input type="text" name="username" value={user?.username || ''} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pin">PIN (4 Haneli)</label>
            <input 
              type="password" 
              name="pin" 
              value={user?.pin || ''} 
              onChange={handleChange} 
              placeholder={user?.id ? 'Değiştirmek için yeni PIN girin' : 'PIN girin'} 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              minLength="4" 
              maxLength="4"
              pattern="[0-9]{4}"
              required={!user?.id}
            />
          </div>
          <div className="flex items-center justify-end space-x-2">
            <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">İptal</button>
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Users Component
const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalError, setModalError] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/users?page=${page}&limit=10&search=${searchTerm}`);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openModal = (user = null) => {
    setCurrentUser(user ? { ...user } : { fullName: '', username: '', pin: '' });
    setModalError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSave = async () => {
    setModalError(null);
    
    // Client-side validation
    if (!currentUser.fullName?.trim()) {
      setModalError('Tam ad alanı zorunludur');
      return;
    }
    
    if (!currentUser.username?.trim()) {
      setModalError('Kullanıcı adı alanı zorunludur');
      return;
    }
    
    if (currentUser.username.length < 3 || currentUser.username.length > 30) {
      setModalError('Kullanıcı adı 3-30 karakter arasında olmalı');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(currentUser.username)) {
      setModalError('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
      return;
    }
    
    // PIN validation for new users
    if (!currentUser.id) {
      if (!currentUser.pin?.trim()) {
        setModalError('PIN alanı zorunludur');
        return;
      }
      
      if (currentUser.pin.length !== 4) {
        setModalError('PIN 4 haneli olmalı');
        return;
      }
      
      if (!/^[0-9]{4}$/.test(currentUser.pin)) {
        setModalError('PIN sadece rakam içerebilir');
        return;
      }
    }
    
    try {
      if (currentUser.id) {
        // Update user
        const updateData = {
          fullName: currentUser.fullName,
          username: currentUser.username,
        };
        if (currentUser.pin) {
          updateData.pin = currentUser.pin;
        }
        await api.put(`/users/${currentUser.id}`, updateData);
      } else {
        // Create user
        await api.post('/users', currentUser);
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      console.error('User save error:', err);
      
      // Better error handling
      if (err.response?.data?.details) {
        const details = err.response.data.details;
        const errorMessages = details.map(detail => `${detail.field}: ${detail.message}`).join('\n');
        setModalError(errorMessages);
      } else {
        setModalError(err.response?.data?.message || 'İşlem başarısız oldu.');
      }
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.isActive) {
        await api.delete(`/users/${user.id}`);
      } else {
        await api.patch(`/users/${user.id}/activate`);
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Durum değiştirilemedi.');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <UserModal isOpen={isModalOpen} onClose={closeModal} onSave={handleSave} user={currentUser} setUser={setCurrentUser} error={modalError} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
        <button onClick={() => openModal()} className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors">
          <Plus size={20} className="mr-2" /> Yeni Kullanıcı
        </button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
          <form onSubmit={handleSearch} className="flex items-center">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Kullanıcı ara..." className="border rounded-l-lg p-2 w-full sm:w-64"/>
            <button type="submit" className="bg-gray-200 p-2 rounded-r-lg hover:bg-gray-300"><Search size={20} /></button>
          </form>
          <button onClick={fetchUsers} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200" title="Yenile"><RefreshCw size={20} /></button>
        </div>

        {loading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tam Ad</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı Adı</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="py-4 px-4 whitespace-nowrap">{user.fullName}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-gray-500">{user.username}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openModal(user)} className="text-blue-600 hover:text-blue-900" title="Düzenle"><Edit size={18} /></button>
                        <button onClick={() => handleToggleActive(user)} className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} title={user.isActive ? 'Deaktif Et' : 'Aktif Et'}>
                          {user.isActive ? <ToggleLeft size={22} /> : <ToggleRight size={22} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-700">
              Sayfa {pagination.currentPage} / {pagination.totalPages}
            </span>
            <div className="flex space-x-1">
              <button onClick={() => setPage(p => p - 1)} disabled={!pagination.hasPrevPage} className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"><ChevronLeft size={18} /></button>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNextPage} className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"><ChevronRight size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
