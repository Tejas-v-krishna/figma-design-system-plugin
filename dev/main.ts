// Dev harness entry. Installs the mock sandbox first so the UI's very first
// message (LOAD_CONFIG, sent from App's mount effect) already has a listener,
// then hands off to the real UI entry unchanged.
import { installMockPlugin } from './mock-plugin';

installMockPlugin();

import('../src/ui/index');
