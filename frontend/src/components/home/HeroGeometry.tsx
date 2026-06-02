import React from 'react';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Search, Trophy } from 'lucide-react';
import './HeroGeometry.css';
import heroImg from '../../assets/hero_geometry.png';
import FloatingShapes from './FloatingShapes';

export default function HeroGeometry() {
  return (
    <section className="hero-geometry-section">
      <FloatingShapes />
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
              <TrendingUp size={24} className="hero-feature-icon" strokeWidth={1.5} />
              <h3 className="hero-feature-title">Track Progress</h3>
              <p className="hero-feature-desc">Monitor your growth</p>
            </div>
            
            <div className="hero-feature-item">
              <Search size={24} className="hero-feature-icon" strokeWidth={1.5} />
              <h3 className="hero-feature-title">Analyze Performance</h3>
              <p className="hero-feature-desc">Dive deep into analytics</p>
            </div>
            
            <div className="hero-feature-item">
              <Target size={24} className="hero-feature-icon" strokeWidth={1.5} />
              <h3 className="hero-feature-title">Identify Weak Areas</h3>
              <p className="hero-feature-desc">Focus on what matters</p>
            </div>
            
            <div className="hero-feature-item">
              <Trophy size={24} className="hero-feature-icon" strokeWidth={1.5} />
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
              alt="GATE DA Mathematical Dashboard Illustration" 
              className="hero-image" 
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
