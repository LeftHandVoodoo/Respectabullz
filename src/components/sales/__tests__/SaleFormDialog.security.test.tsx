import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Sale } from '@/types';

vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const mocks = vi.hoisted(() => ({
  createSale: vi.fn(),
  updateSale: vi.fn(),
  convertInterest: vi.fn(),
}));

vi.mock('@/hooks/useClients', () => ({
  useCreateSale: () => ({ mutateAsync: mocks.createSale, isPending: false }),
  useUpdateSale: () => ({ mutateAsync: mocks.updateSale, isPending: false }),
  useClients: () => ({ data: [] }),
}));

vi.mock('@/hooks/useClientInterests', () => ({
  useConvertInterestToSale: () => ({
    mutateAsync: mocks.convertInterest,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useDogs', () => ({ useDogs: () => ({ data: [] }) }));
vi.mock('@/hooks/useTransport', () => ({ useTransports: () => ({ data: [] }) }));

import { SaleFormDialog } from '../SaleFormDialog';

function saleWithContractPath(contractPath: string): Sale {
  const timestamp = new Date('2026-08-22T12:00:00.000Z');
  return {
    id: 'sale-1',
    clientId: 'client-1',
    saleDate: timestamp,
    price: 1_200,
    depositAmount: null,
    depositDate: null,
    contractPath,
    notes: null,
    shippedDate: null,
    receivedDate: null,
    isLocalPickup: true,
    paymentStatus: 'deposit_only',
    warrantyInfo: null,
    registrationTransferDate: null,
    transportId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    puppies: [],
  };
}

describe('SaleFormDialog contract path handling', () => {
  it.each([
    'javascript:alert(document.domain)',
    'https://example.com/untrusted-contract',
    'C:\\Users\\Example\\Documents\\contract.docx',
  ])('keeps a stored path inert instead of opening it: %s', async (contractPath) => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <SaleFormDialog
        open
        onOpenChange={vi.fn()}
        sale={saleWithContractPath(contractPath)}
      />,
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('/path/to/contract.docx')).toHaveValue(contractPath);
    });
    expect(screen.queryByTitle('Open Contract')).not.toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();

    openSpy.mockRestore();
  });
});
