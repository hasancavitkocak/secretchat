'use client';

import { motion } from 'framer-motion';
import { Crown, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PREMIUM_PLANS } from '@/lib/types';

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: (planId: string) => void;
}

export default function PremiumDialog({
  open,
  onOpenChange,
  onUpgrade,
}: PremiumDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md mx-auto">
        <DialogHeader>
          <div className="text-center">
            <div className="bg-yellow-500/20 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
            <DialogTitle className="text-white text-xl">Premium Required</DialogTitle>
            <p className="text-white/70 mt-2">
              Upgrade to premium to match with female users and unlock exclusive features
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Premium Features */}
          <Card className="bg-white/5 border-white/10 p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              Premium Features
            </h3>
            <ul className="space-y-2">
              {[
                'Match with female users',
                'Priority matching',
                'Unlimited friend requests',
                'Advanced filters',
                'No ads'
              ].map((feature, index) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-white/80"
                >
                  <Check className="w-4 h-4 text-green-400" />
                  {feature}
                </motion.li>
              ))}
            </ul>
          </Card>

          {/* Pricing Plans */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Choose Your Plan</h3>
            {PREMIUM_PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{plan.name}</h4>
                      <p className="text-white/60 text-sm">{plan.duration}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-lg">{plan.price}</div>
                      <Button
                        onClick={() => onUpgrade(plan.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-2"
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}