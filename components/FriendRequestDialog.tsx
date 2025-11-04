'use client';

import { motion } from 'framer-motion';
import { UserPlus, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FriendRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromUsername: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function FriendRequestDialog({
  open,
  onOpenChange,
  fromUsername,
  onAccept,
  onReject,
}: FriendRequestDialogProps) {
  const handleAccept = () => {
    onAccept();
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm mx-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="bg-purple-500/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-purple-400" />
            </div>
            <DialogTitle className="text-white text-xl">Friend Request</DialogTitle>
            <p className="text-white/70 mt-2">
              <span className="font-semibold text-purple-400">{fromUsername}</span> wants to be your friend
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-6">
          <Button
            onClick={handleAccept}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
          >
            <Check className="w-4 h-4 mr-2" />
            Accept
          </Button>
          
          <Button
            onClick={handleReject}
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 py-3 rounded-xl"
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}