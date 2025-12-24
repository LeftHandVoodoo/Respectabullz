import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import {
  useCreateContact,
  useUpdateContact,
  useContactCategories,
  useCreateContactCategory,
} from '@/hooks/useContacts';
import type { ContactWithRelations, ContactCategory } from '@/types';
import { Facebook, Instagram, Globe, Twitter } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  phonePrimary: z.string().optional(),
  phoneSecondary: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  twitter: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: ContactWithRelations;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
}: ContactFormDialogProps) {
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const { data: categories = [] } = useContactCategories();
  const createCategory = useCreateContactCategory();
  const isEditing = !!contact;

  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      categoryIds: [],
    },
  });

  // Build category options for MultiSelect
  const categoryOptions: MultiSelectOption[] = useMemo(() => {
    return categories.map((cat: ContactCategory) => ({
      value: cat.id,
      label: cat.name,
      color: cat.color || undefined,
    }));
  }, [categories]);

  // Populate form when editing
  useEffect(() => {
    if (contact && open) {
      reset({
        name: contact.name,
        companyName: contact.companyName || '',
        phonePrimary: contact.phonePrimary || '',
        phoneSecondary: contact.phoneSecondary || '',
        email: contact.email || '',
        addressLine1: contact.addressLine1 || '',
        addressLine2: contact.addressLine2 || '',
        city: contact.city || '',
        state: contact.state || '',
        postalCode: contact.postalCode || '',
        facebook: contact.facebook || '',
        instagram: contact.instagram || '',
        tiktok: contact.tiktok || '',
        twitter: contact.twitter || '',
        website: contact.website || '',
        notes: contact.notes || '',
        categoryIds: contact.categories?.map((c) => c.id) || [],
      });
    } else if (!contact && open) {
      reset({
        name: '',
        companyName: '',
        phonePrimary: '',
        phoneSecondary: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        facebook: '',
        instagram: '',
        tiktok: '',
        twitter: '',
        website: '',
        notes: '',
        categoryIds: [],
      });
    }
  }, [contact, open, reset]);

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      await createCategory.mutateAsync({
        name: newCategoryName.trim(),
        isPredefined: false,
      });
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    const contactData = {
      name: data.name,
      companyName: data.companyName || null,
      phonePrimary: data.phonePrimary || null,
      phoneSecondary: data.phoneSecondary || null,
      email: data.email || null,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      facebook: data.facebook || null,
      instagram: data.instagram || null,
      tiktok: data.tiktok || null,
      twitter: data.twitter || null,
      website: data.website || null,
      notes: data.notes || null,
      categoryIds: data.categoryIds || [],
    };

    if (isEditing && contact) {
      await updateContact.mutateAsync({ id: contact.id, data: contactData });
    } else {
      await createContact.mutateAsync(contactData);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Contact name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...register('companyName')}
                  placeholder="Company or business name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phonePrimary">Primary Phone</Label>
                <PhoneInput id="phonePrimary" {...register('phonePrimary')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneSecondary">Secondary Phone</Label>
                <PhoneInput id="phoneSecondary" {...register('phoneSecondary')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Categories Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Categories</h4>
            <div className="space-y-2">
              <Controller
                name="categoryIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={categoryOptions}
                    selected={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select categories..."
                    className="w-full"
                  />
                )}
              />
              {!showAddCategory ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCategory(true)}
                >
                  + Add custom category
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCategory}
                    disabled={createCategory.isPending}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Address Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Address</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Street Address</Label>
                <Input
                  id="addressLine1"
                  {...register('addressLine1')}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Apt/Suite/Unit</Label>
                <Input
                  id="addressLine2"
                  {...register('addressLine2')}
                  placeholder="Apt 4B"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register('state')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">ZIP</Label>
                  <Input id="postalCode" {...register('postalCode')} />
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Social Media</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  {...register('facebook')}
                  placeholder="facebook.com/username or username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  {...register('instagram')}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok" className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                  TikTok
                </Label>
                <Input
                  id="tiktok"
                  {...register('tiktok')}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter/X
                </Label>
                <Input
                  id="twitter"
                  {...register('twitter')}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  {...register('website')}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional notes about this contact..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
