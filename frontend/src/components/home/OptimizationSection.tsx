import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import './OptimizationSection.css';
import optImg from '../../assets/optimization_mesh.png';
import FloatingShapes from './FloatingShapes';

export default function OptimizationSection() {
  return (
    <section className="optimization-section">
      <FloatingShapes />
      <div className="optimization-container">
        
        {/* Left Illustration */}
        <div className="optimization-visual">
          <img 
            src={optImg} 
            alt="Mathematical optimization surface visualization" 
            className="optimization-image" 
            loading="lazy"
          />
        </div>

        {/* Right Content */}
        <div className="optimization-content">
          <div className="optimization-label">Mathematical Optimization</div>
          <h2 className="optimization-title">Train Like a<br />Researcher.</h2>
          <p className="optimization-desc">
            Master probability, optimization, machine learning, and data structures through deep analytical practice.
          </p>
          
          <div className="optimization-features">
            <div className="opt-feature-item">
              <CheckCircle2 size={18} className="opt-feature-icon" />
              Advanced analytics
            </div>
            <div className="opt-feature-item">
              <CheckCircle2 size={18} className="opt-feature-icon" />
              Weak area detection
            </div>
            <div className="opt-feature-item">
              <CheckCircle2 size={18} className="opt-feature-icon" />
              Topic mastery tracking
            </div>
            <div className="opt-feature-item">
              <CheckCircle2 size={18} className="opt-feature-icon" />
              Mathematical problem solving
            </div>
          </div>

          <Link to="/problems" className="optimization-link">
            Start Practicing <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  );
}
