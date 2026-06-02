import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './AnalyticsVectors.css';
import analyticsImg from '../../assets/analytics_vectors.png';
import FloatingShapes from './FloatingShapes';

export default function AnalyticsVectors() {
  return (
    <section className="analytics-vectors-section">
      <FloatingShapes />
      <div className="analytics-container">
        {/* Left Content */}
        <div className="analytics-content">
          <div className="analytics-label">Multi-Dimensional Analytics</div>
          <h2 className="analytics-title">Visualize Learning<br />Across Dimensions.</h2>
          <p className="analytics-desc">
            Track subject-wise performance, identify hidden weaknesses, and analyze your preparation mathematically.
          </p>
          <Link to="/dashboard/performance" className="analytics-link">
            View Analytics <ArrowRight size={16} />
          </Link>
        </div>

        {/* Right Illustration */}
        <div className="analytics-visual">
          <img 
            src={analyticsImg} 
            alt="Vector space linear algebra visualization" 
            className="analytics-image" 
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
