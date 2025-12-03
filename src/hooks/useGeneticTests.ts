import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '@/lib/db';
import type {
  GeneticTest,
  CreateGeneticTestInput,
  UpdateGeneticTestInput,
  MatingCompatibilityResult,
} from '@/types';

export function useGeneticTests(dogId?: string) {
  return useQuery<GeneticTest[], Error>({
    queryKey: ['geneticTests', dogId],
    queryFn: () => db.getGeneticTests(dogId),
  });
}

export function useGeneticTest(id: string) {
  return useQuery<GeneticTest | null, Error>({
    queryKey: ['geneticTest', id],
    queryFn: () => db.getGeneticTest(id),
    enabled: !!id,
  });
}

export function useCreateGeneticTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGeneticTestInput) => db.createGeneticTest(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['geneticTests'] });
      queryClient.invalidateQueries({ queryKey: ['geneticTests', data.dogId] });
      queryClient.invalidateQueries({ queryKey: ['dog', data.dogId] });
    },
  });
}

export function useUpdateGeneticTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGeneticTestInput }) =>
      db.updateGeneticTest(id, input),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['geneticTests'] });
        queryClient.invalidateQueries({ queryKey: ['geneticTests', data.dogId] });
        queryClient.invalidateQueries({ queryKey: ['geneticTest', data.id] });
        queryClient.invalidateQueries({ queryKey: ['dog', data.dogId] });
      }
    },
  });
}

export function useDeleteGeneticTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => db.deleteGeneticTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geneticTests'] });
    },
  });
}

export function useDogGeneticTestSummary(dogId: string) {
  return useQuery({
    queryKey: ['geneticTestSummary', dogId],
    queryFn: () => db.getDogGeneticTestSummary(dogId),
    enabled: !!dogId,
  });
}

export function useMatingCompatibility(damId: string, sireId: string) {
  return useQuery<MatingCompatibilityResult, Error>({
    queryKey: ['matingCompatibility', damId, sireId],
    queryFn: () => db.checkMatingCompatibility(damId, sireId),
    enabled: !!damId && !!sireId,
  });
}

