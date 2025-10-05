import React, { useState } from 'react';
import { Button } from './ui/button';
import { RefreshCw, ExternalLink, Calendar, Edit3, Save, X, Home } from 'lucide-react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Grant {
  id: string;
  title: string;
  description: string;
  link: string;
  timePosted: string;
  image: string;
  isEditing?: boolean;
}

interface GrantsProps {
  className?: string;
  onNavigateToHome?: () => void;
}

const Grants = ({ className = '', onNavigateToHome }: GrantsProps) => {
  console.log('Grants component rendering with className:', className);
  const [grants, setGrants] = useState<Grant[]>([
    {
      id: '1',
      title: 'NSF Graduate Research Fellowship Program',
      description: 'Funding for PhD students pursuing research-based master\'s and doctoral degrees in STEM fields. Up to $37,000 annual stipend plus $12,000 cost of education allowance.',
      timePosted: '2024-01-15',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzFlM2E4YSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TlNGIEdSRlA8L3RleHQ+PC9zdmc+',
      link: 'https://www.nsfgrfp.org/',
      isEditing: false
    },
    {
      id: '2',
      title: 'Fulbright U.S. Student Program',
      description: 'International research and study grants for graduate students. Provides funding for academic projects abroad, including tuition, living expenses, and research costs.',
      timePosted: '2024-01-10',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzA1OTY2OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RnVsYnJpZ2h0PC90ZXh0Pjwvc3ZnPg==',
      link: 'https://us.fulbrightonline.org/',
      isEditing: false
    },
    {
      id: '3',
      title: 'Gates Cambridge Scholarship',
      description: 'Full-cost scholarship for international PhD students at Cambridge University. Covers university fees, maintenance allowance, and additional discretionary funding.',
      timePosted: '2024-01-08',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzdjM2FlZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R2F0ZXMgQ2FtYnJpZGdlPC90ZXh0Pjwvc3ZnPg==',
      link: 'https://www.gatescambridge.org/',
      isEditing: false
    },
    {
      id: '4',
      title: 'Rhodes Scholarship',
      description: 'Graduate scholarship for exceptional students to study at Oxford University. Covers all university and college fees, personal stipend, and travel costs.',
      timePosted: '2024-01-05',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2RjMjYyNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmhvZGVzPC90ZXh0Pjwvc3ZnPg==',
      link: 'https://www.rhodeshouse.ox.ac.uk/scholarships/',
      isEditing: false
    },
    {
      id: '5',
      title: 'Marshall Scholarship',
      description: 'Graduate scholarship for American students to study at any UK university. Provides tuition, living expenses, and travel costs for 1-2 years of study.',
      timePosted: '2024-01-03',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2VhNTgwYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TWFyc2hhbGw8L3RleHQ+PC9zdmc+',
      link: 'https://www.marshallscholarship.org/',
      isEditing: false
    },
    {
      id: '6',
      title: 'Hertz Foundation Fellowship',
      description: 'Graduate fellowship for PhD students in applied physical, biological, and engineering sciences. Provides full tuition and stipend for up to 5 years.',
      timePosted: '2024-01-01',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzA4OTFiMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SHVydHo8L3RleHQ+PC9zdmc+',
      link: 'https://hertzfoundation.org/',
      isEditing: false
    }
  ]);

  const handleRegenerate = () => {
    // Mock regenerate functionality
    const newGrants = [
      {
        id: '7',
        title: 'Ford Foundation Fellowship',
        description: 'Predoctoral, dissertation, and postdoctoral fellowships for individuals committed to diversity in higher education. Up to $28,000 annual stipend.',
        timePosted: '2024-01-20',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2JlMTg1ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Rm9yZCBGb3VuZGF0aW9uPC90ZXh0Pjwvc3ZnPg==',
        link: 'https://sites.nationalacademies.org/PGA/FordFellowships/',
        isEditing: false
      },
      {
        id: '8',
        title: 'National Science Foundation Graduate Research Fellowship',
        description: 'Three-year graduate fellowship in NSF-supported STEM disciplines. Provides $37,000 annual stipend and $12,000 cost of education allowance.',
        timePosted: '2024-01-18',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzA1OTY2OSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TlNGIEdSRjwvdGV4dD48L3N2Zz4=',
        link: 'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=6201',
        isEditing: false
      },
      {
        id: '9',
        title: 'Paul & Daisy Soros Fellowships for New Americans',
        description: 'Graduate fellowship for immigrants and children of immigrants pursuing graduate study in the US. Up to $90,000 over two years.',
        timePosted: '2024-01-16',
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzdjMmQxMiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U29yb3M8L3RleHQ+PC9zdmc+',
        link: 'https://www.pdsoros.org/',
        isEditing: false
      }
    ];

    setGrants(newGrants);
  };

  const handleEdit = (id: string) => {
    setGrants(prev => prev.map(grant => 
      grant.id === id ? { ...grant, isEditing: true } : grant
    ));
  };

  const handleSave = (id: string, field: keyof Grant, value: string) => {
    setGrants(prev => prev.map(grant => 
      grant.id === id ? { ...grant, [field]: value, isEditing: false } : grant
    ));
  };

  const handleCancel = (id: string) => {
    setGrants(prev => prev.map(grant => 
      grant.id === id ? { ...grant, isEditing: false } : grant
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`bg-app-navy text-app-white p-6 h-full overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-app-white mb-2">Research Grants</h1>
            <p className="text-app-white/70">Discover funding opportunities for your academic research</p>
          </div>
          <div className="flex items-center gap-3">
            {onNavigateToHome && (
              <Button
                onClick={onNavigateToHome}
                size="sm"
                className="flex items-center gap-1 px-3 py-1 bg-app-gold hover:bg-app-gold/90 text-app-navy font-medium text-xs"
              >
                <Home className="w-3 h-3" />
                Home
              </Button>
            )}
            <Button 
              onClick={handleRegenerate}
              className="bg-app-gold hover:bg-app-gold/90 text-app-navy font-semibold px-6 py-2 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Grants
            </Button>
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div className="mb-4 p-4 bg-app-white/10 rounded-lg">
        <p className="text-app-white/80">Debug: Grants component is rendering</p>
        <p className="text-app-white/80">Number of grants: {grants.length}</p>
        <p className="text-app-white/80">Current page should be: grants</p>
      </div>

      {/* Grants Grid */}
      {grants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grants.map((grant) => (
            <div 
              key={grant.id}
              className="bg-app-white/5 backdrop-blur-sm border border-app-white/10 rounded-lg p-6 hover:bg-app-white/10 transition-all duration-200"
            >
              {/* Image */}
              <div className="mb-4">
                <ImageWithFallback
                  src={grant.image}
                  alt={grant.title}
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>

              {/* Title */}
              <div className="mb-3">
                {grant.isEditing ? (
                  <Input
                    value={grant.title}
                    onChange={(e) => setGrants(prev => prev.map(g => 
                      g.id === grant.id ? { ...g, title: e.target.value } : g
                    ))}
                    className="bg-app-white/10 border-app-white/20 text-app-white placeholder-app-white/50"
                    placeholder="Grant title"
                  />
                ) : (
                  <h3 className="text-lg font-semibold text-app-white line-clamp-2">
                    {grant.title}
                  </h3>
                )}
              </div>

              {/* Description */}
              <div className="mb-4">
                {grant.isEditing ? (
                  <Textarea
                    value={grant.description}
                    onChange={(e) => setGrants(prev => prev.map(g => 
                      g.id === grant.id ? { ...g, description: e.target.value } : g
                    ))}
                    className="bg-app-white/10 border-app-white/20 text-app-white placeholder-app-white/50 min-h-[100px]"
                    placeholder="Grant description"
                  />
                ) : (
                  <p className="text-app-white/80 text-sm line-clamp-3 leading-relaxed">
                    {grant.description}
                  </p>
                )}
              </div>

              {/* Time Posted */}
              <div className="mb-4 flex items-center text-app-white/60 text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                <span>Posted {formatDate(grant.timePosted)}</span>
              </div>

              {/* Link */}
              <div className="mb-4">
                {grant.isEditing ? (
                  <Input
                    value={grant.link}
                    onChange={(e) => setGrants(prev => prev.map(g => 
                      g.id === grant.id ? { ...g, link: e.target.value } : g
                    ))}
                    className="bg-app-white/10 border-app-white/20 text-app-white placeholder-app-white/50"
                    placeholder="Grant URL"
                  />
                ) : (
                  <a 
                    href={grant.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-app-gold hover:text-app-gold/80 text-sm font-medium transition-colors hover:underline flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Grant Details
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                {grant.isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleSave(grant.id, 'title', grant.title)}
                      className="bg-app-gold hover:bg-app-gold/90 text-app-navy"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(grant.id)}
                      className="text-app-white hover:bg-app-white/10"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(grant.id)}
                    className="text-app-white hover:bg-app-white/10"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-app-white/90 mb-2">No grants available</h3>
          <p className="text-app-white/70 mb-6">Click the regenerate button to discover new funding opportunities</p>
          <Button 
            onClick={handleRegenerate}
            className="bg-app-gold hover:bg-app-gold/90 text-app-navy font-semibold px-6 py-2 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Grants
          </Button>
        </div>
      )}
    </div>
  );
};

export default Grants;