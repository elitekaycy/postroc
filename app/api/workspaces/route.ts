import { NextResponse } from 'next/server';

// PostRoc uses client-side localStorage for data storage.
// This API endpoint provides information about the data flow.

export async function GET() {
  return NextResponse.json({
    message: 'PostRoc stores data in browser localStorage (client-side only).',
    cliWorkflow: {
      step1: 'Export your workspace from the web app UI',
      step2: 'Import the JSON file into the CLI: postroc import ./workspace.json',
      step3: 'Generate data locally: postroc generate custom-id',
    },
    documentation: 'See CLI_PLAN.md for full CLI documentation',
  });
}
