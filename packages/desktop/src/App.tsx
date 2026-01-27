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
 * v1 supports procedural mode only (seed → stack → files):
 * - Seed Generator: Enter a seed number to generate a project
 * - Stack Composer: Compose a custom tech stack interactively
 * - Seed Gallery: Browse pre-validated seeds from the registry
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
        {/* Templates page kept for backward compatibility but shows v1 scope message */}
        <Route path="templates" element={<TemplateSelectorPage />} />
        <Route path="gallery" element={<SeedGalleryPage />} />
        <Route path="cli" element={<CLICommandsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
