import { useState, useMemo } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useUpdateLitter } from '@/hooks/useLitters';
import type { Litter } from '@/types';

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  completedDate?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  description: string;
  items: ChecklistItem[];
}

const DEFAULT_CHECKLIST: ChecklistSection[] = [
  {
    id: 'two_weeks_before',
    title: '2 Weeks Before Due Date',
    description: 'Preparation phase',
    items: [
      { id: 'whelping_box', label: 'Whelping box set up', description: 'Clean, sanitized, appropriate size', completed: false },
      { id: 'heat_source', label: 'Heat lamp / heating pad ready', description: 'Test before use', completed: false },
      { id: 'supplies', label: 'Whelping supplies stocked', description: 'Hemostats, suction bulb, towels, scale', completed: false },
      { id: 'vet_contact', label: 'Vet emergency number posted', description: 'Including after-hours contact', completed: false },
      { id: 'transport_plan', label: 'Emergency transport plan', description: 'Know route to emergency vet', completed: false },
    ],
  },
  {
    id: 'one_week_before',
    title: '1 Week Before Due Date',
    description: 'Final preparations',
    items: [
      { id: 'area_sanitized', label: 'Whelping area sanitized', description: 'Deep clean the area', completed: false },
      { id: 'milk_replacer', label: 'Milk replacer on hand', description: 'In case dam cannot nurse', completed: false },
      { id: 'puppy_collars', label: 'Puppy ID collars ready', description: 'Different colors for identification', completed: false },
      { id: 'weight_sheet', label: 'Weight tracking sheet prepared', description: 'Chart for daily weights', completed: false },
      { id: 'camera_ready', label: 'Camera/recording ready', description: 'For documentation', completed: false },
    ],
  },
  {
    id: 'during_whelping',
    title: 'Day of / After Whelping',
    description: 'Critical tasks',
    items: [
      { id: 'birth_times', label: 'Record time of each birth', completed: false },
      { id: 'birth_weights', label: 'Record birth weight of each puppy', completed: false },
      { id: 'placentas', label: 'Placentas accounted for', description: 'One per puppy', completed: false },
      { id: 'dam_eating', label: 'Dam eating and drinking', completed: false },
      { id: 'all_nursing', label: 'All puppies nursing within 2 hours', completed: false },
      { id: 'temperature_check', label: 'Temperature monitoring', description: 'Keep whelping area 85-90°F', completed: false },
    ],
  },
];

interface WhelpingChecklistProps {
  litter: Litter;
}

export function WhelpingChecklist({ litter }: WhelpingChecklistProps) {
  const updateLitter = useUpdateLitter();
  
  // Initialize checklist from litter state or default
  const initialChecklist = useMemo(() => {
    if (litter.whelpingChecklistState) {
      try {
        const saved = JSON.parse(litter.whelpingChecklistState) as ChecklistSection[];
        if (Array.isArray(saved) && saved.length > 0) {
          return saved;
        }
      } catch (e) {
        console.error('Failed to parse checklist state:', e);
      }
    }
    return DEFAULT_CHECKLIST;
  }, [litter.whelpingChecklistState]);
  
  const [checklist, setChecklist] = useState<ChecklistSection[]>(initialChecklist);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['two_weeks_before', 'one_week_before', 'during_whelping']));

  // Calculate progress
  const totalItems = checklist.reduce((acc, section) => acc + section.items.length, 0);
  const completedItems = checklist.reduce(
    (acc, section) => acc + section.items.filter(item => item.completed).length, 
    0
  );
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleItem = async (sectionId: string, itemId: string) => {
    const newChecklist = checklist.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        items: section.items.map(item => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            completed: !item.completed,
            completedDate: !item.completed ? new Date().toISOString() : undefined,
          };
        }),
      };
    });
    
    setChecklist(newChecklist);
    
    // Save to database
    await updateLitter.mutateAsync({
      id: litter.id,
      data: {
        whelpingChecklistState: JSON.stringify(newChecklist),
      },
    });
  };

  const resetChecklist = async () => {
    setChecklist(DEFAULT_CHECKLIST);
    await updateLitter.mutateAsync({
      id: litter.id,
      data: {
        whelpingChecklistState: null,
      },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Whelping Checklist</CardTitle>
            <CardDescription>
              Track your preparation progress
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetChecklist}
            className="text-xs"
          >
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{completedItems} / {totalItems} completed</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {checklist.map((section) => {
            const sectionCompleted = section.items.filter(i => i.completed).length;
            const sectionTotal = section.items.length;
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id} className="border rounded-lg">
                <button
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <h4 className="font-medium text-sm">{section.title}</h4>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sectionCompleted === sectionTotal && sectionTotal > 0 && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {sectionCompleted}/{sectionTotal}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2 border-t">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 py-2 rounded-lg px-2 ${
                          item.completed ? 'bg-muted/30 opacity-70' : ''
                        }`}
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.completed}
                          onCheckedChange={() => toggleItem(section.id, item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={item.id}
                            className={`text-sm cursor-pointer ${
                              item.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.label}
                          </label>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

