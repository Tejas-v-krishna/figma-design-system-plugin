// Dev harness entry. Installs the mock sandbox first so the UI's very first
// message (LOAD_CONFIG, sent from App's mount effect) already has a listener,
// then hands off to the real UI entry unchanged.
import { installMockPlugin } from './mock-plugin';

installMockPlugin();

// Loaded dynamically so installMockPlugin() above has already run by the time
// the UI's mount effects fire. The catch matters in dev: a syntax error in the
// UI entry would otherwise show as a blank page with nothing in the console.
import('../src/ui/index').catch((err: unknown) => {
  console.error('[dev harness] failed to load the UI entry:', err);
});
