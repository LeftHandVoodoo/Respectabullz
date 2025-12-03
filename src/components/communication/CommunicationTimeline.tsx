import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, Mail, MessageSquare, Users, Video, Share2, ArrowUp, ArrowDown, Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useCommunicationLogs,
  useDeleteCommunicationLog,
  useCompleteFollowUp,
} from '@/hooks/useCommunicationLogs';
import { CommunicationFormDialog } from './CommunicationFormDialog';
import { formatDate } from '@/lib/utils';
import type { CommunicationLog, CommunicationType } from '@/types';

const typeIcons: Record<CommunicationType, React.ReactNode> = {
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  text: <MessageSquare className="h-4 w-4" />,
  in_person: <Users className="h-4 w-4" />,
  video_call: <Video className="h-4 w-4" />,
  social_media: <Share2 className="h-4 w-4" />,
};

const typeColors: Record<CommunicationType, string> = {
  phone: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  email: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  text: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  in_person: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  video_call: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  social_media: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

interface CommunicationTimelineProps {
  clientId: string;
}

export function CommunicationTimeline({ clientId }: CommunicationTimelineProps) {
  const { data: logs, isLoading } = useCommunicationLogs(clientId);
  const deleteLog = useDeleteCommunicationLog();
  const completeFollowUp = useCompleteFollowUp();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLog, setEditingLog] = useState<CommunicationLog | undefined>();

  const now = new Date();

  const isOverdue = (log: CommunicationLog) => {
    return log.followUpNeeded && 
           !log.followUpCompleted && 
           log.followUpDate && 
           new Date(log.followUpDate) < now;
  };

  const isDueSoon = (log: CommunicationLog) => {
    if (!log.followUpNeeded || log.followUpCompleted || !log.followUpDate) return false;
    const followUpDate = new Date(log.followUpDate);
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return followUpDate >= now && followUpDate <= sevenDays;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading communications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Communication History</CardTitle>
              <CardDescription>
                Track all interactions with this client
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => {
              setEditingLog(undefined);
              setShowAddDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!logs || logs.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No communications logged</p>
              <p className="text-sm">Start tracking your interactions with this client</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

              {/* Timeline items */}
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="relative flex gap-4 pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-2 border-background ${
                      typeColors[log.type]?.split(' ')[0] || 'bg-gray-100'
                    }`} />

                    {/* Content */}
                    <div className={`flex-1 p-4 rounded-lg border ${
                      isOverdue(log) 
                        ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' 
                        : isDueSoon(log)
                        ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800'
                        : ''
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={`${typeColors[log.type]}`}>
                            <span className="mr-1">{typeIcons[log.type]}</span>
                            {log.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.direction === 'inbound' ? (
                              <><ArrowDown className="h-3 w-3 mr-1" /> Inbound</>
                            ) : (
                              <><ArrowUp className="h-3 w-3 mr-1" /> Outbound</>
                            )}
                          </Badge>
                          {log.followUpNeeded && !log.followUpCompleted && (
                            <Badge variant={isOverdue(log) ? 'destructive' : isDueSoon(log) ? 'warning' : 'secondary'}>
                              <Bell className="h-3 w-3 mr-1" />
                              Follow-up: {log.followUpDate ? formatDate(log.followUpDate) : 'No date'}
                            </Badge>
                          )}
                          {log.followUpCompleted && (
                            <Badge variant="outline" className="text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Follow-up done
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {log.followUpNeeded && !log.followUpCompleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              onClick={() => completeFollowUp.mutate(log.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingLog(log);
                              setShowAddDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Communication?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this communication record. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteLog.mutate(log.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <p className="text-sm mt-2">{log.summary}</p>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{formatDate(log.date)}</span>
                        {log.relatedLitter && (
                          <>
                            <span>•</span>
                            <span>Litter: {log.relatedLitter.code}</span>
                          </>
                        )}
                      </div>
                      
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{log.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CommunicationFormDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingLog(undefined);
        }}
        clientId={clientId}
        log={editingLog}
      />
    </div>
  );
}

