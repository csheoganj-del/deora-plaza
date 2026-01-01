import { diagnoseReport } from './actions/diagnose';

async function run() {
    await diagnoseReport('2025-12-30');
}

run();
