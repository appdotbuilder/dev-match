import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, X, MessageCircle, Code, MapPin, Calendar, Github, Linkedin, Globe, Twitter, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile, CreateInteractionInput, Match } from '../../server/src/schema';
import { ProfileForm } from '@/components/ProfileForm';
import { ChatView } from '@/components/ChatView';

// Stub data for demonstration since handlers are placeholders
const STUB_USER_ID = 1;

const STUB_PROFILES: UserProfile[] = [
  {
    id: 2,
    email: 'sarah.dev@example.com',
    username: 'sarahcodes',
    first_name: 'Sarah',
    last_name: 'Johnson',
    bio: '🚀 Full-stack developer passionate about React and Node.js. Love building scalable web applications and contributing to open source projects.',
    location: 'San Francisco, CA',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b332c3a4?w=150&h=150&fit=crop&crop=face',
    github_url: 'https://github.com/sarahcodes',
    linkedin_url: 'https://linkedin.com/in/sarahcodes',
    portfolio_url: 'https://sarahcodes.dev',
    twitter_url: 'https://twitter.com/sarahcodes',
    years_of_experience: 5,
    looking_for: 'Looking for exciting collaboration opportunities and side projects',
    availability: 'Available for freelance work',
    profile_status: 'active' as const,
    created_at: new Date('2023-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    id: 3,
    email: 'mike.backend@example.com',
    username: 'mikebuilds',
    first_name: 'Mike',
    last_name: 'Chen',
    bio: '⚡ Backend engineer specializing in microservices and cloud architecture. Always excited to discuss system design and scalability challenges.',
    location: 'Austin, TX',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    github_url: 'https://github.com/mikebuilds',
    linkedin_url: 'https://linkedin.com/in/mikebuilds',
    portfolio_url: null,
    twitter_url: null,
    years_of_experience: 8,
    looking_for: 'Seeking mentorship opportunities and technical leadership roles',
    availability: 'Open to new opportunities',
    profile_status: 'active' as const,
    created_at: new Date('2022-08-10'),
    updated_at: new Date('2024-01-10')
  },
  {
    id: 4,
    email: 'alex.frontend@example.com',
    username: 'alexdesigns',
    first_name: 'Alex',
    last_name: 'Rivera',
    bio: '🎨 Frontend developer and UI/UX enthusiast. I create beautiful, accessible interfaces and love experimenting with the latest design trends.',
    location: 'New York, NY',
    profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    github_url: 'https://github.com/alexdesigns',
    linkedin_url: 'https://linkedin.com/in/alexdesigns',
    portfolio_url: 'https://alexrivera.design',
    twitter_url: 'https://twitter.com/alexdesigns',
    years_of_experience: 3,
    looking_for: 'Looking for creative projects and design-focused collaborations',
    availability: 'Available for part-time projects',
    profile_status: 'active' as const,
    created_at: new Date('2023-03-20'),
    updated_at: new Date('2024-01-20')
  }
];

const STUB_MATCHES: (Match & { user: UserProfile })[] = [
  {
    id: 1,
    user1_id: STUB_USER_ID,
    user2_id: 2,
    status: 'active' as const,
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-01-20'),
    user: STUB_PROFILES[0]
  }
];

function App() {
  const [discoverableProfiles, setDiscoverableProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<(Match & { user: UserProfile })[]>([]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // STUB: In real implementation, this would fetch from the API
      setDiscoverableProfiles(STUB_PROFILES);
      setMatches(STUB_MATCHES);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleSwipe = async (isLike: boolean) => {
    if (!discoverableProfiles[currentProfileIndex]) return;
    
    const targetProfile = discoverableProfiles[currentProfileIndex];
    setIsLoading(true);

    try {
      const interactionData: CreateInteractionInput = {
        user_id: STUB_USER_ID,
        target_user_id: targetProfile.id,
        interaction_type: isLike ? 'like' : 'pass'
      };

      // STUB: In real implementation, this would call the API
      console.log('Creating interaction:', interactionData);

      // Simulate potential match
      if (isLike && Math.random() > 0.5) {
        const newMatch = {
          id: matches.length + 1,
          user1_id: STUB_USER_ID,
          user2_id: targetProfile.id,
          status: 'active' as const,
          created_at: new Date(),
          updated_at: new Date(),
          user: targetProfile
        };
        setMatches(prev => [...prev, newMatch]);
      }

      // Move to next profile
      setCurrentProfileIndex(prev => prev + 1);
    } catch (error) {
      console.error('Failed to create interaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileCard = (profile: UserProfile) => (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-white to-gray-50 shadow-xl">
      <CardHeader className="relative p-0">
        <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage 
              src={profile.profile_image_url || ''} 
              alt={profile.username}
              className="object-cover"
            />
            <AvatarFallback className="rounded-none text-6xl">
              {profile.first_name[0]}{profile.last_name[0]}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <CardTitle className="text-white text-2xl font-bold">
            {profile.first_name} {profile.last_name}, {profile.years_of_experience || 0}
          </CardTitle>
          {profile.location && (
            <div className="flex items-center text-white/90 text-sm mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              {profile.location}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {profile.bio && (
          <CardDescription className="text-gray-700 mb-4 leading-relaxed">
            {profile.bio}
          </CardDescription>
        )}
        
        <div className="space-y-4">
          {profile.looking_for && (
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-gray-900">Looking for</div>
                <div className="text-sm text-gray-600">{profile.looking_for}</div>
              </div>
            </div>
          )}
          
          {profile.availability && (
            <div className="flex items-start gap-2">
              <Briefcase className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm text-gray-900">Availability</div>
                <div className="text-sm text-gray-600">{profile.availability}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {profile.years_of_experience} years experience
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {profile.github_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
              </a>
            </Button>
          )}
          {profile.linkedin_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4" />
              </a>
            </Button>
          )}
          {profile.portfolio_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                <Globe className="w-4 h-4" />
              </a>
            </Button>
          )}
          {profile.twitter_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer">
                <Twitter className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            💻 DevMatch
          </h1>
          <p className="text-gray-600">Find your perfect coding companion</p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Matches ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {currentProfileIndex < discoverableProfiles.length ? (
              <div className="space-y-6">
                {renderProfileCard(discoverableProfiles[currentProfileIndex])}
                
                <div className="flex justify-center gap-6">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleSwipe(false)}
                    disabled={isLoading}
                    className="w-16 h-16 rounded-full border-2 border-red-200 hover:border-red-400 hover:bg-red-50"
                  >
                    <X className="w-8 h-8 text-red-500" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleSwipe(true)}
                    disabled={isLoading}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    <Heart className="w-8 h-8" />
                  </Button>
                </div>
                
                <div className="text-center text-sm text-gray-500">
                  {discoverableProfiles.length - currentProfileIndex} profiles remaining
                </div>
              </div>
            ) : (
              <Card className="max-w-md mx-auto text-center p-8">
                <CardContent>
                  <div className="text-6xl mb-4">🎉</div>
                  <CardTitle className="mb-2">All caught up!</CardTitle>
                  <CardDescription>
                    You've seen all available profiles. Check back later for more developers to connect with!
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            {matches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((match) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={match.user.profile_image_url || ''} />
                          <AvatarFallback>
                            {match.user.first_name[0]}{match.user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {match.user.first_name} {match.user.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">@{match.user.username}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Heart className="w-3 h-3 text-pink-500" />
                            Matched {match.created_at.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="max-w-md mx-auto text-center p-8">
                <CardContent>
                  <div className="text-6xl mb-4">💔</div>
                  <CardTitle className="mb-2">No matches yet</CardTitle>
                  <CardDescription>
                    Start swiping to find your perfect coding match!
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <ChatView matches={matches} currentUserId={STUB_USER_ID} />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileForm currentUserId={STUB_USER_ID} onProfileUpdate={loadUserData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;