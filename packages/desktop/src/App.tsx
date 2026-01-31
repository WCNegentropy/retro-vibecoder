import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SeedGeneratorPage from './pages/SeedGeneratorPage';
import StackComposerPage from './pages/StackComposerPage';
import TemplateSelectorPage from './pages/TemplateSelectorPage';
import SeedGalleryPage from './pages/SeedGalleryPage';
import CLICommandsPage from './pages/CLICommandsPage';
import SettingsPage from './pages/SettingsPage';

/**
 * UPG Desktop Application
 *
 * - Seed Generator: Enter a seed number to generate a deterministic project
 * - Stack Composer: Compose a custom tech stack interactively
 * - Template Selector: Generate projects from UPG manifest templates (Nunjucks)
 * - Seed Gallery: Browse pre-validated seeds from the registry
 * - CLI Commands: Execute UPG CLI commands directly
 * - Settings: Configure appearance and generation defaults
 *
 * Features retro Windows 95 aesthetic with RGB rainbow border
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="seed" element={<SeedGeneratorPage />} />
        <Route path="compose" element={<StackComposerPage />} />
        <Route path="templates" element={<TemplateSelectorPage />} />
        <Route path="gallery" element={<SeedGalleryPage />} />
        <Route path="cli" element={<CLICommandsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
