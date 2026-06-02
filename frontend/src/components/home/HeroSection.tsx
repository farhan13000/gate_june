import React from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Search, Trophy, Users, BookOpen, BarChart3, Clock } from 'lucide-react';
import './HeroSection.css';
import heroImg from '../../assets/hero-gate-da-analytics.png';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        
        {/* Left Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Master Data Science.<br />
            Crack <span className="highlight">GATE DA</span>.
          </h1>
          
          <div className="hero-underline"></div>
          
          <p className="hero-subtitle">
            Your all-in-one analytics hub to track performance, identify weak areas, and accelerate your preparation with data-driven insights.
          </p>
          
          <div className="hero-ctas">
            <Link to="/dashboard" className="hero-btn hero-btn-primary">
              <TrendingUp size={20} />
              Explore Dashboard
            </Link>
            <Link to="/contests" className="hero-btn hero-btn-secondary">
              <Target size={20} />
              Take a Test
            </Link>
          </div>
          
          <div className="hero-features">
            <div className="hero-feature-item">
              <TrendingUp size={24} className="hero-feature-icon" />
              <h3 className="hero-feature-title">Track Progress</h3>
              <p className="hero-feature-desc">Monitor your growth</p>
            </div>
            
            <div className="hero-feature-item">
              <BarChart3 size={24} className="hero-feature-icon" />
              <h3 className="hero-feature-title">Analyze Performance</h3>
              <p className="hero-feature-desc">Dive deep into analytics</p>
            </div>
            
            <div className="hero-feature-item">
              <Search size={24} className="hero-feature-icon" />
              <h3 className="hero-feature-title">Identify Weak Areas</h3>
              <p className="hero-feature-desc">Focus on what matters</p>
            </div>
            
            <div className="hero-feature-item">
              <Trophy size={24} className="hero-feature-icon" />
              <h3 className="hero-feature-title">Achieve Your Goal</h3>
              <p className="hero-feature-desc">Stay consistent, crack GATE</p>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="hero-illustration">
          <div className="hero-visual">
            <img 
              src={heroImg} 
              alt="GATE DA Analytics Dashboard Illustration" 
              className="hero-image" 
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Bottom Stats Strip */}
      <div className="hero-stats">
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
    </section>
  );
}
