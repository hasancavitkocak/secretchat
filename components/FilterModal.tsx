'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MatchFilters, INTERESTS } from '@/lib/types';

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MatchFilters;
  onFiltersChange: (filters: MatchFilters) => void;
}

export default function FilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<MatchFilters>(filters);

  const handleGenderChange = (gender: 'male' | 'female' | undefined) => {
    setLocalFilters(prev => ({ ...prev, gender }));
  };

  const handleInterestToggle = (interest: string) => {
    setLocalFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const clearFilters = () => {
    const clearedFilters = { interests: [] };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Filter Matches</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gender Filter */}
          <div>
            <h3 className="text-white font-medium mb-3">Gender</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleGenderChange(undefined)}
                variant={!localFilters.gender ? "default" : "outline"}
                className={`text-sm ${
                  !localFilters.gender
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-slate-600 text-white hover:bg-slate-700"
                }`}
              >
                Any
              </Button>
              <Button
                onClick={() => handleGenderChange('male')}
                variant={localFilters.gender === 'male' ? "default" : "outline"}
                className={`text-sm ${
                  localFilters.gender === 'male'
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-slate-600 text-white hover:bg-slate-700"
                }`}
              >
                Male
              </Button>
              <Button
                onClick={() => handleGenderChange('female')}
                variant={localFilters.gender === 'female' ? "default" : "outline"}
                className={`text-sm ${
                  localFilters.gender === 'female'
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "border-slate-600 text-white hover:bg-slate-700"
                }`}
              >
                Female
              </Button>
            </div>
          </div>

          {/* Interests Filter */}
          <div>
            <h3 className="text-white font-medium mb-3">Interests</h3>
            <div className="grid grid-cols-2 gap-2">
              {INTERESTS.map((interest) => (
                <motion.div
                  key={interest}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => handleInterestToggle(interest)}
                    variant={localFilters.interests.includes(interest) ? "default" : "outline"}
                    className={`w-full text-sm ${
                      localFilters.interests.includes(interest)
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "border-slate-600 text-white hover:bg-slate-700"
                    }`}
                  >
                    {interest}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="flex-1 border-slate-600 text-white hover:bg-slate-700"
            >
              Clear All
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}