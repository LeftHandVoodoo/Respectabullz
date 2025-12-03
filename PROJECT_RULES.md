# Respectabullz Project Rules

## Overview

This document provides guidelines for AI assistants (like Cursor) working on this codebase.

## Tech Stack

- **Desktop Shell**: Tauri 2.x (Rust-based)
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database**: SQLite via Prisma ORM (localStorage for dev)
- **State**: TanStack Query (React Query v5)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

## Code Patterns

### Component Structure

```typescript
// Page component pattern
export function EntityPage() {
  const { data, isLoading } = useEntities();
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Title</h2>
          <p className="text-muted-foreground">Description</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entity
        </Button>
      </div>

      {/* Filters */}
      {/* Table */}
      {/* Dialog */}
    </div>
  );
}
```

### Form Dialog Pattern

```typescript
export function EntityFormDialog({ open, onOpenChange, entity }: Props) {
  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const isEditing = !!entity;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { ... },
  });

  const onSubmit = async (data: FormData) => {
    if (isEditing) {
      await updateEntity.mutateAsync({ id: entity.id, data });
    } else {
      await createEntity.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Form fields */}
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Data Hook Pattern

```typescript
export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: db.getEntities,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: db.createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast({ title: 'Success', description: 'Entity created.' });
    },
    onError: () => {
      toast({ title: 'Error', variant: 'destructive' });
    },
  });
}
```

## Styling Guidelines

### Brand Colors

```css
--brand-beige: #fbf1e5   /* Light backgrounds */
--brand-brown: #6e5e44   /* Text, accents */
--brand-blue: #303845    /* Primary, dark mode */
```

### Tailwind Classes

- Use `space-y-6` for page section spacing
- Use `gap-4` for grid/flex item spacing
- Use `rounded-lg border bg-card` for card containers
- Use `text-muted-foreground` for secondary text

### Component Sizing

- Page titles: `text-2xl font-bold`
- Section titles: `text-lg font-semibold`
- Body text: Default (text-sm)
- Muted text: `text-sm text-muted-foreground`

## File Organization

```
src/
├── components/
│   ├── ui/           # shadcn components (don't modify)
│   ├── layout/       # App shell (Sidebar, Header)
│   └── [entity]/     # Entity-specific components
├── hooks/
│   └── use[Entity].ts
├── pages/
│   └── [Entity]Page.tsx
├── lib/
│   ├── db.ts         # Database operations
│   └── utils.ts      # Utility functions
└── types/
    └── index.ts      # All TypeScript types
```

## Database Conventions

### Entity Fields

- Always include `id`, `createdAt`, `updatedAt`
- Use nullable (`?`) for optional fields
- Foreign keys named as `entityId` (e.g., `dogId`)
- Store dates as `DateTime`, not strings

### Relationships

- Use `onDelete: Cascade` for owned relationships
- Keep relationships normalized (no duplicated data)
- Populate relations in `get[Entity]` functions

## Form Validation

Use Zod schemas matching TypeScript types:

```typescript
const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
  date: z.string().min(1, 'Required'), // Convert to Date on submit
  amount: z.string().min(1).transform(parseFloat),
});
```

## Error Handling

- Use try/catch in database operations
- Log errors with `console.error`
- Show user-friendly toast messages
- Never expose internal errors to UI

## Testing Considerations

- Components should be testable in isolation
- Database layer uses localStorage for easy testing
- Forms validate before submission
- All async operations handle loading/error states

## Accessibility

- Use semantic HTML elements
- Include `sr-only` labels for icon-only buttons
- Ensure keyboard navigation works
- Use Radix UI primitives for complex interactions

## Performance

- Use TanStack Query caching
- Don't fetch unnecessary data
- Lazy load heavy components if needed
- Avoid re-renders with proper key props

## Future Development

When adding new features:

1. Add Prisma model to `schema.prisma`
2. Add TypeScript types to `types/index.ts`
3. Add database functions to `lib/db.ts`
4. Create React hooks in `hooks/use[Entity].ts`
5. Create page component in `pages/`
6. Create form dialog in `components/[entity]/`
7. Add route to `App.tsx`
8. Add navigation link to `Sidebar.tsx`
9. Update `CHANGELOG.md`
10. Update relevant documentation files (`docs/DATA_MODEL.md`, `docs/API.md`, `docs/ARCHITECTURE.md`)

### New Feature Patterns (v0.8.0+)

**Puppy Health Tasks:**
- Tasks auto-generated from schedule template when litter is whelped
- Support both litter-wide and per-puppy tasks
- Track completion with progress indicators

**Waitlist Management:**
- Automatic position assignment based on creation order
- Deposit tracking with status workflow
- One-click conversion to sale

**Communication Logging:**
- Chronological timeline display
- Follow-up reminder system
- Link to related litters for context

**Genetic Testing:**
- Pre-populated common test types
- Mating compatibility analysis
- Visual status indicators (clear/carrier/affected)

**Pedigree Display:**
- Recursive ancestor lookup
- Visual tree layout
- Export capabilities

