import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const FAQS_DATA: FAQ[] = [
  {
    category: 'National ID',
    question: 'What documents are required to apply for a New ID?',
    answer: 'You need to upload a recent digital passport-sized photo (dimensions between 300x300px and 600x600px) and a proof of residence in PDF format (such as a utility bill, house deed, or letter from your local community association).'
  },
  {
    category: 'National ID',
    question: 'How long does it take to process an ID renewal?',
    answer: 'ID renewal applications are typically processed within 3 to 5 business days. You will receive an automated email notification once your card is ready for pickup.'
  },
  {
    category: 'Birth Certificate',
    question: 'Can I apply for a birth certificate for my child online?',
    answer: 'Yes! Select the Birth Certificate option. You will need to provide the child\'s full name, date and place of birth, parents\' details, and upload the hospital birth notification document and at least one parent\'s ID.'
  },
  {
    category: 'General',
    question: 'Can I submit multiple applications at the same time?',
    answer: 'No. To ensure speed and efficiency, each resident is restricted to having only one active (Pending Review) application at a time.'
  },
  {
    category: 'General',
    question: 'What do the different application statuses mean?',
    answer: 'PENDING: Your application has been submitted and is awaiting staff review. READY: Your application is approved and your document is ready for pickup at the Kebele office. REJECTED: The application was rejected. Check your profile or email for the feedback details.'
  }
];

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFAQIndex, setActiveFAQIndex] = useState<number | null>(null);

  const filteredFAQs = FAQS_DATA.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleFAQ = (index: number) => {
    setActiveFAQIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="glass" style={{ padding: '60px 40px', borderRadius: 'var(--radius-lg)', textAlign: 'center', marginBottom: '48px', background: 'linear-gradient(135deg, var(--glass-bg), hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.05))' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
          🏛️ Kebele Administrative Services
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
          Skip the long queues. Securely apply for your Ethiopian National ID, renew your existing identification card, or request birth certificates online.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
              Go to Dashboard ➜
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
                Register Account
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Services Grid */}
      <section style={{ marginBottom: '64px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '40px' }}>Our Services</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Service 1 */}
          <div className="glass glass-hover" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🪪</span>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>New National ID</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', flexGrow: 1 }}>
              Apply for your first National ID card. Requires a digital 300x300px to 600x600px photo and PDF residence proof.
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>⏱ 5 Business Days</span>
              <span>FREE</span>
            </div>
          </div>

          {/* Service 2 */}
          <div className="glass glass-hover" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔄</span>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>ID Renewal</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', flexGrow: 1 }}>
              Renew an expired or damaged National ID card. Requires your existing ID number, reason for renewal, and a fresh photo.
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>⏱ 3 Business Days</span>
              <span>FREE</span>
            </div>
          </div>

          {/* Service 3 */}
          <div className="glass glass-hover" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '16px' }}>👶</span>
            <h3 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Birth Certificate</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px', flexGrow: 1 }}>
              Request official birth certificates. Requires hospital notifications proof, parents' ID card copy uploads, and child information.
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'between', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>⏱ 2 Business Days</span>
              <span>FREE</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section style={{ marginBottom: '80px', maxWidth: '800px', margin: '0 auto 80px auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '16px' }}>Frequently Asked Questions</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Have questions? Find quick answers about our procedures and documents.
        </p>

        {/* Search FAQs */}
        <div className="form-group" style={{ marginBottom: '32px' }}>
          <input 
            type="text" 
            placeholder="Search FAQs by keywords..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '14px 20px', borderRadius: 'var(--radius-md)', fontSize: '1rem' }}
          />
        </div>

        {/* FAQ Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => {
              const isOpen = activeFAQIndex === index;
              return (
                <div key={index} className="glass" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <button 
                    onClick={() => handleToggleFAQ(index)} 
                    style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'between', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{faq.category}</span>
                      {faq.question}
                    </span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--primary)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                      ▶
                    </span>
                  </button>
                  <div style={{ 
                    maxHeight: isOpen ? '200px' : '0px', 
                    overflow: 'hidden', 
                    transition: 'all 0.3s cubic-bezier(0, 1, 0, 1)', 
                    padding: isOpen ? '0 24px 24px 24px' : '0 24px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    fontSize: '0.95rem'
                  }}>
                    {faq.answer}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
              No FAQs matched your search terms.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
