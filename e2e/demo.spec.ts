import { expect, test } from '@playwright/test';

test.describe('demo playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with the starter model and a live response_format', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'llm-json-schema' })).toBeVisible();
    await expect(page.getByText('Schema Builder')).toBeVisible();

    // The right pane shows the OpenAI response_format for the starter model.
    const output = page.getByTestId('output-code');
    await expect(output).toContainText('"type": "json_schema"');
    await expect(output).toContainText('"name"'); // starter property
    await expect(output).toContainText('"address"');
  });

  test('adding a field updates the live response_format', async ({ page }) => {
    const output = page.getByTestId('output-code');
    await expect(output).not.toContainText('"field"');

    // The root object's "+ Add field" is the first one in the editor pane.
    await page.locator('.lss-editor-pane').getByRole('button', { name: '+ Add field' }).first().click();

    await expect(output).toContainText('"field"');
  });

  test('switching to the strict profile sets strict:true', async ({ page }) => {
    const output = page.getByTestId('output-code');
    await expect(output).toContainText('"strict": false');

    await page.locator('.lss-output-controls').getByRole('combobox').first().selectOption('strict');

    await expect(output).toContainText('"strict": true');
  });

  test('importing a pasted schema rebuilds the editor and output', async ({ page }) => {
    await page.getByRole('button', { name: 'Import schema…' }).click();

    const schema = JSON.stringify({
      type: 'object',
      properties: { sku: { type: 'string' }, qty: { type: 'integer' } },
      required: ['sku', 'qty'],
      additionalProperties: false,
    });
    await page.locator('.lss-textarea').fill(schema);
    await page.locator('.lss-modal').getByRole('button', { name: 'Import' }).click();

    // Dialog closes (clean import) and the new fields drive the output.
    await expect(page.locator('.lss-modal')).toHaveCount(0);
    const output = page.getByTestId('output-code');
    await expect(output).toContainText('"sku"');
    await expect(output).toContainText('"qty"');
    await expect(output).not.toContainText('"address"');
  });
});
