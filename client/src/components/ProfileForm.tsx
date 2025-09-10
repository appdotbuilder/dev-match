import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, Save, User } from 'lucide-react';

import type { 
  CreateUserProfileInput, 
  ProgrammingLanguage, 
  Technology,
  AddUserSkillInput 
} from '../../../server/src/schema';

interface ProfileFormProps {
  currentUserId: number;
  onProfileUpdate: () => void;
}

// NOTE: Using stub data for demonstration - replace with actual API data
const STUB_LANGUAGES: ProgrammingLanguage[] = [
  { id: 1, name: 'JavaScript', created_at: new Date() },
  { id: 2, name: 'TypeScript', created_at: new Date() },
  { id: 3, name: 'Python', created_at: new Date() },
  { id: 4, name: 'Java', created_at: new Date() },
  { id: 5, name: 'Go', created_at: new Date() },
  { id: 6, name: 'Rust', created_at: new Date() },
  { id: 7, name: 'C++', created_at: new Date() },
  { id: 8, name: 'Swift', created_at: new Date() }
];

const STUB_TECHNOLOGIES: Technology[] = [
  { id: 1, name: 'React', category: 'frontend', created_at: new Date() },
  { id: 2, name: 'Vue.js', category: 'frontend', created_at: new Date() },
  { id: 3, name: 'Angular', category: 'frontend', created_at: new Date() },
  { id: 4, name: 'Node.js', category: 'backend', created_at: new Date() },
  { id: 5, name: 'Express', category: 'backend', created_at: new Date() },
  { id: 6, name: 'Django', category: 'backend', created_at: new Date() },
  { id: 7, name: 'PostgreSQL', category: 'database', created_at: new Date() },
  { id: 8, name: 'MongoDB', category: 'database', created_at: new Date() },
  { id: 9, name: 'Redis', category: 'database', created_at: new Date() },
  { id: 10, name: 'Docker', category: 'devops', created_at: new Date() },
  { id: 11, name: 'Kubernetes', category: 'devops', created_at: new Date() },
  { id: 12, name: 'AWS', category: 'cloud', created_at: new Date() },
  { id: 13, name: 'Azure', category: 'cloud', created_at: new Date() },
  { id: 14, name: 'GCP', category: 'cloud', created_at: new Date() }
];

interface UserSkill {
  id: number;
  name: string;
  category?: string | null;
  proficiency_level: number;
  type: 'language' | 'technology';
}

export function ProfileForm({ currentUserId, onProfileUpdate }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<ProgrammingLanguage[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  
  const [formData, setFormData] = useState<CreateUserProfileInput>({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    bio: null,
    location: null,
    profile_image_url: null,
    github_url: null,
    linkedin_url: null,
    portfolio_url: null,
    twitter_url: null,
    years_of_experience: null,
    looking_for: null,
    availability: null
  });

  // Skill selection state
  const [selectedSkillType, setSelectedSkillType] = useState<'language' | 'technology'>('language');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillProficiency, setSkillProficiency] = useState(3);

  const loadUserProfile = useCallback(async () => {
    try {
      // NOTE: Using stub data for demonstration - replace with actual API calls
      console.log('Loading profile for user:', currentUserId);
      setLanguages(STUB_LANGUAGES);
      setTechnologies(STUB_TECHNOLOGIES);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // NOTE: Using stub data for demonstration - replace with actual API calls
      console.log('Creating new profile:', formData);
      
      onProfileUpdate();
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = async () => {
    if (!selectedSkill) return;
    
    try {
      const skillData: AddUserSkillInput = {
        user_id: currentUserId,
        proficiency_level: skillProficiency,
        ...(selectedSkillType === 'language' 
          ? { language_id: parseInt(selectedSkill) }
          : { technology_id: parseInt(selectedSkill) }
        )
      };

      // NOTE: Using stub data for demonstration - replace with actual API calls
      console.log('Adding skill:', skillData);

      // Add to local state for demonstration
      const skillItem = selectedSkillType === 'language' 
        ? languages.find(l => l.id === parseInt(selectedSkill))
        : technologies.find(t => t.id === parseInt(selectedSkill));

      if (skillItem) {
        const category = selectedSkillType === 'technology' 
          ? (skillItem as Technology).category 
          : null;
          
        const newSkill: UserSkill = {
          id: userSkills.length + 1,
          name: skillItem.name,
          category: category,
          proficiency_level: skillProficiency,
          type: selectedSkillType
        };

        setUserSkills((prev: UserSkill[]) => [...prev, newSkill]);
        setSelectedSkill('');
        setSkillProficiency(3);
      }
    } catch (error) {
      console.error('Failed to add skill:', error);
    }
  };

  const removeSkill = (skillId: number) => {
    setUserSkills((prev: UserSkill[]) => prev.filter(skill => skill.id !== skillId));
  };

  const getProficiencyLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: 'Beginner',
      2: 'Basic',
      3: 'Intermediate', 
      4: 'Advanced',
      5: 'Expert'
    };
    return labels[level] || 'Unknown';
  };

  const getProficiencyColor = (level: number): string => {
    const colors: Record<number, string> = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const availableSkills = selectedSkillType === 'language' ? languages : technologies;
  const filteredSkills = availableSkills.filter(skill => 
    !userSkills.some(userSkill => 
      userSkill.name === skill.name && userSkill.type === selectedSkillType
    )
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Create Profile
          </CardTitle>
          <CardDescription>
            Tell other developers about yourself and what you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ ...prev, username: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserProfileInput) => ({ ...prev, first_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserProfileInput) => ({ ...prev, last_name: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        location: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="years_of_experience">Years of Experience</Label>
                  <Input
                    id="years_of_experience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.years_of_experience || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        years_of_experience: e.target.value ? parseInt(e.target.value) : null 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="profile_image_url">Profile Image URL</Label>
                  <Input
                    id="profile_image_url"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.profile_image_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        profile_image_url: e.target.value || null 
                      }))
                    }
                  />
                  {formData.profile_image_url && (
                    <div className="mt-2">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={formData.profile_image_url} />
                        <AvatarFallback>
                          {formData.first_name[0]}{formData.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    type="url"
                    placeholder="https://github.com/yourusername"
                    value={formData.github_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        github_url: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    placeholder="https://linkedin.com/in/yourusername"
                    value={formData.linkedin_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        linkedin_url: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="portfolio_url">Portfolio URL</Label>
                  <Input
                    id="portfolio_url"
                    type="url"
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        portfolio_url: e.target.value || null 
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="twitter_url">Twitter URL</Label>
                  <Input
                    id="twitter_url"
                    type="url"
                    placeholder="https://twitter.com/yourusername"
                    value={formData.twitter_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserProfileInput) => ({ 
                        ...prev, 
                        twitter_url: e.target.value || null 
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                  rows={4}
                  maxLength={1000}
                  value={formData.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateUserProfileInput) => ({ 
                      ...prev, 
                      bio: e.target.value || null 
                    }))
                  }
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.bio?.length || 0}/1000 characters
                </div>
              </div>

              <div>
                <Label htmlFor="looking_for">What are you looking for?</Label>
                <Textarea
                  id="looking_for"
                  placeholder="e.g., Looking for collaborators on open source projects, seeking mentorship opportunities..."
                  rows={3}
                  maxLength={500}
                  value={formData.looking_for || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateUserProfileInput) => ({ 
                      ...prev, 
                      looking_for: e.target.value || null 
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <Textarea
                  id="availability"
                  placeholder="e.g., Available for freelance work, open to full-time opportunities..."
                  rows={2}
                  maxLength={500}
                  value={formData.availability || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateUserProfileInput) => ({ 
                      ...prev, 
                      availability: e.target.value || null 
                    }))
                  }
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Skills & Technologies</CardTitle>
          <CardDescription>
            Add your programming languages and technologies with proficiency levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Skill Form */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-4">Add New Skill</h3>
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <Label>Type</Label>
                <Select
                  value={selectedSkillType}
                  onValueChange={(value: string) => {
                    setSelectedSkillType(value as 'language' | 'technology');
                    setSelectedSkill('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="language">Programming Language</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Skill</Label>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSkills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id.toString()}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Proficiency Level</Label>
                <Select 
                  value={skillProficiency.toString()} 
                  onValueChange={(value: string) => setSkillProficiency(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} - {getProficiencyLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={addSkill} disabled={!selectedSkill}>
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </div>

          {/* Skills List */}
          {userSkills.length > 0 && (
            <div>
              <h3 className="font-medium mb-4">Your Skills</h3>
              <div className="flex flex-wrap gap-2">
                {userSkills.map((skill) => (
                  <Badge 
                    key={skill.id} 
                    variant="secondary" 
                    className={`${getProficiencyColor(skill.proficiency_level)} flex items-center gap-2`}
                  >
                    {skill.name}
                    <span className="text-xs">({getProficiencyLabel(skill.proficiency_level)})</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => removeSkill(skill.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}