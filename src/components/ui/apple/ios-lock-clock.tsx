"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface IOSLockClockProps {
  className?: string;
}

export function IOSLockClock({ className = '' }: IOSLockClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeComponents = (date: Date) => {
    const timeString = formatTime(date);
    const [hours, minutes] = timeString.split(':');
    return { hours, minutes };
  };

  const { hours, minutes } = getTimeComponents(time);

  return (
    <motion.div
      className={`text-center ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Time Display */}
      <motion.div 
        className="relative mb-4"
        animate={{ 
          scale: [1, 1.002, 1],
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Time Shadow/Depth */}
        <div className="absolute inset-0 transform translate-x-1 translate-y-1">
          <div className="text-8xl md:text-9xl font-thin adaptive-text-primary opacity-20 blur-sm">
            {hours}:{minutes}
          </div>
        </div>
        
        {/* Main Time */}
        <div className="relative">
          <div className="text-8xl md:text-9xl font-thin adaptive-text-primary drop-shadow-2xl">
            <motion.span
              key={hours}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-block"
            >
              {hours}
            </motion.span>
            <span className="mx-2 opacity-80">:</span>
            <motion.span
              key={minutes}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-block"
            >
              {minutes}
            </motion.span>
          </div>
        </div>

        {/* Glass Reflection Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent rounded-3xl pointer-events-none" />
      </motion.div>

      {/* Date Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative"
      >
        {/* Date Shadow/Depth */}
        <div className="absolute inset-0 transform translate-x-0.5 translate-y-0.5">
          <div className="text-xl md:text-2xl font-medium adaptive-text-secondary opacity-30 blur-sm">
            {formatDate(time)}
          </div>
        </div>
        
        {/* Main Date */}
        <div className="relative">
          <motion.div
            key={formatDate(time)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl md:text-2xl font-medium adaptive-text-secondary drop-shadow-lg"
          >
            {formatDate(time)}
          </motion.div>
        </div>
      </motion.div>

      {/* Ambient Glow Effect */}
      <motion.div
        className="absolute inset-0 -z-10"
        animate={{
          boxShadow: [
            '0 0 60px rgba(255, 255, 255, 0.1)',
            '0 0 80px rgba(255, 255, 255, 0.15)',
            '0 0 60px rgba(255, 255, 255, 0.1)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

export function IOSLockClockCompact({ className = '' }: IOSLockClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <motion.div
      className={`text-center ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative">
        {/* Time Shadow */}
        <div className="absolute inset-0 transform translate-x-0.5 translate-y-0.5">
          <div className="text-4xl md:text-5xl font-thin adaptive-text-primary opacity-20 blur-sm">
            {formatTime(time)}
          </div>
        </div>
        
        {/* Main Time */}
        <motion.div
          key={formatTime(time)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative text-4xl md:text-5xl font-thin adaptive-text-primary drop-shadow-xl"
        >
          {formatTime(time)}
        </motion.div>
      </div>
    </motion.div>
  );
}