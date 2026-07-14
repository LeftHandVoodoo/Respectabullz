export const DEFAULT_FILLABLE_CONTRACT_TEMPLATE_PATH =
  '/contacts/fillable_contract_2.docx';

/**
 * Load the bundled fillable contract template from Vite's public assets.
 */
export async function loadFillableContractTemplate(
  templatePath = DEFAULT_FILLABLE_CONTRACT_TEMPLATE_PATH,
): Promise<ArrayBuffer> {
  const response = await fetch(templatePath);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch template: ${response.status} ${response.statusText}`,
    );
  }

  return response.arrayBuffer();
}
