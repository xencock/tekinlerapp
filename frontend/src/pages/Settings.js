import React, { useState } from 'react';
import { Settings as SettingsIcon, Folder, User, Shield, Bell, Database } from 'lucide-react';
import Categories from './Categories';
import Users from './Users';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('categories');

  const tabs = [
    {
      id: 'categories',
      name: 'Kategoriler',
      icon: Folder,
      component: Categories
    },
    {
      id: 'users',
      name: 'Kullanıcılar',
      icon: User,
      component: Users
    },
    {
      id: 'security',
      name: 'Güvenlik',
      icon: Shield,
      component: () => <div className="p-6 text-center text-gray-500">Güvenlik ayarları yakında...</div>
    },
    {
      id: 'notifications',
      name: 'Bildirimler',
      icon: Bell,
      component: () => <div className="p-6 text-center text-gray-500">Bildirim ayarları yakında...</div>
    },
    {
      id: 'database',
      name: 'Veritabanı',
      icon: Database,
      component: () => <div className="p-6 text-center text-gray-500">Veritabanı ayarları yakında...</div>
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || (() => null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ayarlar</h1>
                <p className="mt-1 text-sm text-gray-600">Uygulama yapılandırmalarını yönetin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Ayar Kategorileri</h2>
              </div>
              <nav className="space-y-1 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
