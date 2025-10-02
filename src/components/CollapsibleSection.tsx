import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--border-primary)] last:border-b-0">
      {/* Header */}
      <div
        className="section-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="section-title">{title}</h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="text-[var(--text-tertiary)]"
        >
          <ChevronDown size={14} />
        </motion.div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] },
              opacity: { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }
            }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
