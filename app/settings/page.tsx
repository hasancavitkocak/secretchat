'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getUser, saveUser, clearAllData } from '@/lib/storage';
import { User as UserType } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/');
      return;
    }
    setUser(currentUser);
    setUsername(currentUser.username);
  }, [router]);

  const saveUsername = () => {
    if (!user || !username.trim()) return;

    const updatedUser = { ...user, username: username.trim() };
    setUser(updatedUser);
    saveUser(updatedUser);
    setIsEditing(false);
  };

  const saveGender = (gender: 'male' | 'female') => {
    if (!user) return;

    const updatedUser = { ...user, gender };
    setUser(updatedUser);
    saveUser(updatedUser);
    setIsEditingGender(false);
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This will delete your profile, friends, and chat history. This action cannot be undone.'
    );

    if (confirmed) {
      clearAllData();
      router.push('/');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 overflow-y-auto">
      <div className="max-w-md mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Manage your profile</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Profile Section */}
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold">Profile</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Username
                </label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter username"
                    />
                    <Button
                      onClick={saveUsername}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setUsername(user.username);
                      }}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white">{user.username}</span>
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  User ID
                </label>
                <div className="bg-slate-700 rounded-lg p-3">
                  <code className="text-white/80 text-sm break-all">
                    {user.id}
                  </code>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Gender
                </label>
                {isEditingGender ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveGender('male')}
                      variant={user.gender === 'male' ? "default" : "outline"}
                      size="sm"
                      className={user.gender === 'male' ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-white hover:bg-slate-700"}
                    >
                      Male
                    </Button>
                    <Button
                      onClick={() => saveGender('female')}
                      variant={user.gender === 'female' ? "default" : "outline"}
                      size="sm"
                      className={user.gender === 'female' ? "bg-purple-600 hover:bg-purple-700" : "border-slate-600 text-white hover:bg-slate-700"}
                    >
                      Female
                    </Button>
                    <Button
                      onClick={() => setIsEditingGender(false)}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-white capitalize">{user.gender}</span>
                    <Button
                      onClick={() => setIsEditingGender(true)}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Account Status
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-white">
                    {user.isPremium ? 'Premium' : 'Free'}
                  </span>
                  {user.isPremium && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-500/5 border-red-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
              <h3 className="text-red-400 font-semibold">Danger Zone</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Clear All Data</h4>
                <p className="text-white/60 text-sm mb-4">
                  This will permanently delete your profile, friends, and all chat history. 
                  You will get a new anonymous ID.
                </p>
                <Button
                  onClick={handleClearData}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 mb-8 text-center"
        >
          <Button
            onClick={() => router.push('/search')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back to Chat
          </Button>
        </motion.div>
      </div>
    </div>
  );
}