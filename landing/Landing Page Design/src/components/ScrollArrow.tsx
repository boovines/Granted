import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

export function ScrollArrow() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      animate={{
        y: [0, 10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <ChevronDown className="w-12 h-12 text-primary/50" strokeWidth={2} />
    </motion.div>
  );
}
