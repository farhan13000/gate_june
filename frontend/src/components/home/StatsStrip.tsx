import React from 'react';
import { Users, BookOpen, BarChart3, Clock, Trophy } from 'lucide-react';
import './StatsStrip.css';

export default function StatsStrip() {
  return (
    <div className="stats-strip-container">
      <div className="stats-strip-inner">
        <div className="stat-item">
          <Users size={32} className="stat-icon" strokeWidth={1.5} />
          <div className="stat-info">
            <span className="stat-value">50K+</span>
            <span className="stat-label">Active Learners</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <BookOpen size={32} className="stat-icon" strokeWidth={1.5} />
          <div className="stat-info">
            <span className="stat-value">10K+</span>
            <span className="stat-label">Practice Questions</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <BarChart3 size={32} className="stat-icon" strokeWidth={1.5} />
          <div className="stat-info">
            <span className="stat-value">95%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <Clock size={32} className="stat-icon" strokeWidth={1.5} />
          <div className="stat-info">
            <span className="stat-value">2.5M+</span>
            <span className="stat-label">Tests Attempted</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <Trophy size={32} className="stat-icon" strokeWidth={1.5} />
          <div className="stat-info">
            <span className="stat-value">Top Rankers</span>
            <span className="stat-label">From GATE DA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
