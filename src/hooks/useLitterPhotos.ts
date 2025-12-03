import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLitterPhotos,
  createLitterPhoto,
  updateLitterPhoto,
  deleteLitterPhoto,
  reorderLitterPhotos,
} from '@/lib/db';
import type { CreateLitterPhotoInput, UpdateLitterPhotoInput } from '@/types';

export function useLitterPhotos(litterId: string | undefined) {
  return useQuery({
    queryKey: ['litterPhotos', litterId],
    queryFn: () => getLitterPhotos(litterId!),
    enabled: !!litterId,
  });
}

export function useCreateLitterPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLitterPhotoInput) => createLitterPhoto(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['litterPhotos', data.litterId] });
      queryClient.invalidateQueries({ queryKey: ['litter', data.litterId] });
    },
  });
}

export function useUpdateLitterPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLitterPhotoInput }) =>
      updateLitterPhoto(id, data),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['litterPhotos', data.litterId] });
        queryClient.invalidateQueries({ queryKey: ['litter', data.litterId] });
      }
    },
  });
}

export function useDeleteLitterPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, litterId }: { id: string; litterId: string }) =>
      deleteLitterPhoto(id).then((success) => ({ success, litterId })),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['litterPhotos', result.litterId] });
        queryClient.invalidateQueries({ queryKey: ['litter', result.litterId] });
      }
    },
  });
}

export function useReorderLitterPhotos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ litterId, photoIds }: { litterId: string; photoIds: string[] }) =>
      reorderLitterPhotos(litterId, photoIds).then(() => litterId),
    onSuccess: (litterId) => {
      queryClient.invalidateQueries({ queryKey: ['litterPhotos', litterId] });
      queryClient.invalidateQueries({ queryKey: ['litter', litterId] });
    },
  });
}

